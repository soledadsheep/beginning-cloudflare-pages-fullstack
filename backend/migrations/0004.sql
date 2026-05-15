-- backend/migrations/0004.sql
DROP TABLE IF EXISTS oauth_providers;
CREATE TABLE oauth_providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_name TEXT UNIQUE NOT NULL, -- 'google', 'github', 'facebook',...
    client_id TEXT NOT NULL,
    client_secret TEXT NOT NULL,
    redirect_uri TEXT,                  -- có thể tự động sinh theo domain
    authorization_endpoint TEXT,        -- URL xác thực (nếu cần override)
    token_endpoint TEXT,                -- URL lấy token
    userinfo_endpoint TEXT,             -- URL lấy thông tin user
    scopes TEXT DEFAULT 'email profile', -- cách nhau bằng space
    enabled BOOLEAN DEFAULT 1,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Thêm một số provider mặc định (tuỳ chọn)
INSERT INTO oauth_providers (provider_name, client_id, client_secret, enabled, authorization_endpoint, token_endpoint, userinfo_endpoint, scopes, description) VALUES
('google', 'your_google_client_id', 'your_google_client_secret', 0, 'https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', 'https://www.googleapis.com/oauth2/v3/userinfo', 'email profile', 'Google OAuth provider: https://console.cloud.google.com/apis/credentials => OAuth 2.0 Client IDs => Web application => Client ID, Client Secret'),
('facebook', 'your_facebook_client_id', 'your_facebook_client_secret', 0, 'https://www.facebook.com/v18.0/dialog/oauth', 'https://graph.facebook.com/v18.0/oauth/access_token', 'https://graph.facebook.com/me', 'email public_profile', 'Facebook OAuth provider: https://developers.facebook.com/apps/ => Settings => Info => App ID, App Secret'),
('github', 'your_github_client_id', 'your_github_client_secret', 0, 'https://github.com/login/oauth/authorize', 'https://github.com/login/oauth/access_token', 'https://api.github.com/user', 'user:email', 'GitHub OAuth provider: https://github.com/settings/developers => New OAuth App => Client ID, Client Secret');


DROP TABLE IF EXISTS oauth_logins;
CREATE TABLE IF NOT EXISTS oauth_logins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    provider_name TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(provider_name, provider_user_id)
);
CREATE INDEX idx_oauth_user_id ON oauth_logins(user_id);
CREATE INDEX idx_oauth_provider ON oauth_logins(provider_name, provider_user_id);