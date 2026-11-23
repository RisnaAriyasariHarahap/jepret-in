-- ============================================================
-- Audit keamanan Supabase untuk Jepret.in
-- Jalankan di: Supabase Dashboard -> SQL Editor
-- Semua query di bawah hanya MEMBACA (aman dijalankan).
-- ============================================================

-- 1) Apakah RLS aktif di setiap tabel? (rls_aktif harus true semua)
select tablename, rowsecurity as rls_aktif
from pg_tables
where schemaname = 'public'
order by tablename;

-- 2) Semua policy yang ada
--    Cari policy untuk role anon/authenticated dengan cmd = INSERT / UPDATE / DELETE / ALL.
--    Itu BERBAHAYA, terutama di tabel profiles (user bisa mengubah role atau paketnya sendiri
--    langsung ke Supabase memakai anon key + token loginnya).
select tablename, policyname, cmd, roles, qual as kondisi_using, with_check
from pg_policies
where schemaname = 'public'
order by tablename, cmd;

-- 3) Hak akses tabel untuk anon / authenticated
select table_name, grantee, string_agg(privilege_type, ', ' order by privilege_type) as hak
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated')
group by table_name, grantee
order by table_name, grantee;

-- 4) Fungsi SECURITY DEFINER (berjalan dengan hak pemilik, perlu ditinjau)
select p.proname as fungsi
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef;

-- ============================================================
-- PENGERASAN (OPSIONAL, jalankan setelah membaca hasil di atas)
-- Frontend Jepret.in TIDAK memakai Supabase langsung; semua data lewat backend
-- yang memakai service-role key (melewati RLS). Jadi anon/authenticated
-- tidak butuh akses tulis sama sekali, dan tidak butuh baca tabel sensitif.
--
-- Hapus tanda komentar (--) lalu jalankan, kemudian uji: daftar, login,
-- beli Premium, ajukan event, buka halaman admin.
-- ============================================================

-- revoke insert, update, delete on all tables in schema public from anon, authenticated;
-- revoke all on public.profiles, public.transactions, public.custom_events from anon, authenticated;