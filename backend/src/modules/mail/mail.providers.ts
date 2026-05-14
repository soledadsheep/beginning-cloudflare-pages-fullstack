// backend/src/modules/mail/mail.providers.ts
import { MailOptions, EmailProvider } from './mail.types';

/**
 * Gửi email qua provider config trong database.
 * @param provider - Đối tượng provider từ database (đã parse sẵn các trường)
 * @param mailOptions - Nội dung email
 */
export async function sendViaProvider(provider: EmailProvider, mailOptions: MailOptions): Promise<void> {
    // Lấy endpoint, method
    const endpoint = provider.endpoint_url;
    if (!endpoint) {
        throw new Error(`Provider ${provider.name} không có endpoint_url cấu hình`);
    }
    const method = provider.req_method || 'POST';

    // Parse settings (chứa apiKey, domain, user, pass, ...)
    let providerSettings: any = {};
    try {
        providerSettings = JSON.parse(provider.settings || '{}');
    } catch (e) {
        throw new Error(`Invalid settings JSON for provider ${provider.name}`);
    }

    // Xử lý req_header
    let headers: Record<string, string> = { 'Content-Type': 'application/json' }; // mặc định
    if (provider.req_header) {
        try {
            const headerTemplate = JSON.parse(provider.req_header);
            headers = replacePrams(headerTemplate, mailOptions, providerSettings);
        } catch (e) {
            console.warn(`Invalid req_header for provider ${provider.name}, using default`);
        }
    }

    // Xử lý req_body
    let body: any = null;
    if (provider.req_body) {
        try {
            const bodyTemplate = JSON.parse(provider.req_body);
            body = replacePrams(bodyTemplate, mailOptions, providerSettings);
        } catch (e) {
            throw new Error(`Invalid req_body JSON for provider ${provider.name}`);
        }
    }
    else {
        body = {
            to: mailOptions.to,
            from: mailOptions.from,
            subject: mailOptions.subject,
            text: mailOptions.text,
            html: mailOptions.html,
        };
    }

    // Gửi request
    const response = await fetch(endpoint, {
        method,
        headers,
        body: method !== 'GET' ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        let errorDetail = await response.text();
        try {
            const jsonErr = await response.json();
            errorDetail = JSON.stringify(jsonErr);
        } catch { }
        throw new Error(`Provider ${provider.provider_type}-${provider.name} returned ${response.status}: ${errorDetail}`);
    }

}

/**
 * Thay thế các parameter trong chuỗi hoặc object dựa trên mailOptions và settings của provider.
 * - {{to}}, {{from}}, {{subject}}, {{text}}, {{html}} (từ mailOptions)
 * - {{apiKey}}, {{domain}}, {{user}}, {{pass}} (bất kỳ key nào trong settings JSON)
 */
function replacePrams(value: any, mailOptions: MailOptions, providerSettings: any): any {
    if (typeof value === 'string') {
        return value.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
            expr = expr.trim();
            // Các placeholder thông thường
            // Lấy từ mailOptions hoặc providerSettings
            let replacement: any = null;
            if (expr in mailOptions) {
                replacement = (mailOptions as any)[expr];
            } else if (expr in providerSettings) {
                replacement = providerSettings[expr];
            }
            if (replacement !== null && replacement !== undefined) {
                return String(replacement);
            }
            return `{{${expr}}}`;
        });
    }
    if (Array.isArray(value)) {
        return value.map(item => replacePrams(item, mailOptions, providerSettings));
    }
    if (typeof value === 'object' && value !== null) {
        const newObj: any = {};
        for (const [k, v] of Object.entries(value)) {
            newObj[k] = replacePrams(v, mailOptions, providerSettings);
        }
        return newObj;
    }
    return value;
}