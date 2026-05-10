// backend/src/modules/account/account.factory.ts
import { AccountService } from './account.service';
import { AccountRepository } from './account.repository';
import { MailService } from '../mail/mail.service';
import type { Env } from '../../env';
import { MailRepository } from '../mail/mail.repository';

export function createAccountService(env: Env): AccountService {
    const repo = new AccountRepository();
    const mailService = new MailService(new MailRepository(), env);
    return new AccountService(repo, mailService, env);
}