# Panduan Penggunaan SI-API

> Sistem Informasi Analisa Pelaporan Insiden
> RSUD dr. R. Soedjono Selong

---

## Daftar Isi

1. [Akses & Login](#1-akses--login)
2. [Dashboard](#2-dashboard)
3. [Role Pelapor — Laporan Insiden](#3-role-pelapor)
4. [Role Validator — Grading & Validasi](#4-role-validator)
5. [Role PMKP — Investigasi & Analisa](#5-role-pmkp)
6. [Role Kepala Unit — Monitoring Unit](#6-role-kepala-unit)
7. [Role Manajemen — Overview RS](#7-role-manajemen)
8. [Role Admin — Manajemen User & Pengaturan](#8-role-admin)
9. [Ganti Password](#9-ganti-password)
10. [Notifikasi](#10-notifikasi)
11. [Export Laporan](#11-export-laporan)
12. [Alur Lengkap Insiden](#12-alur-lengkap-insiden)
13. [FAQ](#13-faq)

---

## 1. Akses & Login

### 1.1 Akses Aplikasi

Buka browser dan akses:

- **Langsung**: `http://192.168.90.7:3000`
- **Via Nginx (jika dikonfigurasi)**: `http://192.168.90.7`

### 1.2 Halaman Login

![Login Page](https://via.placeholder.com/400x300?text=Login+Page)

| Field | Keterangan |
|-------|------------|
| **Username** | Nama pengguna yang diberikan admin |
| **Password** | Password awal (default: `12345`) |

> **Password awal HARUS diganti** setelah login pertama. Banner notifikasi kuning akan muncul — klik untuk mengganti password.

### 1.3 Data User Default (Seed)

| Username | Password | Role | Unit |
|----------|----------|------|------|
| `admin` | `12345` | Admin | TI |
| `perawat1` | `12345` | Pelapor | Rawat Inap |
| `dokter1` | `12345` | Pelapor | IGD |
| `validator1` | `12345` | Validator | Mutu |
| `pmkp1` | `12345` | PMKP | Mutu |
| `kepala_igd` | `12345` | Kepala Unit | IGD |
| `manajemen1` | `12345` | Manajemen | Direksi |

---

## 2. Dashboard

Dashboard adalah halaman utama setelah login. Tampilan sama untuk semua role, namun data yang ditampilkan bisa berbeda:

### 2.1 Statistik (Kartu)

| Kartu | Arti |
|-------|------|
| **Total Insiden** | Jumlah seluruh insiden |
| **Baru** | Status `dilaporkan` |
| **Diproses** | Status `divalidasi` + `investigasi` |
| **Selesai** | Status `selesai` |
| **Merah / Kuning / Hijau / Biru** | Berdasarkan severity grading |

### 2.2 Tren Bulanan

Tabel tren menunjukkan jumlah insiden per bulan beserta breakdown severity. Berguna untuk melihat pola kejadian.

---

## 3. Role Pelapor

Pelapor adalah role default untuk perawat, dokter, dan staf klinis.

### 3.1 Menu yang Tersedia

| Menu | Akses |
|------|-------|
| Dashboard | ✅ |
| Insiden Saya | ✅ (hanya laporan sendiri) |
| Lapor Insiden | ✅ |
| Notifikasi | ✅ |

### 3.2 Membuat Laporan Insiden Baru

1. Klik menu **Lapor Insiden** (atau tombol `+ Lapor Baru`)
2. Isi form laporan:

| Field | Wajib | Keterangan |
|-------|-------|------------|
| Jenis Insiden | ✅ | Pilih dari dropdown: KTD, KNC, KPC, KTC, Sentinel |
| Tanggal & Waktu | ✅ | Tanggal dan jam kejadian |
| Lokasi | ✅ | Unit/ruang tempat kejadian |
| Kronologis | ✅ | Uraian detail kejadian (min 10 karakter) |
| Akibat/Dampak | ✅ | Dampak pada pasien |
| Tindakan Segera | ❌ | Tindakan yang sudah dilakukan |
| Lapor Anonim | ❌ | Centang jika tidak ingin identitas tampil |

3. Klik **Kirim Laporan**
4. Notifikasi akan dikirim ke validator dan PMKP

### 3.3 Laporan Anonim

Jika menceklis **Lapor secara anonim**:
- Identitas pelapor tidak akan tampil
- Nama akan muncul sebagai "Anonim"
- Tetap bisa melihat status laporan sendiri

### 3.4 Melihat Laporan

1. Menu **Insiden Saya** → daftar semua laporan yang pernah dibuat
2. Klik **Detail** untuk melihat status dan hasil investigasi

### 3.5 Yang Tidak Bisa Dilakukan Pelapor

- ❌ Mengubah status insiden
- ❌ Melakukan grading severity
- ❌ Melihat insiden milik orang lain (kecuali admin/validator/PMKP)
- ❌ Export laporan

---

## 4. Role Validator

Validator bertanggung jawab melakukan grading / penilaian severity insiden.

### 4.1 Menu yang Tersedia

| Menu | Akses |
|------|-------|
| Dashboard | ✅ |
| Semua Insiden | ✅ (semua insiden) |
| Investigasi | ✅ (lihat saja) |
| Notifikasi | ✅ |

### 4.2 Melakukan Grading

1. Buka **Semua Insiden**
2. Cari insiden dengan status `dilaporkan` dan severity kosong
3. Klik **Detail**
4. Di panel kanan, pilih **Severity**:

| Severity | Warna | Makna | Tindak Lanjut |
|----------|-------|-------|---------------|
| Biru | 🔵 | Tidak cedera | Monitoring |
| Hijau | 🟢 | Cedera ringan | Investigasi sederhana |
| Kuning | 🟡 | Cedera sedang | Investigasi komprehensif |
| Merah | 🔴 | Cedera berat / kematian | Investigasi komprehensif segera |

5. Klik **Simpan Grade**
6. Sistem otomatis akan membuat investigasi dengan tipe sesuai severity

### 4.3 Update Status

Validator juga bisa mengubah status insiden (misal: dari `dilaporkan` ke `divalidasi`).

### 4.4 Yang Tidak Bisa Dilakukan Validator

- ❌ Menyelesaikan investigasi (hanya PMKP)
- ❌ Export laporan

---

## 5. Role PMKP

PMKP (Penjaminan Mutu dan Keselamatan Pasien) memiliki akses penuh terhadap investigasi dan analisa.

### 5.1 Menu yang Tersedia

| Menu | Akses |
|------|-------|
| Dashboard | ✅ (seluruh RS) |
| Semua Insiden | ✅ |
| Investigasi | ✅ (complete) |
| Notifikasi | ✅ |
| Export | ✅ (Excel + PDF) |

### 5.2 Melakukan Grading

PMKP juga bisa melakukan grading sama seperti validator.

### 5.3 Menyelesaikan Investigasi

1. Buka **Investigasi**
2. Filter status **Berlangsung**
3. Klik **Detail** pada investigasi yang akan diselesaikan
4. Isi form investigasi:

| Field | Wajib | Keterangan |
|-------|-------|------------|
| Root Cause / Akar Masalah | ✅ | Analisis penyebab mendasar (min 10 karakter) |
| Rekomendasi | ✅ | Rekomendasi perbaikan (min 10 karakter) |
| Rencana Tindak Lanjut | ❌ | Rencana implementasi |

5. Klik **Simpan & Selesaikan**
6. Status insiden otomatis berubah menjadi `selesai`

### 5.4 Export Laporan

PMKP dapat mengexport data insiden:

- **Excel** (.xlsx) — untuk analisa lanjutan
- **PDF** — untuk laporan akreditasi

Filter export:
- Berdasarkan status
- Berdasarkan rentang tanggal

### 5.5 Dashboard & Analisa

PMKP melihat seluruh data RS tanpa filter unit.

---

## 6. Role Kepala Unit

Kepala unit hanya melihat insiden dari unitnya sendiri (misal: Kepala IGD hanya melihat insiden IGD).

### 6.1 Menu yang Tersedia

| Menu | Akses |
|------|-------|
| Dashboard | ✅ (terfilter unit) |
| Insiden Unit | ✅ (hanya unit sendiri) |
| Notifikasi | ✅ |
| Export | ✅ (terfilter unit) |

### 6.2 Filter Otomatis

Saat login sebagai Kepala Unit:
- Dashboard statistik hanya menampilkan data unit terkait
- Daftar insiden hanya menampilkan insiden dari unit tersebut
- Export hanya mencakup data unit tersebut

---

## 7. Role Manajemen

Manajemen (direksi, wakil direktur) melihat data seluruh RS untuk pengambilan keputusan.

### 7.1 Menu yang Tersedia

| Menu | Akses |
|------|-------|
| Dashboard | ✅ (seluruh RS) |
| Semua Insiden | ✅ |
| Notifikasi | ✅ |
| Export | ✅ |

### 7.2 Dashboard Manajemen

Menampilkan:
- Total insiden seluruh RS
- Breakdown severity
- Tren bulanan
- Data untuk bahan laporan akreditasi

---

## 8. Role Admin

Admin mengelola user dan dapat melakukan semua fungsi.

### 8.1 Menu yang Tersedia

| Menu | Akses |
|------|-------|
| Dashboard | ✅ |
| Semua Insiden | ✅ |
| Investigasi | ✅ |
| Notifikasi | ✅ |
| Export | ✅ |
| Ruangan | ✅ (CRUD master ruangan) |
| Pengguna | ✅ (CRUD user via UI) |
| Pengaturan | ✅ (nama RS & logo) |
| Ganti Password | ✅ |

### 8.2 Manajemen User Via UI

1. Buka menu **Pengguna**
2. Daftar semua user ditampilkan dengan role dan unit
3. Klik **Tambah User** untuk user baru
4. Edit atau nonaktifkan user yang sudah ada

### 8.3 Manajemen Role

Role yang tersedia:

| Role | Kode | Deskripsi |
|------|------|-----------|
| Pelapor | `pelapor` | Perawat, dokter, staf klinis |
| Validator | `validator` | Tim mutu yang melakukan grading |
| PMKP | `pmkp` | Penjaminan Mutu & KPS |
| Kepala Unit | `kepala_unit` | Kepala ruang/unit |
| Manajemen | `manajemen` | Direksi/manajemen RS |
| Admin | `admin` | Administrator sistem |

### 8.4 Pengaturan Aplikasi

1. Buka menu **Pengaturan** (⚙️)
2. **Nama Rumah Sakit**: Edit nama RS yang tampil di laporan
3. **Logo Rumah Sakit**: Upload logo baru (PNG/JPG/SVG, max 2MB)

Perubahan langsung tersimpan dan tampil di semua halaman.

---

## 9. Ganti Password

Semua user bisa mengganti password sendiri melalui UI.

### 9.1 Cara Ganti Password

1. Klik menu **Ganti Password** (🔑) di sidebar (bawah)
2. Isi form:
   - **Password Saat Ini**: Password lama
   - **Password Baru**: Minimal 4 karakter
   - **Konfirmasi Password Baru**: Ketik ulang
3. Klik **Simpan Password**
4. Password langsung berubah, login selanjutnya pakai password baru

### 9.2 Notifikasi Password Default

Saat pertama login dengan password default (`12345`), akan muncul banner kuning:
> "Anda menggunakan password default. Segera ganti password Anda."

Klik banner atau menu **Ganti Password** untuk mengganti. Banner akan hilang setelah password diubah.

### 9.3 Via API

```bash
curl -X PATCH http://192.168.90.7:3000/api/v1/auth/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"oldPassword":"12345","newPassword":"password-baru"}'
```

---

## 10. Notifikasi

### 9.1 Kapan Notifikasi Terkirim

| Aksi | Notifikasi ke |
|------|---------------|
| Insiden baru dilaporkan | Semua validator + PMKP |
| Grading dilakukan | Pelapor (via detail insiden) |
| Investigasi selesai | (log event) |

### 9.2 Membaca Notifikasi

1. Klik menu **Notifikasi**
2. Notifikasi belum dibaca ditandai dengan garis biru di kiri
3. Klik **Tandai Semua Dibaca** untuk membersihkan

---

## 11. Export Laporan

### 10.1 Yang Bisa Export

| Role | Excel | PDF |
|------|-------|-----|
| PMKP | ✅ | ✅ |
| Manajemen | ✅ | ✅ |
| Kepala Unit | ✅ (unit sendiri) | ✅ (unit sendiri) |
| Admin | ✅ | ✅ |
| Pelapor | ❌ | ❌ |
| Validator | ❌ | ❌ |

### 10.2 Cara Export

**Via UI**:
1. Buka detail insiden
2. Klik tombol Export Excel atau Export PDF
3. File akan terdownload otomatis

**Via API** (dengan filter):

```bash
# Export Excel dengan filter status
curl -X GET "http://192.168.90.7:3000/api/v1/export/excel?status=selesai" \
  -H "Authorization: Bearer <token>" \
  -o laporan.xlsx

# Export PDF dengan filter tanggal
curl -X GET "http://192.168.90.7:3000/api/v1/export/pdf?start_date=2026-01-01&end_date=2026-06-30" \
  -H "Authorization: Bearer <token>" \
  -o laporan.pdf
```

---

## 12. Alur Lengkap Insiden

### Diagram Alur

```
Pelapor                  Validator                PMKP
   │                        │                      │
   ├─ Lapor Insiden ────────┤                      │
   │   (status: dilaporkan) │                      │
   │                        │                      │
   │                        ├─ Grading Severity ───┤
   │                        │   (biru/hijau/       │
   │                        │    kuning/merah)     │
   │                        │                      │
   │                        │   Investigasi        │
   │                        │   auto-created       │
   │                        │                      │
   │                        │                      ├─ Isi Investigasi
   │                        │                      │   (root cause,
   │                        │                      │    rekomendasi,
   │                        │                      │    action plan)
   │                        │                      │
   │                        │                      ├─ Selesaikan
   │                        │                      │   (status: selesai)
   │                        │                      │
   ├── Lihat Hasil ─────────┴──────────────────────┘
```

### Penjelasan Alur

| Tahap | Status | Actor | Keterangan |
|-------|--------|-------|------------|
| 1 | `dilaporkan` | Pelapor | Laporan masuk, notifikasi ke validator |
| 2 | `divalidasi` | Validator | Validator melakukan grading |
| 3 | `investigasi` | (otomatis) | Sistem buat investigasi sesuai severity |
| 4 | `ditindaklanjuti` | PMKP | PMKP mengisi hasil investigasi |
| 5 | `selesai` | PMKP | Investigasi selesai, status insiden selesai |
| — | `ditolak` | Validator/PMKP | Insiden ditolak (jika tidak valid) |

### Severity → Tipe Investigasi

| Severity | Tipe Investigasi | Batas Waktu |
|----------|-----------------|-------------|
| Biru | — | Tidak perlu investigasi |
| Hijau | Sederhana | 14 hari |
| Kuning | Komprehensif | 30 hari |
| Merah | Komprehensif | 45 hari |

---

## 13. FAQ

### Q: Password lupa, bagaimana?

Hubungi admin untuk reset password via database.

### Q: Saya lapor secara anonim, apakah tetap bisa tracking?

Ya. Setelah submit, Anda akan mendapat ID insiden. Buka menu Insiden → semua laporan Anda (termasuk anonim) tetap tampil.

### Q: Data sudah ada di database, apakah aman?

Database tersimpan di `/opt/si-api/data/si-api.db`. Backup otomatis via cron (lihat install.md). Untuk produksi sebenarnya, disarankan menggunakan database eksternal (MySQL/PostgreSQL).

### Q: Bisa integrasi dengan SIMRS?

API tersedia di `http://192.168.90.7:3000/api/v1`. Semua endpoint bisa diakses via HTTP. Dokumentasi lengkap di `/api/v1/docs`.

### Q: Ada berapa user yang bisa dibuat?

Tidak terbatas. Admin bisa registrasi user baru kapan saja.

### Q: Apakah ada riwayat perubahan (audit trail)?

Ya. Semua perubahan (login, register, create incident, grading, update status, complete investigation) tercatat di tabel `audit_logs`.

### Q: Bisa diakses dari smartphone?

Ya. UI responsif dan bisa diakses dari browser smartphone dalam jaringan yang sama.

### Q: Error "Too many requests"?

Rate limit: 200 request per 15 menit (global), 10 percobaan login per 15 menit. Tunggu beberapa saat.


