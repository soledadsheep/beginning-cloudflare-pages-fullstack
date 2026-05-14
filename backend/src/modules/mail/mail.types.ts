// backend/src/modules/mail/mail.types.ts

export interface MailOptions {
    from?: string | null;  // Nếu không cung cấp, sẽ dùng giá trị mặc định từ provider
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export interface EmailQueueItem {
    id: number;
    to_email: string;
    from_email: string;
    subject: string;
    text_body: string | null;
    html_body: string | null;
    status: 'pending' | 'sent' | 'failed';
    retry_count: number;
    max_retries: number;
    last_error: string | null;
    created_at: string;
    updated_at: string;
    scheduled_at: string;
    priority: number;
}

export interface InsertEmailInput {
    to_email: string;
    from_email: string;
    subject: string;
    text_body?: string | null;
    html_body?: string | null;
    max_retries?: number;
    scheduled_at?: string;
    priority?: number;
}

// Cấu hình giới hạn gửi email cho từng provider: key là loại chu kỳ, value là cấu hình chi tiết
// ex: { 
// "hourly": { "limit": 10, "window_type": "sliding", "duration_seconds": 3600 }, 
// "daily": { "limit": 100, "window_type": "fixed", "reset_cron": "0 0 * * *", "timezone": "UTC" }
// }
export interface LimitRule {
    limit: number;
    window_type: 'fixed' | 'sliding';
    // cho fixed window
    reset_cron?: string;      // ví dụ: "0 0 * * *" (0h hàng ngày), "0 0 1 * *" (mùng 1 hàng tháng)
    timezone?: string;        // ví dụ: "UTC", "Asia/Ho_Chi_Minh"
    // cho sliding window
    duration_seconds?: number; // 3600 cho hourly, 86400 cho daily
}
export type LimitConfig = Record<string, LimitRule>;

// Dữ liệu sử dụng: key là loại chu kỳ, value gồm count và thời điểm reset gần nhất
export interface UsageItem {
    count: number;
    resetTime: string | null; // windowStart ISO string, null nếu chưa reset lần nào
}
export type UsageData = Record<string, UsageItem>;

export interface EmailProvider {
    id: number;
    name: string;
    provider_type: string;
    settings: string;           // JSON string
    is_active: number;
    priority: number;
    limits: string;             // JSON string (LimitConfig)
    usage: string;              // JSON string (UsageData)
    created_at: string;
    updated_at: string;
    endpoint_url: string | null;
    req_method: string | null;  // GET, POST, PUT, etc.
    req_header: string | null;  // JSON string, ex: {"Authorization": "Bearer {{apiKey}}", "Content-Type": "application/json"}
    req_body: string | null;    // JSON string, ex: {"to": "{{to}}", "from": "{{from}}", ...}
    res_header: string | null;  // JSON string, ex: { "x-rate-limit-reset": { storeIn: "usage.resetTime", cycle: "daily" }, ... }
}

export interface ProviderSettings {
    apiKey?: string;
    domain?: string;
    host?: string;
    port?: number;
    user?: string;
    pass?: string;
}