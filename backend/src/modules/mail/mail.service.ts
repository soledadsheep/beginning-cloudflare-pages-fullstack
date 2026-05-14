// backend/src/modules/mail/mail.service.ts
import { MailOptions, EmailProvider, LimitConfig } from './mail.types';
import { MailRepository } from './mail.repository';
import { sendViaProvider } from './mail.providers';
import type { Env } from '../../env';

export class MailService {
    constructor(private repo: MailRepository, private env: Env) { }

    async queueMail(options: MailOptions, priority: number = 0, scheduledAt?: Date): Promise<number> {
        const mailFrom = options.from || this.env.MAIL_FROM || 'noreply@yourdomain.com';
        if (!options.text && !options.html) throw new Error('Either text or html content must be provided');
        return await this.repo.insertEmail({
            to_email: options.to,
            from_email: mailFrom,
            subject: options.subject,
            text_body: options.text,
            html_body: options.html,
            max_retries: 3,
            scheduled_at: scheduledAt?.toISOString(),
            priority,
        });
    }

    async processQueue(limit: number = 10): Promise<{ processed: number; success: number; failed: number }> {
        const emails = await this.repo.getPendingEmails(limit);
        let success = 0, failed = 0;

        for (const email of emails) {
            const mailOptions: MailOptions = {
                from: email.from_email,
                to: email.to_email,
                subject: email.subject,
                text: email.text_body ?? undefined,
                html: email.html_body ?? undefined,
            };

            let sent = false;
            for (const provider of await this.repo.getActiveProvidersSorted()) {
                try {
                    await this.sendViaProvider(provider, mailOptions);
                    sent = true;
                    break;
                } catch (err: any) {
                    console.error(`Provider ${provider.name} failed:`, err.message);
                }
            }

            if (sent) {
                await this.repo.updateEmailStatus(email.id, 'sent');
                success++;
            } else if (email.retry_count + 1 >= email.max_retries) {
                await this.repo.updateEmailStatus(email.id, 'failed', 'Exhausted all providers and retries');
                failed++;
            } else {
                await this.repo.incrementRetryAndReschedule(email.id);
                failed++;
            }
        }
        return { processed: emails.length, success, failed };
    }

    private async sendViaProvider(provider: EmailProvider, options: MailOptions): Promise<void> {
        // Kiểm tra giới hạn và reset chu kỳ trước khi gửi
        const finalProvider = (await this.repo.resetExpiredCycles(provider)) || provider;
        if (!this.isWithinLimits(finalProvider)) throw new Error(`Provider ${finalProvider.name} exceeded limit`);

        try {
            await sendViaProvider(finalProvider, options);
            const cycles = Object.keys(JSON.parse(finalProvider.limits) as LimitConfig);
            await this.repo.incrementProviderUsage(finalProvider.id, cycles);
            await this.repo.logSending(finalProvider.id, options.to, options.subject, 'sent');
        } catch (err: any) {
            await this.repo.logSending(finalProvider.id, options.to, options.subject, 'failed', err.message);
            throw err;
        }
    }

    private isWithinLimits(provider: EmailProvider): boolean {
        const limits = JSON.parse(provider.limits) as LimitConfig;
        const usage = JSON.parse(provider.usage);
        for (const [cycle, rule] of Object.entries(limits)) {
            const limit = rule.limit;
            const used = usage[cycle]?.count ?? 0;
            if (used >= limit) return false;
        }
        return true;
    }

}