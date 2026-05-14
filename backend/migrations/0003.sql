-- backend/migrations/0003.sql

DROP TABLE IF EXISTS email_queue;
CREATE TABLE IF NOT EXISTS email_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    to_email TEXT NOT NULL,
    from_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    text_body TEXT,
    html_body TEXT,
    status TEXT DEFAULT 'pending', -- pending, sent, failed
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    last_error TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    scheduled_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- thời điểm gửi
    priority INTEGER DEFAULT 0 -- số nhỏ gửi trước
);
DROP INDEX IF EXISTS idx_email_queue_status_scheduled;
CREATE INDEX idx_email_queue_status_scheduled ON email_queue(status, scheduled_at);

-- Bảng cấu hình provider
DROP TABLE IF EXISTS email_provider;
CREATE TABLE email_provider (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,                     -- 'SendGrid Free', 'Mailgun Trial'
    provider_type TEXT NOT NULL,            -- 'sendgrid', 'mailgun', 'resend', 'brevo', 'mailchannels'
    settings TEXT NOT NULL,                 -- JSON: { apiKey, domain?, from? }
    limits TEXT NOT NULL,                   -- JSON: { "hourly": { "limit": 10, "window_type": "sliding", "duration_seconds": 3600 }, "daily": { "limit": 1000, "window_type": "fixed", "reset_cron": "0 0 * * *", "timezone": "UTC" }, "monthly": { "limit": 2000, "window_type": "fixed", "reset_cron": "0 0 1 * *", "timezone": "UTC" } }
    usage TEXT NOT NULL,                    -- JSON: { "hourly": { "count": 5, "resetTime": null }, "daily": {...}, "monthly": {...} }
    is_active INTEGER NOT NULL DEFAULT 0,   -- 1 active, 0 inactive
    priority INTEGER NOT NULL DEFAULT 0,    -- số nhỏ gửi trước
    endpoint_url TEXT,                      -- URL gửi request
    req_method TEXT DEFAULT 'POST',         -- GET, POST, PUT, etc.
    req_header TEXT,                        -- JSON template cho headers, hỗ trợ placeholders
    req_body TEXT,                          -- JSON template cho body, hỗ trợ placeholders
    res_header TEXT,                        -- JSON template cho response headers, hỗ trợ placeholders
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bảng log gửi email
DROP TABLE IF EXISTS email_sending_log;
CREATE TABLE email_sending_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT,
    status TEXT NOT NULL, -- 'sent', 'failed'
    error_message TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES email_provider(id) ON DELETE CASCADE
);

-- Chèn các provider mặc định (tắt hết, người dùng bật khi có key)
INSERT INTO email_provider (
    name, provider_type, settings,
    limits,     -- JSON theo cấu trúc LimitRule
    usage, priority, is_active,
    endpoint_url, req_method,
    req_header, -- JSON template với placeholders
    req_body    -- JSON template với placeholders
) VALUES

-- 1. MailChannels (Free) - Không cần API key
('MailChannels (Free)', 'cloudflare', '{}',
 '{"monthly": {"limit": 10000, "window_type": "fixed", "reset_cron": "0 0 1 * *", "timezone": "UTC"}}',
 '{"monthly": {"count": 0, "resetTime": null}}', 1, 0,
 'https://api.mailchannels.net/tx/v1/send', 'POST',
 '{"Content-Type": "application/json"}',
 '{"personalizations": [{"to": [{"email": "{{to}}"}]}], "from": {"email": "{{from}}", "name": "{{from_name}}"}, "subject": "{{subject}}", "content": [{"type": "text/plain", "value": "{{text}}"}, {"type": "text/html", "value": "{{html}}"}]}'),

-- 2. Resend (Free) - Cần apiKey
('Resend (Free)', 'resend', '{"apiKey": ""}',
 '{"daily": {"limit": 100, "window_type": "fixed", "reset_cron": "0 0 * * *", "timezone": "UTC"}}',
 '{"daily": {"count": 0, "resetTime": null}}', 2, 0,
 'https://api.resend.com/emails', 'POST',
 '{"Authorization": "Bearer {{apiKey}}", "Content-Type": "application/json"}',
 '{"from": "{{from}}", "to": ["{{to}}"], "subject": "{{subject}}", "text": "{{text}}", "html": "{{html}}" }'),

-- 3. Resend Clone (bật sẵn để test, có cả daily và monthly)
('Resend Clone', 'resend', '{"apiKey": "re_xxxxxxxxx"}',
 '{"daily": {"limit": 100, "window_type": "fixed", "reset_cron": "0 0 * * *", "timezone": "UTC"}, "monthly": {"limit": 2000, "window_type": "fixed", "reset_cron": "0 0 1 * *", "timezone": "UTC"}}',
 '{"daily": {"count": 0, "resetTime": null}, "monthly": {"count": 0, "resetTime": null}}', 10, 1,
 'https://api.resend.com/emails', 'POST',
 '{"Authorization": "Bearer {{apiKey}}", "Content-Type": "application/json"}',
 '{"from": "{{from}}", "to": ["{{to}}"], "subject": "{{subject}}", "text": "{{text}}", "html": "{{html}}" }'),

-- 4. Brevo (Free)
('Brevo (Free)', 'brevo', '{"apiKey": ""}',
 '{"daily": {"limit": 300, "window_type": "fixed", "reset_cron": "0 0 * * *", "timezone": "UTC"}}',
 '{"daily": {"count": 0, "resetTime": null}}', 3, 0,
 'https://api.brevo.com/v3/smtp/email', 'POST',
 '{"api-key": "{{apiKey}}", "Content-Type": "application/json"}',
 '{"sender": {"email": "{{from}}"}, "to": [{"email": "{{to}}"}], "subject": "{{subject}}", "textContent": "{{text}}", "htmlContent": "{{html}}" }'),

-- 5. SendGrid (Trial)
('SendGrid (Trial)', 'sendgrid', '{"apiKey": ""}',
 '{"daily": {"limit": 100, "window_type": "fixed", "reset_cron": "0 0 * * *", "timezone": "UTC"}}',
 '{"daily": {"count": 0, "resetTime": null}}', 4, 0,
 'https://api.sendgrid.com/v3/mail/send', 'POST',
 '{"Authorization": "Bearer {{apiKey}}", "Content-Type": "application/json"}',
 '{"personalizations": [{"to": [{"email": "{{to}}"}]}], "from": {"email": "{{from}}"}, "subject": "{{subject}}", "content": [{"type": "text/plain", "value": "{{text}}"}, {"type": "text/html", "value": "{{html}}"}]}'),

-- 6. Mailgun (Trial) - Cần xử lý Basic auth đặc biệt: "api:apiKey" -> base64
('Mailgun (Trial)', 'mailgun', '{"apiKey": "", "domain": ""}',
 '{"monthly": {"limit": 5000, "window_type": "fixed", "reset_cron": "0 0 1 * *", "timezone": "UTC"}}',
 '{"monthly": {"count": 0, "resetTime": null}}', 5, 0,
 'https://api.mailgun.net/v3/{{domain}}/messages', 'POST',
 '{"Authorization": "Basic {{apiKey}}", "Content-Type": "application/x-www-form-urlencoded"}',
 '{"from": "{{from}}", "to": "{{to}}", "subject": "{{subject}}", "text": "{{text}}", "html": "{{html}}" }');