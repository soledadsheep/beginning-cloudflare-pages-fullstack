// backend/src/modules/mail/mail.scheduler.ts
import { MailRepository } from './mail.repository';
import type { Env } from '../../env';

/** Chạy mỗi giờ để reset các provider đã hết chu kỳ */
export async function scheduledResetLimits(env: Env) {
    const repo = new MailRepository();
    const providers = await repo.getActiveProvidersSorted();
    for (const provider of providers) {
        await repo.resetExpiredCycles(provider);
    }
    console.log('Scheduled limit reset completed');
}