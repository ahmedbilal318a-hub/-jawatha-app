-- ============================================
-- Jawatha — إضافة معلمي اللغة الإنجليزية
-- شغّل ده مرة واحدة في Supabase SQL Editor
-- ============================================
-- يظهرون في قائمة الطالب تحت قسم "معلمو اللغة الإنجليزية"
-- (أسفل معلمي القسم الأدبي)
-- ============================================

create extension if not exists pgcrypto;

insert into public.teachers (username, password_hash, name, subject) values
  ('maher_kamal',    extensions.crypt('Maher@2026',  extensions.gen_salt('bf')), 'ماهر كمال',   'معلمو اللغة الإنجليزية'),
  ('mohamed_tawfik', extensions.crypt('Tawfik@2026', extensions.gen_salt('bf')), 'محمد توفيق',  'معلمو اللغة الإنجليزية'),
  ('mahmoud_othman', extensions.crypt('Othman@2026', extensions.gen_salt('bf')), 'محمود عثمان', 'معلمو اللغة الإنجليزية')
on conflict (username) do update
  set name = excluded.name,
      subject = excluded.subject;

-- ============================================
-- بيانات الدخول لكل معلم:
--   ماهر كمال   → اسم المستخدم: maher_kamal    | كلمة المرور: Maher@2026
--   محمد توفيق  → اسم المستخدم: mohamed_tawfik | كلمة المرور: Tawfik@2026
--   محمود عثمان → اسم المستخدم: mahmoud_othman | كلمة المرور: Othman@2026
-- ============================================
