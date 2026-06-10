---
title: PRD - SI-API (Sistem Informasi Analisa Pelaporan Insiden)
status: Draft
version: 1.0
date: 2026-06-10
---

# SI-API (Sistem Informasi Analisa Pelaporan Insiden) RSUD dr. R. Soedjono Selong

## TL;DR

SI-API adalah sistem aplikasi digital yang memfasilitasi pelaporan, analisis, dan pembelajaran insiden keselamatan pasien secara terintegrasi, aman, dan _user-friendly_ di RSUD dr. R. Soedjono Selong. Aplikasi ini bertujuan memastikan mutu, kepatuhan, serta efisiensi pelaporan insiden (KTD, KNC) dan memudahkan proses tindak lanjut. Targetnya adalah seluruh staf medis, paramedis, manajemen kualitas, serta unit PMKP rumah sakit.

---

## Goals

### Business Goals

- Menurunkan angka insiden keselamatan pasien (KTD/KNC) terlapor sebesar ≥30% di tahun pertama operasional aplikasi.
- Mengurangi rata-rata waktu pelaporan insiden dari >3 hari menjadi <24 jam per pelaporan.
- Memenuhi seluruh standar akreditasi nasional terkait sistem pelaporan mutu dan keselamatan pasien.
- Meningkatkan _engagement_ staf dalam pelaporan insiden minimal 85% _coverage_ staf pelapor.

### User Goals

- Memungkinkan staf rumah sakit melakukan pelaporan insiden dengan mudah, cepat, dan tanpa rasa takut (_just culture_, _no blaming_).
- Memastikan manajemen mendapatkan data insiden yang reliabel dan terstandar untuk kebutuhan analisa, mitigasi risiko, dan tindak lanjut.
- Membantu unit PMKP dan manajemen risiko melakukan investigasi, RCA, rekomendasi, serta dokumentasi tindak lanjut berbasis data valid.
- Memudahkan unit PMKP dan manajemen risiko dalam menyusun laporan periodik insiden untuk kebutuhan akreditasi dan mutu internal.

### Non-Goals

- Tidak digunakan sebagai sistem manajemen rekam medis umum pasien.
- Tidak menggantikan sistem manajemen risiko non-kesehatan (keamanan, infrastruktur, bencana).
- Tidak digunakan untuk komunikasi pasien/pribadi pasien dengan rumah sakit terkait hasil pelaporan insiden.

---

## User Stories

### 1. Perawat

- Sebagai perawat, saya ingin mengisi laporan insiden jatuh pasien via aplikasi di komputer/*nurse station*, agar pelaporan bisa dilakukan segera tanpa harus menunggu _shift_ selesai.
- Sebagai perawat, saya ingin laporan dapat di-*submit* dengan opsi "tanpa identitas" untuk menjaga suasana kerja yang adil.

### 2. Dokter

- Sebagai dokter jaga, saya ingin melaporkan *medication error* tanpa menunggu atasan, agar intervensi cepat bisa terjadi dan tidak terjadi *blaming*.
- Sebagai dokter, saya ingin melihat rekap pelaporan insiden di unit kerja saya bulan berjalan.

### 3. Komite Mutu / Tim PMKP

- Sebagai anggota Tim PMKP, saya ingin mendapat notifikasi otomatis setiap ada insiden yang masuk dan segera memproses *grading* serta tindak lanjutnya.
- Sebagai anggota Komite Mutu, saya ingin melihat *clustering* dan tren insiden per unit/bulan/jenis insiden untuk analisis lebih lanjut.

### 4. Manajemen RS / Kepala Unit

- Sebagai kepala unit, saya ingin *dashboard* insiden di unit saya untuk evaluasi rutin bulanan.
- Sebagai manajemen RS, saya ingin melihat laporan rekapitulasi insiden untuk bahan rapat mutu dan akreditasi.

---

## Functional Requirements

| ID | Fitur | Prioritas | Deskripsi |
|----|-------|-----------|-----------|
| FR-1 | Pelaporan Insiden | High | Form pelaporan internal (KTD/KNC/KPC/KTC/Sentinel), mengacu pada pedoman nasional: data insiden, kronologis, grading, akibat, tindakan segera, pelapor. |
| FR-2 | Dashboard dan Monitoring | High | Dashboard insiden per unit, jenis, severity, waktu, status tindak lanjut. Trend analysis dan visualisasi (chart, list, heatmap). |
| FR-3 | Manajemen Investigasi & RCA | Medium | Workflow investigasi sederhana/grading (biru/hijau). Workflow investigasi komprehensif/RCA (kuning/merah): root cause, rekomendasi, rencana kerja. Dokumentasi hasil, lampiran (doc, pdf, gambar). |
| FR-4 | User & Access Rights Management | High | Multi-level hak akses: pelapor, validator, PMKP, kepala unit, manajemen. Perlindungan identitas pelapor; opsi pelaporan anonim. |
| FR-5 | Penjadwalan, Reminder & Notifikasi | Medium | Email/push notifications: insiden baru, deadline tindak lanjut, permintaan validasi/data tambahan. Alert otomatis jika insiden tidak ditindaklanjuti sesuai SLA. |
| FR-6 | Pelaporan & Ekspor Data | Medium | Ekspor data, laporan periodik, rekap insiden untuk komite mutu dan audit internal. Kompilasi form dan dokumen sesuai standar akreditasi. |

---

## User Experience

### Entry Point & First-Time User Experience

- Login via intranet/SSO RS, disediakan *shortcut* di setiap komputer *nurse station* dan dokter.
- *Onboarding*: tutorial interaktif pertama penggunaan aplikasi (opsional: video *explainer*).

### Core Experience

1. **Step 1:** User login, pilih "Lapor Insiden", isi form detail kejadian (tanggal, waktu, lokasi, insiden, kronologis, jenis insiden, akibat, tindakan segera).
   - UI sederhana, *guidance tooltip* di setiap *field* kritis.
   - Validasi: *mandatory field* *highlight*/error jika kosong.
   - Opsi *submit* tanpa nama jika user memilih anonim.
   - Setelah *submit*, dapat pesan "Laporan terkirim dan akan diverifikasi."

2. **Step 2:** Atasan/validator menerima notifikasi laporan masuk, lakukan *grading* (biru/hijau/kuning/merah).
   - Jika **Biru/Hijau**: *workflow* investigasi sederhana (maks. 2 minggu).
   - Jika **Kuning/Merah**: otomatis lanjut ke proses RCA dan *assignment investigator team*, *follow up* otomatis untuk *deadline* RCA (maks. 45 hari).
   - Status insiden diupdate: "Selesai / Ditindaklanjuti / Tindak Lanjut".

3. **Step 3:** Komite Mutu/PMKP analisis tren, grafik, dan statistik insiden. *Dashboard* untuk pelaporan dan *feedback* ke unit.

4. **Step 4: Ekspor & Rekapitulasi**
   - Data insiden yang lolos validasi dan investigasi dapat diekspor dalam format Excel/PDF untuk keperluan rekapitulasi dan audit internal.

### Advanced Features & Edge Cases

- Fitur *upload* bukti/foto/dokumen pendukung.
- *Edge-case*: insiden tidak kunjung ditindaklanjuti > SLA, otomatis *escalate*/*email reminder* ke manajemen.
- Akses *mobile* untuk laporan mendesak/kondisi darurat.

### UI/UX Highlights

- Form pelaporan intuitif; *progress bar* pengisian.
- *Full responsive* di desktop/*mobile*.
- Fitur *autocomplete* data rumah sakit/unit.
- Opsi pelaporan bilingual (ID/EN untuk pelaporan nasional).

---

## Narrative

Di tengah kompleksitas layanan RSUD dr. R. Soedjono Selong, staf medis dan perawat rentan menghadapi berbagai potensi insiden keselamatan pasien. Seringkali, pelaporan insiden yang memerlukan kecepatan dan akurasi justru terhambat oleh prosedur manual, rasa takut disalahkan, dan birokrasi yang panjang.

Dengan SI-API, setiap staf — dari perawat hingga dokter dan manajemen mutu — dapat melaporkan insiden secara *real-time*, anonim, dan aman. Komite Mutu langsung mendapatkan notifikasi untuk validasi, *grading*, hingga tindak lanjut, sehingga *root cause analysis* dan rekomendasi perbaikan dapat dilakukan dengan tepat waktu.

Budaya *just culture* pun dapat ditegakkan, staf lebih aktif melapor, risiko menurun, dan pelayanan rumah sakit makin dipercaya masyarakat sekaligus memenuhi target akreditasi nasional.

---

## Success Metrics

### User-Centric Metrics

| Metrik | Target |
|--------|--------|
| Laporan insiden masuk lewat aplikasi | ≥85% dalam 6 bulan |
| Rata-rata waktu pelaporan sejak kejadian | <24 jam |
| User satisfaction (kuesioner *onboarding* dan *usability*) | ≥90% |

### Business Metrics

| Metrik | Target |
|--------|--------|
| Penurunan *repeat* insiden tipe sama per tahun | >20% |
| Pelaporan tepat waktu sesuai SLA | 100% |
| Lolos seluruh *assessment* terkait sistem pelaporan insiden | Akreditasi |

### Technical Metrics

| Metrik | Target |
|--------|--------|
| Aplikasi *uptime* | >99% |
| SLA penanganan insiden kategori kuning/merah | >95% |
| Rata-rata waktu penyelesaian *bug*/*incident* sistem | <48 jam |

---

## Tracking Plan

| Event | Keterangan |
|-------|------------|
| `Lapor Insiden` | *Creation* |
| `Grading dan Validasi` | Status |
| `Investigasi Selesai` | Status |
| `Ekspor Data Rekapitulasi` | *Export* |

**Metrik yang dilacak:** waktu antara kejadian, pelaporan, validasi, dan RCA.

---

## Technical Considerations

### Technical Needs

- *Web-based app*, *secure login*, *local server*/hybrid *cloud*.
- *Database management* relasional dan *audit log* untuk kepatuhan (*compliance*).
- *Role-based access management*.

### Integration Points

- Integrasi dengan *existing* intranet RS untuk SSO/*single sign-on*.
- Kompatibilitas ekspor pelaporan Excel/PDF untuk audit internal.

### Data Storage & Privacy

- *Encrypted data storage* untuk kerahasiaan data pelaporan.
- Hak akses terbatas (*principle of least privilege*).
- Kepatuhan pada peraturan kerahasiaan data kesehatan nasional.

### Scalability & Performance

- Minimal 500 user aktif, 200 laporan insiden per bulan tanpa *lag*.
- *Batch data export* >100 *record*.

### Potential Challenges

- Budaya staf: mengatasi *fear*/*blaming culture*.
- Kontrol hak akses dan anonimitas di lingkungan hybrid digital/manual.
- Kemampuan migrasi data insiden lama ke sistem baru.

---

## Milestones & Sequencing

### Project Estimate

**Medium:** 2–4 minggu (pengembangan MVP dan *piloting*, validasi oleh Komite Mutu dan Divisi IT RS).

### Team Size & Composition

**Small Team (2–3 orang):**
- 1 Product Owner / QA / Project Manager / BA Komite Mutu
- 1 *Engineer* / IT RS
- (Opsional) 1 UI/UX

### Suggested Phases

| Fase | Durasi | Deliverables | Dependencies |
|------|--------|--------------|--------------|
| **1. Discovery & Design** | 1 minggu | *Requirement gathering* (PO, Komite Mutu), desain *wireframe*, *approval workflow* | Input pedoman 1 & 2, *approval* desain |
| **2. Development MVP** | 1 minggu | Fitur pelaporan insiden, *dashboard*, *workflow grading*, validasi awal internal | Server/hosting, persetujuan IT RS |
| **3. UAT & Piloting** | 1 minggu | *User acceptance test* bersama perawat, validator, PMKP | *Training user*, *feedback loop* |
| **4. Go-Live & Iteration** | 1 minggu | *Launching*, *monitoring*, optimalisasi minor, dokumentasi untuk akreditasi | Hasil UAT |
