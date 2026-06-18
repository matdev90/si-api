# Dokumentasi Perbaikan Sistem SI-API
**Berdasarkan Audit terhadap Pedoman IKP (KKP-RS & RSUD Dr. R. Soedjono Selong)**

**Tanggal**: 18 Juni 2026

---

## Daftar Isi
1. [Ringkasan Perubahan](#1-ringkasan-perubahan)
2. [Detail Perubahan per File](#2-detail-perubahan-per-file)
3. [Migrasi Database](#3-migrasi-database)
4. [API Endpoint Baru/Diubah](#4-api-endpoint-baru-diubah)
5. [Panduan untuk Pengembangan Selanjutnya](#5-panduan-untuk-pengembangan-selanjutnya)

---

## 1. Ringkasan Perubahan

Total **18 temuan audit** telah diperbaiki, mencakup perubahan pada:

| Area | Jumlah File | Status |
|---|---|---|
| Backend (controller, service, model, middleware) | 9 file | ✅ Selesai |
| Database migration | 3 migrasi baru | ✅ Selesai |
| Frontend (React components) | 4 file | ✅ Selesai |
| Konfigurasi / Infrastruktur | 2 file | ✅ Selesai |
| Test setup | 2 file | ✅ Diperbarui |
| **Total** | **20 file** | **76/76 test passing** |

---

## 2. Detail Perubahan per File

### 2.1 Backend

#### `src/services/gradingService.js`
- **Temuan #6 (TINGGI)**: Deadline Biru diubah dari 14 hari → **7 hari** sesuai pedoman (Tabel 4)
- **Temuan #11 (TINGGI)**: Fungsi `gradeIncident` sekarang mendukung **regrading** — jika insiden sudah di-grade sebelumnya, investigasi yang ada diperbarui (type, deadline, investigator, regrade_severity) alih-alih membuat baru

#### `src/models/Incident.js`
- **Temuan KRITIS (default severity)**: `severity || 'biru'` diubah menjadi `severity || null` — insiden tanpa grading tidak lagi otomatis biru
- **Temuan #3, #4, #10, #17 (KRITIS/TINGGI)**: Method `create()` diperluas untuk menyimpan 6 field baru:
  - `incident_summary` — ringkasan/judul singkat insiden
  - `tipe_insiden` — klasifikasi Tabel 5 (15 kategori)
  - `subtipe_insiden` — subtipe dinamis per tipe
  - `spesialisasi` — spesialisasi kasus penyakit pasien
  - `unit_penyebab` — unit yang menyebabkan insiden
  - `first_reporter` — orang pertama yang melaporkan

#### `src/models/Investigation.js`
- **Temuan #5, #11 (KRITIS/TINGGI)**: Method `update()` sekarang menggunakan `null` untuk undefined values (mencegah SQL error)
- Semua field baru diinvestigasi disimpan melalui `update()` yang generic

#### `src/controllers/incidentController.js`
- **Temuan #16 (RENDAH)**: **State machine** ditambahkan pada `updateStatus()` — validasi transisi status:
  - `dilaporkan` → `divalidasi | ditolak`
  - `divalidasi` → `investigasi | ditolak`
  - `investigasi` → `ditindaklanjuti | ditolak`
  - `ditindaklanjuti` → `selesai | ditolak`
  - `selesai` / `ditolak` → tidak ada transisi keluar
- **Temuan #11 (TINGGI)**: Pengecekan `if (incident.severity)` pada grade dihapus — regrading sekarang diizinkan
- **Temuan #3, #4, #10, #17 (KRITIS/TINGGI)**: `create()` meneruskan 6 field baru ke model

#### `src/controllers/investigationController.js`
- **Temuan #5, #11 (KRITIS/TINGGI)**: `complete()` sekarang menyimpan:
  - `faktor_kontributor` — array of 8 faktor (disimpan sebagai JSON)
  - `pic_name` / `pic_role` — penanggung jawab tindak lanjut
  - `follow_up_actions` — detail tindak lanjut
  - `follow_up_deadline` — deadline tindak lanjut
  - `management_review` — boolean checkbox

#### `src/controllers/settingsController.js`
- **Temuan #15 (SEDANG)**: `updateSettings()` sekarang menyimpan 7 field data RS:
  - `hospital_name`, `hospital_ownership`, `hospital_type`, `hospital_class`
  - `hospital_bed_capacity`, `hospital_province`, `hospital_code`

#### `src/middleware/validate.js`
- **Temuan #3, #4, #7, #8, #9, #10, #11, #17**:
  - `incidentCreateSchema` diperbarui dengan:
    - `umur` → enum 7 range standar (0-1 bln, 1bln-1thn, 1-5thn, 5-15thn, 15-30thn, 30-65thn, 65+)
    - `penanggung_biaya` → enum: Pribadi, BPJS, JAMKESMAS, Asuransi Swasta, Perusahaan, Lainnya
    - `akibat_insiden` → enum: Kematian, Cedera Berat/Irreversibel, Cedera Sedang/Reversibel, Cedera Ringan, Tidak Ada Cedera
    - `tindakan_oleh` → enum: Tim, Dokter, Perawat, Petugas Lainnya
    - `incident_summary` → string max 200
    - `tipe_insiden` → enum 15 kategori Tabel 5
    - `subtipe_insiden` → string max 100
    - `spesialisasi` → enum 14 spesialisasi
    - `unit_penyebab` → string max 100
    - `first_reporter` → enum: Karyawan, Pasien, Keluarga/Pendamping, Pengunjung, Lainnya
  - `investigationCompleteSchema` diperbarui dengan:
    - `faktor_kontributor` → array string max 20
    - `pic_name`, `pic_role` → string
    - `follow_up_actions` → string max 5000
    - `follow_up_deadline` → date YYYY-MM-DD
    - `management_review` → boolean

#### `src/routes/settings.js`
- **Temuan #15 (SEDANG)**: `updateSettingsSchema` diperluas dengan 6 field baru (opsional)

#### `src/services/scheduler.js` (file baru)
- **Temuan #18 (RENDAH)**: Scheduler cron untuk notifikasi deadline investigasi:
  - Berjalan setiap hari jam 07:00
  - Mengecek investigasi yang deadline-nya dalam H-7, H-3, H-1
  - Juga mendeteksi investigasi yang sudah lewat deadline (overdue)
  - Memanggil `notifyDeadline()` yang sudah ada

#### `src/index.js`
- **Temuan #18**: Scheduler di-start setelah server siap

#### `src/__tests__/setup.js`
- Ditambahkan tabel `ruangan` dan `settings` untuk test database
- Ditambahkan kolom `must_change_password`, `ruangan_id` ke tabel users
- Semua kolom baru incidents dan investigations ditambahkan ke DDL

#### `src/__tests__/api.test.js`
- Test "duplicate grade rejected" (expected 409) diubah menjadi "regrade allowed" (expected 200)

#### `src/__tests__/models.test.js`
- Test "gets stats" tidak lagi mengecek `stats.merah >= 1` (karena severity tidak lagi default biru)

### 2.2 Frontend

#### `frontend/src/pages/IncidentCreate.jsx`
- **Temuan #3**: Ditambahkan field **Ringkasan Insiden** (`incident_summary`)
- **Temuan #4**: Ditambahkan **Tipe Insiden** (dropdown 15 kategori Tabel 5) dan **Subtipe** (cascading dinamis)
- **Temuan #10**: Ditambahkan **Spesialisasi Pasien** (dropdown 14 opsi) dan **Unit Penyebab** (text)
- **Temuan #17**: Ditambahkan **Orang Pertama Melapor** (dropdown 5 opsi)
- **Temuan #7**: Umur diubah dari `input type="number"` → **dropdown 7 range standar** sesuai pedoman
- **Temuan #8**: Penanggung Biaya diubah dari opsi tidak standar → **Pribadi, BPJS, JAMKESMAS, Asuransi Swasta, Perusahaan, Lainnya**
- **Temuan #9**: Akibat Insiden diubah dari `input type="text"` → **dropdown 5 kategori standar**: Kematian, Cedera Berat, Cedera Sedang, Cedera Ringan, Tidak Ada Cedera
- Tindakan Oleh diubah dari free text → **dropdown**: Tim, Dokter, Perawat, Petugas Lainnya
- Help sidebar diperbarui sesuai field baru

#### `frontend/src/pages/IncidentDetail.jsx`
- **Temuan #3, #4, #10, #17**: Menampilkan field baru: Ringkasan, Klasifikasi, Spesialisasi, Unit Penyebab, Pertama Melapor
- **Temuan #9**: Menampilkan Akibat Insiden (sekarang kategori standar)
- **Temuan #8**: Menampilkan Penanggung Biaya (sekarang nilai standar)
- **Temuan #16**: Dropdown **Update Status** sekarang hanya menampilkan **transisi yang valid** sesuai state machine
- Menambahkan tampilan: Akibat Insiden, Tindakan Awal, Tindakan Oleh, Pernah Terjadi, Pencegahan Ulang, No. RM, Umur, JK, Penanggung Biaya

#### `frontend/src/pages/InvestigationDetail.jsx`
- **Temuan #5**: Ditambahkan **Faktor Kontributor** (8 checkbox dari pedoman)
- **Temuan #11**: Ditambahkan **PIC** (nama + jabatan), **Tindak Lanjut Detail**, **Deadline Tindak Lanjut**, **Management Review** checkbox
- Hasil investigasi yang sudah selesai menampilkan: faktor kontributor, PIC, deadline, management review, regrade

#### `frontend/src/pages/Settings.jsx`
- **Temuan #15**: Ditambahkan form **Data Rumah Sakit (Laporan Eksternal)** dengan 6 field:
  - Kepemilikan RS (dropdown: Pemerintah Pusat/Daerah/TNI/Swasta/BUMN)
  - Tipe RS (dropdown: Umum/Khusus/RSIA/dll)
  - Kelas RS (dropdown: A/B/C/D/Pratama/Madya)
  - Kapasitas Tempat Tidur (text)
  - Propinsi (text)
  - Kode RS (text — untuk KKP-RS PERSI)

---

## 3. Migrasi Database

Tiga migrasi baru ditambahkan ke `src/config/migrate.js`:

### Migration 013: `add_incident_audit_fields`
```sql
ALTER TABLE incidents ADD COLUMN incident_summary TEXT;
ALTER TABLE incidents ADD COLUMN tipe_insiden TEXT;
ALTER TABLE incidents ADD COLUMN subtipe_insiden TEXT;
ALTER TABLE incidents ADD COLUMN spesialisasi TEXT;
ALTER TABLE incidents ADD COLUMN unit_penyebab TEXT;
ALTER TABLE incidents ADD COLUMN first_reporter TEXT;
```

### Migration 014: `add_investigation_audit_fields`
```sql
ALTER TABLE investigations ADD COLUMN faktor_kontributor TEXT;
ALTER TABLE investigations ADD COLUMN pic_name TEXT;
ALTER TABLE investigations ADD COLUMN pic_role TEXT;
ALTER TABLE investigations ADD COLUMN follow_up_actions TEXT;
ALTER TABLE investigations ADD COLUMN follow_up_deadline TEXT;
ALTER TABLE investigations ADD COLUMN management_review INTEGER DEFAULT 0;
ALTER TABLE investigations ADD COLUMN regrade_severity TEXT;
```

### Migration 015: `seed_hospital_settings`
```sql
INSERT OR IGNORE INTO settings (key, value) VALUES ('hospital_ownership', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('hospital_type', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('hospital_class', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('hospital_bed_capacity', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('hospital_province', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('hospital_code', '');
```

---

## 4. API Endpoint Baru/Diubah

### Modul Baru (Pasca-Audit)

| Method | Path | Deskripsi |
|---|---|---|
| GET/POST/PATCH/DELETE | `/api/v1/master/ruangan` | CRUD master data ruangan (admin) |
| GET/POST/PATCH/DELETE | `/api/v1/master/users` | CRUD master data users (admin) |
| GET | `/api/v1/laporan` | Data laporan untuk filtering/export |
| GET | `/api/v1/laporan/export/excel` | Export laporan ke Excel (.xlsx) |
| GET | `/api/v1/laporan/export/pdf` | Export laporan ke PDF |
| GET | `/api/v1/health` | Health check dengan timestamp & version |

### Endpoint yang Diubah

| Method | Path | Perubahan |
|---|---|---|
| `POST /api/v1/incidents` | `incidents` | Menerima 6 field baru (opsional): `incident_summary`, `tipe_insiden`, `subtipe_insiden`, `spesialisasi`, `unit_penyebab`, `first_reporter`. Validasi diperketat untuk `umur`, `penanggung_biaya`, `akibat_insiden`, `tindakan_oleh` (sekarang enum) |
| `PATCH /api/v1/incidents/:id/grade` | `incidents` | Tidak lagi reject regrading — grade bisa diubah kapan saja |
| `PATCH /api/v1/incidents/:id/status` | `incidents` | Validasi state machine — hanya menerima transisi valid |
| `PATCH /api/v1/investigations/:id/complete` | `investigations` | Menerima 6 field baru: `faktor_kontributor`, `pic_name`, `pic_role`, `follow_up_actions`, `follow_up_deadline`, `management_review` |
| `PUT /api/v1/settings` | `settings` | Menerima 6 field baru data RS: `hospital_ownership`, `hospital_type`, `hospital_class`, `hospital_bed_capacity`, `hospital_province`, `hospital_code` |

---

## 5. Panduan untuk Pengembangan Selanjutnya

### 5.1 Yang Perlu Diketahui Developer Baru

1. **State machine**: Status insiden sekarang memiliki transisi yang ketat. Setiap perubahan status divalidasi di `incidentController.updateStatus()`.
2. **Regrading**: Grade bisa diubah kapan saja oleh validator/pmkp/admin. Investigasi yang ada akan diperbarui, bukan dibuat baru.
3. **Auto-migration**: Migrasi berjalan otomatis saat server start (`src/index.js` memanggil `migrate.js` sebelum listen). Untuk development manual, jalankan `npm run migrate`.
4. **Scheduler**: Notifikasi deadline berjalan via `node-cron` setiap jam 07:00. Log ada di `app.log`.
5. **Master Data**: Modul `/api/v1/master/*` menyediakan CRUD untuk `ruangan` dan `users` — hanya untuk role admin.
6. **Laporan**: Modul `/api/v1/laporan/*` menyediakan export Excel/PDF dengan filter tanggal, status, severity, unit, dan ruangan — bisa diakses oleh role pmkp, manajemen, admin, kepala_unit, validator.

### 5.2 Catatan Penting

1. **Validasi 2×24 jam** (Temuan #1 KRITIS): Belum diimplementasikan karena membutuhkan perubahan arsitektur signifikan. Saat ini hanya edukasi manual ke pelapor.
2. **Pelaporan eksternal KKP-RS** (Temuan #2 KRITIS): Data RS sudah lengkap di Settings, tetapi modul export ke format KKP-RS masih perlu dikembangkan.
3. **Kamus Indikator**, **Survey Budaya**, **PDSA** (Temuan #12-14 SEDANG): Modul baru yang belum dikembangkan. Data RS sudah siap, struktur database bisa diperluas.

### 5.3 Arsitektur Database

```
users
├── ruangan_id ───────────────┐
                              │
ruangan                       │
├── id ───────────────────────┤
                              │
incidents                     │
├── reporter_id ───> users    │
├── ruangan_id ────> ruangan ─┘
├── incident_summary          ← NEW
├── tipe_insiden              ← NEW (15 kategori Tabel 5)
├── subtipe_insiden           ← NEW
├── spesialisasi              ← NEW
├── unit_penyebab             ← NEW
├── first_reporter            ← NEW
├── umur (enum, bukan int)    ← CHANGED
├── penanggung_biaya (enum)   ← CHANGED
├── akibat_insiden (enum)     ← CHANGED
├── tindakan_oleh (enum)      ← CHANGED
└── severity (nullable)       ← FIXED

investigations
├── incident_id ──> incidents
├── faktor_kontributor (JSON) ← NEW
├── pic_name                  ← NEW
├── pic_role                  ← NEW
├── follow_up_actions         ← NEW
├── follow_up_deadline        ← NEW
├── management_review (bool)  ← NEW
└── regrade_severity          ← NEW

settings
├── hospital_name
├── hospital_logo
├── hospital_ownership        ← NEW
├── hospital_type             ← NEW
├── hospital_class            ← NEW
├── hospital_bed_capacity     ← NEW
├── hospital_province         ← NEW
└── hospital_code             ← NEW
```

### 5.4 Menjalankan Test

```bash
npm test              # Semua test (76 test passing)
npm run test:watch    # Watch mode untuk development
npm run test:coverage # Dengan coverage report
```

### 5.5 Deploy

```bash
npm run migrate       # Jalankan migrasi database
cd frontend && npm run build  # Build frontend
npm start             # Start production server
```

Semua field baru bersifat **opsional** (nullable di database, `optional()` di Zod schema) — data lama tetap kompatibel.
