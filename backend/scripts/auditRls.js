// Uji dari sisi penyerang: membaca tabel memakai ANON key (tanpa login).
// Jalankan dari folder backend:  node scripts/auditRls.js
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const anonKey = process.env.SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('SUPABASE_URL dan SUPABASE_ANON_KEY wajib ada di .env')
  process.exit(1)
}

const anon = createClient(url, anonKey, { auth: { persistSession: false } })

// public = memang boleh dibaca publik; sensitive = tidak boleh terbaca tanpa login
const tables = [
  { name: 'plans', kind: 'public' },
  { name: 'templates', kind: 'public' },
  { name: 'event_rates', kind: 'public' },
  { name: 'profiles', kind: 'sensitive' },
  { name: 'custom_events', kind: 'sensitive' },
  { name: 'transactions', kind: 'sensitive' },
]

let problems = 0

for (const table of tables) {
  const { data, error } = await anon.from(table.name).select('*').limit(5)
  const rows = data?.length ?? 0

  if (error) {
    console.log(`OK     ${table.name.padEnd(14)} ditolak (${error.code || error.message})`)
  } else if (table.kind === 'sensitive' && rows > 0) {
    problems += 1
    console.log(`BAHAYA ${table.name.padEnd(14)} anon bisa membaca ${rows}+ baris. Periksa RLS/policy!`)
  } else if (table.kind === 'sensitive') {
    console.log(`CEK    ${table.name.padEnd(14)} terbaca tapi kosong (RLS memfilter, atau tabel memang kosong)`)
  } else {
    console.log(`OK     ${table.name.padEnd(14)} terbaca publik (${rows} baris contoh), sesuai rencana`)
  }
}

console.log(problems ? `\n${problems} masalah ditemukan.` : '\nTidak ada kebocoran baca yang terdeteksi dari sisi anon.')
process.exit(problems ? 1 : 0)