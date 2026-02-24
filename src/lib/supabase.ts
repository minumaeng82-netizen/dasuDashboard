import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isPlaceholder = supabaseUrl === 'your_supabase_project_url' || !supabaseUrl.startsWith('http');

if (isPlaceholder || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing or invalid. Database features will not work.');
}

export const supabase = (!isPlaceholder && supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null as any;

/**
 * [Supabase SQL Editor 실행용 스크립트]
 * 
 * -- 1. 학교 일정 테이블 생성
 * CREATE TABLE school_schedules (
 *     id TEXT PRIMARY KEY,
 *     title TEXT NOT NULL,
 *     date TEXT NOT NULL,
 *     "timeRange" TEXT,
 *     location TEXT,
 *     target TEXT,
 *     category TEXT,
 *     description TEXT,
 *     "authorEmail" TEXT,
 *     "isPrivate" BOOLEAN DEFAULT false,
 *     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 * 
 * -- 2. 사용자 테이블 생성
 * CREATE TABLE registered_users (
 *     id TEXT PRIMARY KEY,
 *     email TEXT UNIQUE NOT NULL,
 *     name TEXT NOT NULL,
 *     role TEXT NOT NULL DEFAULT 'user',
 *     password TEXT NOT NULL DEFAULT '123456',
 *     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 * 
 * -- 3. RLS 정책 설정 (모든 권한 허용 - 필요시 제한)
 * ALTER TABLE school_schedules ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Enable access for all" ON school_schedules FOR ALL USING (true);
 * 
 * ALTER TABLE registered_users ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Enable access for all" ON registered_users FOR ALL USING (true);
 */

