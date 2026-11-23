// Uji dari sisi pengguna biasa yang SUDAH login, memakai anon key + token login,
// persis seperti yang bisa dilakukan penyerang langsung ke Supabase.
// Jalankan dari folder backend:  node scripts/auditAuth.js email password
// Pakai akun pelanggan biasa (bukan admin). Tidak ada data yang diubah nilainya.
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const [email, password] = process.argv.slice(2)
const url = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY

if (!url || !anonKey || !email || !password) {
  console.error('Pemakaian: node scripts/auditAuth.js email password')
  process.exit(1)
}

const client = createClient(url, anonKey, { auth: { persistSession: false } })
const { data: login, error: loginError } = await client.auth.signInWithPassword({ email, password })

if (loginError || !login.user) {
  console.error('Login gagal:', loginError?.message)
  process.exit(1)
}

const userId = login.user.id
let problems = 0

function report(ok, okText, badText) {
  if (!ok) problems += 1

  console.log(`${ok ? 'OK    ' : 'BAHAYA'} ${ok ? okText : badText}`)
}

// 1) Baca profil orang lain
const profiles = await client.from('profiles').select('id')
const otherProfiles = (profiles.data ?? []).filter((row) => row.id !== userId).length

report(
  otherProfiles === 0,
  'profiles: tidak bisa membaca profil orang lain',
  `profiles: bisa membaca ${otherProfiles} profil orang lain`
)

// 2) Baca transaksi dan event milik orang lain
for (const table of ['transactions', 'custom_events']) {
  const result = await client.from(table).select('user_id')
  const others = (result.data ?? []).filter((row) => row.user_id !== userId).length

  report(
    others === 0,
    `${table}: tidak bisa membaca milik orang lain`,
    `${table}: bisa membaca ${others} baris milik orang lain`
  )
}

// 3) Ubah profil sendiri langsung (nilai tetap sama, jadi tidak merusak data)
const own = await client.from('profiles').select('full_name').eq('id', userId).maybeSingle()
const sameName = own.data?.full_name ?? login.user.user_metadata?.full_name

if (!sameName) {
  console.log('CEK    profiles: nama tidak terbaca, uji ubah-profil dilewati')
} else {
  const update = await client.from('profiles').update({ full_name: sameName }).eq('id', userId).select('id')
  const allowed = !update.error && (update.data?.length ?? 0) > 0

  report(
    !allowed,
    'profiles: tidak bisa mengubah profil sendiri langsung',
    'profiles: BISA mengubah profil sendiri langsung (berarti bisa menaikkan role/paket sendiri!)'
  )
}

await client.auth.signOut()
console.log(problems ? `\n${problems} masalah ditemukan.` : '\nTidak ada masalah terdeteksi dari sisi pengguna login.')
process.exit(problems ? 1 : 0)