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
	login_false_count INTEGER DEFAULT 0,
	token_version INTEGER DEFAULT 0
);
DROP TABLE IF EXISTS user_password_resets;
CREATE TABLE user_password_resets (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	token TEXT NOT NULL,
	expired_at TEXT NOT NULL,
	used INTEGER DEFAULT 0,
	created_on TEXT NOT NULL
);
DROP INDEX IF EXISTS idx_user_password_resets_token;
CREATE UNIQUE INDEX idx_user_password_resets_token ON user_password_resets(token);
-- Password is '123aA@' hashed with SHA-256
INSERT INTO users (user_name, first_name, last_name, full_name, birth_date, email, email_confirm, password_hash, created_on, updated_on, culture_code, lock_acc_enable, lock_acc_end, login_false_count, token_version)
VALUES
	('system', 'System', 'User', 'System User', '2026-01-01', 'system@example.com', TRUE, 'pbkdf2$sha-256$100000$7395fe6a00a8f14d338f0ce215e27ccc$f1ad132cffeaaf0dec5caa4e6ce6b544d9d7b5a3d005b7dada4dc97a477a8340', datetime('now'), datetime('now'), 'vi', FALSE, NULL, 0, 0),
	('admin', 'Admin', 'User', 'Admin User', '2026-01-01', 'admin@example.com', TRUE, 'pbkdf2$sha-256$100000$7395fe6a00a8f14d338f0ce215e27ccc$f1ad132cffeaaf0dec5caa4e6ce6b544d9d7b5a3d005b7dada4dc97a477a8340', datetime('now'), datetime('now'), 'vi', FALSE, NULL, 0, 0);


DROP TABLE IF EXISTS roles;
CREATE TABLE roles (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT UNIQUE NOT NULL,
	description TEXT
);
DROP TABLE IF EXISTS user_roles;
CREATE TABLE user_roles (
	user_id INTEGER NOT NULL,
	role_id INTEGER NOT NULL,
	PRIMARY KEY (user_id, role_id)
);
-- Insert sample roles
INSERT INTO roles (name, description)
VALUES
	('system', 'System role with full permissions'),
	('admin', 'Administrator role with full permissions'),
	('user', 'Regular user role with limited permissions');
-- Assign system role to sample user
INSERT INTO user_roles (user_id, role_id)
VALUES (
	(SELECT id FROM users WHERE user_name = 'system'),
	(SELECT id FROM roles WHERE name = 'system')
),(
	(SELECT id FROM users WHERE user_name = 'admin'),
	(SELECT id FROM roles WHERE name = 'admin')
);


DROP TABLE IF EXISTS permissions;
CREATE TABLE permissions (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT UNIQUE NOT NULL,
	description TEXT
);
DROP TABLE IF EXISTS role_permissions;
CREATE TABLE role_permissions (
	role_id INTEGER NOT NULL,
	permission_id INTEGER NOT NULL,
	PRIMARY KEY (role_id, permission_id)
);
-- Insert sample permissions
INSERT INTO permissions (name, description)
VALUES
	('user:list', 'Permission to list users'),
	('user:detail', 'Permission to view user details'),
	('user:create', 'Permission to create users'),
	('user:update', 'Permission to update users'),
	('user:delete', 'Permission to delete users');
-- Assign user:list permission to system role
INSERT INTO role_permissions (role_id, permission_id)
VALUES (
	(SELECT id FROM roles WHERE name = 'system'),
	(SELECT id FROM permissions WHERE name = 'user:list')
);