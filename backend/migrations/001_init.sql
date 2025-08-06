-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  PRIMARY KEY (user_id, team_id)
);

-- Team Settings
CREATE TABLE IF NOT EXISTS team_settings (
  team_id INTEGER PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  settings JSONB NOT NULL
);

-- GitHub Tokens
CREATE TABLE IF NOT EXISTS github_tokens (
  team_id INTEGER PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL
);

-- Builds
CREATE TABLE IF NOT EXISTS builds (
  id SERIAL PRIMARY KEY,
  team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  branch TEXT NOT NULL,
  commit_hash TEXT NOT NULL,
  commit_message TEXT,
  author TEXT,
  status TEXT NOT NULL,
  total_tests INTEGER,
  passed_tests INTEGER,
  failed_tests INTEGER,
  flaky_tests INTEGER,
  coverage_percentage NUMERIC,
  build_duration NUMERIC,
  environment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Test Runs
CREATE TABLE IF NOT EXISTS test_runs (
  id SERIAL PRIMARY KEY,
  build_id INTEGER REFERENCES builds(id) ON DELETE CASCADE,
  test_suite TEXT NOT NULL,
  test_type TEXT NOT NULL,
  status TEXT NOT NULL,
  duration NUMERIC,
  coverage_percentage NUMERIC,
  error_message TEXT,
  stack_trace TEXT,
  screenshot_url TEXT,
  ai_analysis JSONB,
  execution_trigger TEXT,
  environment TEXT,
  branch TEXT,
  commit_hash TEXT,
  created_at TIMESTAMP DEFAULT NOW()
); 