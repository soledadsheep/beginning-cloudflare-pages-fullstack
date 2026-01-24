DROP TABLE IF EXISTS users;
CREATE TABLE users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_name TEXT UNIQUE NOT NULL,
	first_name TEXT NOT NULL,
	last_name TEXT NOT NULL,
	full_name TEXT NOT NULL,
	birth_date TEXT NOT NULL,
	email TEXT UNIQUE NOT NULL,
	email_confirm BOOLEAN DEFAULT FALSE,
	password_hash TEXT NOT NULL,
	created_on TEXT NOT NULL,
	updated_on TEXT NOT NULL,
	culture_code TEXT DEFAULT 'vi',
	lock_acc_enable BOOLEAN DEFAULT FALSE,
	lock_acc_end TEXT,
	login_false_count INTEGER DEFAULT 0
);

-- Insert sample user
-- Password is 'password' hashed with SHA-256
INSERT INTO users (user_name, first_name, last_name, full_name, birth_date, email, email_confirm, password_hash, created_on, updated_on, culture_code)
VALUES ('testuser', 'Test', 'User', 'Test User', '1990-01-01', 'test@example.com', TRUE, '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', datetime('now'), datetime('now'), 'vi');