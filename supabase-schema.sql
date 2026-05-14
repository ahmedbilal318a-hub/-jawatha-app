-- ============================================
-- Jawatha — Schema Setup
-- شغّل الـ SQL ده مرة واحدة في Supabase SQL Editor
-- ============================================

create extension if not exists pgcrypto;

-- Cleanup if re-running
drop function if exists public.login_teacher(text, text);
drop function if exists public.get_teachers();
drop table if exists public.questions;
drop table if exists public.teachers;

-- ============================================
-- Teachers table (passwords hashed, never exposed)
-- ============================================
create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  name text not null,
  subject text not null,
  created_at timestamptz default now()
);

alter table public.teachers enable row level security;

-- ============================================
-- Questions table
-- ============================================
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  student_grade text not null,
  teacher_username text not null references public.teachers(username),
  teacher_name text not null,
  teacher_subject text not null,
  subject text not null,
  question text not null,
  answer text,
  answered_at timestamptz,
  status text default 'pending' check (status in ('pending', 'answered')),
  created_at timestamptz default now()
);

alter table public.questions enable row level security;

create policy "anyone_select_questions" on public.questions
  for select using (true);

create policy "anyone_insert_questions" on public.questions
  for insert with check (true);

create policy "anyone_update_questions" on public.questions
  for update using (true) with check (true);

create index questions_teacher_idx on public.questions(teacher_username);
create index questions_status_idx on public.questions(status);
create index questions_created_idx on public.questions(created_at desc);

-- ============================================
-- RPC: get_teachers
-- ============================================
create or replace function public.get_teachers()
returns table (username text, name text, subject text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select t.username, t.name, t.subject
  from public.teachers t
  order by t.name;
end;
$$;

grant execute on function public.get_teachers() to anon;

-- ============================================
-- RPC: login_teacher
-- ============================================
create or replace function public.login_teacher(p_username text, p_password text)
returns table (username text, name text, subject text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select t.username, t.name, t.subject
  from public.teachers t
  where t.username = p_username
    and t.password_hash = crypt(p_password, t.password_hash);
end;
$$;

grant execute on function public.login_teacher(text, text) to anon;

-- ============================================
-- Insert teachers
-- ============================================
insert into public.teachers (username, password_hash, name, subject) values
  ('belal',  crypt('Bilal@2026',  gen_salt('bf')), 'أ. بلال سالم',  'اللغة العربية'),
  ('hisham', crypt('Hisham@2026', gen_salt('bf')), 'أ. هشام قاسم', 'اللغة العربية');
