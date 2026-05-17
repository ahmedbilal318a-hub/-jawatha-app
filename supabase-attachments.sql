-- ============================================
-- Jawatha — إضافة دعم المرفقات (ملفات وصور)
-- شغّل ده مرة واحدة في Supabase SQL Editor
-- ============================================

-- ============================================
-- 1) إضافة أعمدة المرفقات لجدول الأسئلة
-- ============================================
alter table public.questions add column if not exists question_attachment_url text;
alter table public.questions add column if not exists question_attachment_name text;
alter table public.questions add column if not exists answer_attachment_url text;
alter table public.questions add column if not exists answer_attachment_name text;

-- ============================================
-- 2) إنشاء storage bucket للمرفقات
-- ============================================
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do update set public = true;

-- ============================================
-- 3) السماح بالرفع والقراءة للجميع
-- ============================================
drop policy if exists "attachments_anon_upload" on storage.objects;
drop policy if exists "attachments_anon_read"   on storage.objects;
drop policy if exists "attachments_anon_delete" on storage.objects;

create policy "attachments_anon_upload"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'attachments');

create policy "attachments_anon_read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'attachments');

create policy "attachments_anon_delete"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'attachments');
