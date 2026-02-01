DROP TABLE IF EXISTS files;
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  original_name TEXT NOT NULL,
  saved_path TEXT NOT NULL,
  mime_type TEXT,
  size INTEGER,
  is_private INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);
