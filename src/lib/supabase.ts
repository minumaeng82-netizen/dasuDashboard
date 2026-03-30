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
 * -- 3. 바로가기 테이블 생성
 * CREATE TABLE app_shortcuts (
 *     id TEXT PRIMARY KEY,
 *     label TEXT NOT NULL,
 *     url TEXT NOT NULL,
 *     type TEXT DEFAULT 'global',
 *     "authorEmail" TEXT,
 *     position INTEGER DEFAULT 0,
 *     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 * 
 * -- 4. 연수 자료 테이블 생성
 * CREATE TABLE training_posts (
 *     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *     title TEXT NOT NULL,
 *     author TEXT NOT NULL,
 *     date TEXT NOT NULL,
 *     "pdfUrl" TEXT,
 *     summary TEXT,
 *     "authorEmail" TEXT,
 *     "fileType" TEXT DEFAULT 'link',
 *     created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 * 
 * -- 5. 시스템 설정 테이블 생성
 * CREATE TABLE site_settings (
 *     id TEXT PRIMARY KEY,
 *     portal_name TEXT NOT NULL,
 *     updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
 * );
 * 
 * -- 6. RLS 정책 설정 (모든 권한 허용 - 필요시 제한)
 * ALTER TABLE school_schedules ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Enable access for all" ON school_schedules FOR ALL USING (true);
 * 
 * ALTER TABLE registered_users ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Enable access for all" ON registered_users FOR ALL USING (true);
 * 
 * ALTER TABLE app_shortcuts ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Enable access for all" ON app_shortcuts FOR ALL USING (true);
 * 
 * ALTER TABLE training_posts ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Enable access for all" ON training_posts FOR ALL USING (true);
 * 
 * ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Enable access for all" ON site_settings FOR ALL USING (true);
 *
 * -- 7. 특별실 예약 테이블 생성
 * CREATE TABLE room_reservations (
 *   id text PRIMARY KEY,
 *   room_name text NOT NULL,
 *   date text NOT NULL,
 *   time_range text NOT NULL,
 *   class_grade text NOT NULL,
 *   user_name text NOT NULL,
 *   user_email text,
 *   title text,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) NOT NULL
 * );
 * ALTER TABLE room_reservations ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "누구나 특별실 예약 조회 가능" ON room_reservations FOR SELECT USING (true);
 * CREATE POLICY "누구나 특별실 예약 추가/수정/삭제 가능" ON room_reservations FOR ALL USING (true);
 *
 * -- 8. 정기 특별실 예약 테이블 생성
 * CREATE TABLE room_regular_reservations (
 *   id text PRIMARY KEY,
 *   room_name text NOT NULL,
 *   day_of_week integer NOT NULL,
 *   time_range text NOT NULL,
 *   class_grade text NOT NULL,
 *   user_name text NOT NULL,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) NOT NULL
 * );
 * ALTER TABLE room_regular_reservations ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "누구나 정기 시간표 조회 가능" ON room_regular_reservations FOR SELECT USING (true);
 * CREATE POLICY "누구나 정기 시간표 추가/수정/삭제 가능" ON room_regular_reservations FOR ALL USING (true);
 */

