-- Chat Subjects: groups chats by topic/subject
CREATE TABLE IF NOT EXISTS chat_subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  user_email TEXT NOT NULL,
  color TEXT,
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_subjects_user_email ON chat_subjects(user_email);
CREATE INDEX IF NOT EXISTS idx_chat_subjects_last_message ON chat_subjects(last_message_at DESC);

-- Chat Messages: individual messages within a subject
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  subject_id UUID NOT NULL REFERENCES chat_subjects(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  content TEXT NOT NULL,
  sender_name TEXT
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_subject ON chat_messages(subject_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

-- Enable Row Level Security
ALTER TABLE chat_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies (allow all operations for now, matching existing scenarios table pattern)
CREATE POLICY "Allow all operations on chat_subjects" ON chat_subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on chat_messages" ON chat_messages FOR ALL USING (true) WITH CHECK (true);
