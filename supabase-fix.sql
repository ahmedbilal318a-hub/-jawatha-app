-- ============================================
-- Fix: crypt() function لازم تتعرف من extensions schema
-- ============================================

create or replace function public.get_teachers()
returns table (username text, name text, subject text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select t.username, t.name, t.subject
  from public.teachers t
  order by t.name;
end;
$$;

grant execute on function public.get_teachers() to anon;

create or replace function public.login_teacher(p_username text, p_password text)
returns table (username text, name text, subject text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select t.username, t.name, t.subject
  from public.teachers t
  where t.username = p_username
    and t.password_hash = extensions.crypt(p_password, t.password_hash);
end;
$$;

grant execute on function public.login_teacher(text, text) to anon;
