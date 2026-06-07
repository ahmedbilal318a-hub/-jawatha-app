-- ============================================
-- Jawatha — تحديث كامل لقائمة المعلمين
-- (القسم الأدبي + معلمو اللغة الإنجليزية)
-- ============================================
create extension if not exists pgcrypto;

-- تحديث أسماء بلال وهشام
update public.teachers
set name = 'بلال سالم سادات عبدالمقصود', subject = 'القسم الأدبي'
where username = 'belal';

update public.teachers
set name = 'هشام إبراهيم أحمد قاسم', subject = 'القسم الأدبي'
where username = 'hisham';

-- معلمو القسم الأدبي
insert into public.teachers (username, password_hash, name, subject) values
  ('mohamed_hefny',       extensions.crypt('Hefny@2026',     extensions.gen_salt('bf')), 'محمد سيف الدين حفني',        'القسم الأدبي'),
  ('mohamed_younis',      extensions.crypt('Younis@2026',    extensions.gen_salt('bf')), 'محمد محمود حسين يونس',       'القسم الأدبي'),
  ('ali_ahmed',           extensions.crypt('Ali@2026',       extensions.gen_salt('bf')), 'علي محمد علي أحمد',          'القسم الأدبي'),
  ('mohamed_okba',        extensions.crypt('Okba@2026',      extensions.gen_salt('bf')), 'محمد سيد أحمد عبدالله عقبة',  'القسم الأدبي'),
  ('karam_obaid',         extensions.crypt('Karam@2026',     extensions.gen_salt('bf')), 'كرم أحمد مرسي عبيد',         'القسم الأدبي'),
  ('hassan_dosouki',      extensions.crypt('Hassan@2026',    extensions.gen_salt('bf')), 'حسن محمد مرسي الدسوقي',      'القسم الأدبي'),
  ('mahmoud_abulkasem',   extensions.crypt('Mahmoud@2026',   extensions.gen_salt('bf')), 'محمود سعيد ابوالقاسم علي',   'القسم الأدبي'),
  ('fahad_alfannakh',     extensions.crypt('Fahad@2026',     extensions.gen_salt('bf')), 'فهد علي محمد الفناخ',        'القسم الأدبي'),
  ('turki_alsuleim',      extensions.crypt('Turki@2026',     extensions.gen_salt('bf')), 'تركي عبدالرحمن محمد السليم',  'القسم الأدبي'),
  ('abdulaziz_alajmi',    extensions.crypt('Abdulaziz@2026', extensions.gen_salt('bf')), 'عبدالعزيز محسن مبارك العجمي', 'القسم الأدبي'),
  ('mohamed_alkhalidi',   extensions.crypt('Khalidi@2026',   extensions.gen_salt('bf')), 'محمد مبارك الخالدي',         'القسم الأدبي'),
  ('abdulrahman_alshawi', extensions.crypt('Shawi@2026',     extensions.gen_salt('bf')), 'عبدالرحمن محمد أحمد الشاوي',  'القسم الأدبي'),
  ('mutaeb_althuwaini',   extensions.crypt('Mutaeb@2026',    extensions.gen_salt('bf')), 'متعب جاسم صالح تالثويني',     'القسم الأدبي'),
  ('mohamed_shouman',     extensions.crypt('Shouman@2026',   extensions.gen_salt('bf')), 'محمد إبراهيم إبراهيم شومان',  'القسم الأدبي'),
  ('saleh_shamseldin',    extensions.crypt('Saleh@2026',     extensions.gen_salt('bf')), 'صالح زكي صالح شمس الدين',     'القسم الأدبي'),
  ('hamada_mousa',        extensions.crypt('Hamada@2026',    extensions.gen_salt('bf')), 'حماده محمد محمد موسى',        'القسم الأدبي'),
  ('abdulrahman_muhaifez',extensions.crypt('Muhaifez@2026',  extensions.gen_salt('bf')), 'عبدالرحمن مصطفى المحيفيظ',    'القسم الأدبي'),
  ('mohamed_binhindi',    extensions.crypt('Hindi@2026',     extensions.gen_salt('bf')), 'محمد خالد سلمان بن هندي',     'القسم الأدبي'),
  ('mutlaq_alowais',      extensions.crypt('Mutlaq@2026',    extensions.gen_salt('bf')), 'مطلق طارق مطلق العويس',       'القسم الأدبي'),
  ('saud_alsaud',         extensions.crypt('Saud@2026',      extensions.gen_salt('bf')), 'سعود سالم سعود السعود',       'القسم الأدبي'),
  -- معلمو اللغة الإنجليزية
  ('maher_kamal',         extensions.crypt('Maher@2026',     extensions.gen_salt('bf')), 'ماهر كمال',   'معلمو اللغة الإنجليزية'),
  ('mohamed_tawfik',      extensions.crypt('Tawfik@2026',    extensions.gen_salt('bf')), 'محمد توفيق',  'معلمو اللغة الإنجليزية'),
  ('mahmoud_othman',      extensions.crypt('Othman@2026',    extensions.gen_salt('bf')), 'محمود عثمان', 'معلمو اللغة الإنجليزية')
on conflict (username) do update
  set name = excluded.name, subject = excluded.subject;
