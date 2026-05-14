// backend/src/modules/mail/mail.repository.ts
import { getDb } from '../../shared/db/d1';
import type {
    EmailQueueItem, InsertEmailInput,
    EmailProvider, LimitConfig, UsageData, UsageItem
} from './mail.types';
import CronExpressionParser, * as cronParser from 'cron-parser';

export class MailRepository {
    constructor() { }

    /** ==================== Email Queue ==================== */
    async insertEmail(options: InsertEmailInput): Promise<number> {
        const result = await getDb()
            .prepare(`
                INSERT INTO email_queue
                (to_email, from_email, subject, text_body, html_body, status, retry_count, max_retries, scheduled_at, priority)
                VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, COALESCE(?, CURRENT_TIMESTAMP), ?)
            `)
            .bind(
                options.to_email,
                options.from_email,
                options.subject,
                options.text_body ?? null,
                options.html_body ?? null,
                options.max_retries ?? 3,
                options.scheduled_at ?? null,
                options.priority ?? 0
            )
            .run();
        return result.meta.last_row_id as number;
    }

    async getPendingEmails(limit: number = 10): Promise<EmailQueueItem[]> {
        const result = await getDb()
            .prepare(`
                SELECT * FROM email_queue
                WHERE status = 'pending' AND scheduled_at <= CURRENT_TIMESTAMP
                ORDER BY priority ASC, created_at ASC
                LIMIT ?
            `)
            .bind(limit)
            .all<EmailQueueItem>();
        return result.results;
    }

    async updateEmailStatus(id: number, status: 'sent' | 'failed', error?: string): Promise<void> {
        await getDb()
            .prepare(`
                UPDATE email_queue
                SET status = ?, last_error = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `)
            .bind(status, error || null, id)
            .run();
    }

    async incrementRetryAndReschedule(id: number, nextRetryDelayMinutes: number = 5): Promise<void> {
        await getDb()
            .prepare(`
                UPDATE email_queue
                SET retry_count = retry_count + 1,
                    scheduled_at = datetime('now', '+' || ? || ' minutes'),
                    status = 'pending',
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `)
            .bind(nextRetryDelayMinutes, id)
            .run();
    }

    //* Xóa các email đã gửi cũ hơn X ngày (default 7 ngày) */
    async deleteOldSentEmails(daysOld: number = 7): Promise<void> {
        await getDb()
            .prepare(`DELETE FROM email_queue WHERE status = 'sent' AND created_at < datetime('now', '-' || ? || ' days')`)
            .bind(daysOld)
            .run();
    }

    /** ==================== Provider Management (đa giới hạn) ==================== */
    //** Lấy tất cả provider đang active, sắp xếp theo priority */
    async getActiveProvidersSorted(): Promise<EmailProvider[]> {
        const result = await getDb()
            .prepare(`
                SELECT * FROM email_provider
                WHERE is_active = 1
                ORDER BY priority ASC, id ASC
            `)
            .all<EmailProvider>();
        return result.results;
    }

    /** Cập nhật usage cho provider sau khi gửi thành công */
    async incrementProviderUsage(providerId: number, cyclesToUpdate: string[]): Promise<void> {
        const provider = await this.getProviderById(providerId);
        if (!provider) return;

        const usage = JSON.parse(provider.usage) as UsageData;
        const now = new Date();

        for (const cycle of cyclesToUpdate) {
            const current = usage[cycle] || { count: 0, resetTime: null };
            usage[cycle] = {
                count: current.count + 1,
                resetTime: current.resetTime  // giữ nguyên resetTime cũ
            };
        }

        await getDb()
            .prepare(`
                UPDATE email_provider
                SET usage = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `)
            .bind(JSON.stringify(usage), providerId)
            .run();
    }

    /** Lấy provider theo id */
    async getProviderById(id: number): Promise<EmailProvider | null> {
        const result = await getDb()
            .prepare('SELECT * FROM email_provider WHERE id = ?')
            .bind(id)
            .first<EmailProvider>();
        return result ?? null;
    }

    /** Log kết quả gửi email */
    async logSending(providerId: number, recipientEmail: string, subject: string, status: 'sent' | 'failed', errorMessage?: string): Promise<void> {
        await getDb()
            .prepare(`
                INSERT INTO email_sending_log (provider_id, recipient_email, subject, status, error_message)
                VALUES (?, ?, ?, ?, ?)
            `)
            .bind(providerId, recipientEmail, subject, status, errorMessage ?? null)
            .run();
    }

    /** Kiểm tra và reset các chu kỳ đã hết hạn */
    async resetExpiredCycles(provider: EmailProvider): Promise<EmailProvider | null> {
        const limits = JSON.parse(provider.limits) as LimitConfig;
        const usage = JSON.parse(provider.usage) as UsageData;
        const now = new Date();
        let changed = false;

        for (const cycle of Object.keys(limits)) {
            const rule = limits[cycle];
            if (!rule) {
                console.warn(`Không tìm thấy cấu hình cho chu kỳ ${cycle} của provider ${provider.name}`);
                continue;
            }
            let expectedWindowStart: Date | null = null;

            // Xác định window start dựa trên loại window
            if (rule.window_type === 'fixed') {
                if (!rule.reset_cron) throw new Error(`Missing reset_cron for fixed window ${cycle}`);
                const tz = rule.timezone || 'UTC';
                expectedWindowStart = this.getFixedWindowStart(rule.reset_cron, tz, now);
            } else { // sliding
                const duration = rule.duration_seconds;
                if (!duration) throw new Error(`Missing duration_seconds for sliding window ${cycle}`);
                expectedWindowStart = this.getSlidingWindowStart(duration, now);
            }

            const currentItem = usage[cycle];
            let currentWindowStart = currentItem?.resetTime ? new Date(currentItem.resetTime) : null;
            let currentCount = currentItem?.count ?? 0;

            // Nếu chưa có windowStart hoặc windowStart cũ khác với windowStart kỳ vọng => reset
            if (!currentWindowStart || currentWindowStart.getTime() !== expectedWindowStart.getTime()) {
                usage[cycle] = {
                    count: 0,
                    resetTime: expectedWindowStart.toISOString()
                };
                changed = true;
            }
            // Nếu đã đúng windowStart, giữ nguyên count (không reset)
        }

        if (changed) {
            await getDb()
                .prepare(`UPDATE email_provider SET usage = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
                .bind(JSON.stringify(usage), provider.id)
                .run();
            return { ...provider, usage: JSON.stringify(usage) };
        }
        return null;
    }

    /** ========== Helper methods cho chu kỳ ========== */
    /** Tính thời điểm bắt đầu của cửa sổ hiện tại dựa trên cron (fixed window) */
    private getFixedWindowStart(cronExpr: string, timezone: string, baseDate: Date): Date {
        try {
            const interval = CronExpressionParser.parse(cronExpr, {
                currentDate: baseDate,
                tz: timezone
            });
            return interval.prev().toDate();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Invalid cron expression "${cronExpr}" for timezone "${timezone}": ${errorMessage}`);
        }
    }

    /** Tính thời điểm bắt đầu của cửa sổ sliding (dựa trên duration_seconds) */
    private getSlidingWindowStart(durationSeconds: number, baseDate: Date): Date {
        return new Date(baseDate.getTime() - (baseDate.getTime() % (durationSeconds * 1000)));
    }

}