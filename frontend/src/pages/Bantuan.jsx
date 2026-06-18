import { useRef } from 'react';
import html2pdf from 'html2pdf.js';

const sections = [{
    title: 'Login',
    icon: '🔐',
    roles: ['Semua'],
    content: 'Halaman masuk aplikasi. Masukkan username dan password yang telah didaftarkan oleh Admin. Jika lupa password, hubungi Admin untuk mereset password Anda.',
    details: [
      { label: 'Username & Password', desc: 'Kredensial diberikan oleh Admin saat pendaftaran pengguna baru.' },
      { label: 'Password Default', desc: 'Pengguna baru mendapatkan password default. Saat pertama login, sistem akan mewajibkan Anda mengganti password.' },
      { label: 'Logo RS', desc: 'Halaman login menampilkan nama dan logo rumah sakit yang dapat dikonfigurasi oleh Admin di menu Pengaturan.' },
    ],
  },
  {
    title: 'Sidebar Navigasi',
    icon: '🧭',
    roles: ['Semua'],
    content: 'Menu samping (sidebar) menampilkan fitur-fitur yang tersedia sesuai peran Anda. Setiap peran memiliki menu yang berbeda:',
    details: [
      { label: 'Pelapor', desc: 'Dashboard, Insiden Saya, Lapor Insiden, Bantuan, Notifikasi' },
      { label: 'Validator', desc: 'Dashboard, Semua Insiden, Investigasi, Laporan, Bantuan, Notifikasi' },
      { label: 'PMKP', desc: 'Dashboard, Semua Insiden, Investigasi, Laporan, Bantuan, Notifikasi' },
      { label: 'Kepala Unit', desc: 'Dashboard, Insiden Unit, Laporan, Bantuan, Notifikasi' },
      { label: 'Manajemen', desc: 'Dashboard, Semua Insiden, Laporan, Bantuan, Notifikasi' },
      { label: 'Admin', desc: 'Dashboard, Semua Insiden, Investigasi, Laporan, Ruangan, Pengguna, Pengaturan, Notifikasi' },
    ],
    footer: 'Sidebar dapat diperkecil/diperbesar dengan tombol ◀/▶ di pojok kiri bawah. Nama dan peran Anda ditampilkan di header sidebar. Gunakan menu "Keluar" di footer sidebar untuk logout.',
  },
  {
    title: 'Dashboard',
    icon: '📊',
    roles: ['Semua'],
    content: 'Dashboard utama menampilkan ringkasan statistik insiden secara real-time. Terdapat animasi 3D pada kartu statistik yang dapat dihover untuk efek tilt.',
    details: [
      { label: 'Kartu Statistik', desc: '4 kartu berwarna gradient dengan efek 3D: Total Insiden (📊), Baru (📝 — status Dilaporkan), Diproses (⏳ — Divalidasi/Investigasi/Ditindaklanjuti), dan Selesai (✅).' },
      { label: 'Grafik Donat', desc: 'Diagram lingkaran (donut) yang menunjukkan distribusi insiden berdasarkan tingkat keparahan (Merah, Kuning, Hijau, Biru) dengan legenda warna.' },
      { label: 'Grafik Batang', desc: 'Diagram batang horizontal yang menampilkan jumlah insiden per status (Baru, Diproses, Selesai).' },
      { label: 'Grafik Tren', desc: 'Grafik area (line chart) yang menunjukkan tren insiden selama 8 periode terakhir (harian/mingguan/bulanan/tahunan).' },
      { label: 'Ringkasan Grade', desc: 'Kartu untuk setiap tingkat keparahan (Merah/Kuning/Hijau/Biru) menampilkan jumlah, persentase, dan progress bar.' },
    ],
    footer: 'Data dashboard diperbarui setiap kali halaman dimuat. Gunakan notifikasi 🔔 di pojok kanan atas untuk melihat pemberitahuan terbaru.',
  },
  {
    title: 'Lapor Insiden',
    icon: '➕',
    roles: ['Pelapor'],
    content: 'Form untuk melaporkan insiden keselamatan pasien baru. Tersedia panel petunjuk di sebelah kanan yang berubah secara dinamis sesuai field yang sedang diisi.',
    details: [
      { label: 'Informasi Kejadian', desc: 'Pilih jenis insiden (KTD/KNC/KPC/KTC/Sentinel), tanggal, waktu kejadian, dan lokasi. Lokasi terisi otomatis sesuai unit Anda.' },
      { label: 'Ringkasan & Klasifikasi Insiden', desc: 'Isi Ringkasan Insiden (judul singkat, ex: "Pasien jatuh"). Pilih Tipe Insiden (15 kategori sesuai Tabel 5 Pedoman IKP: Administrasi Klinik, Medikasi, Jatuh, Infeksi Nosokomial, dll) dan Subtipe Insiden (cascading otomatis sesuai tipe yang dipilih). Pilih Spesialisasi Pasien (14 opsi: Penyakit Dalam, Anak, Bedah, dll), Unit Penyebab, dan Orang Pertama Melapor (Karyawan/Pasien/Keluarga/Pengunjung/Lainnya).' },
      { label: 'Identitas Pasien (Opsional)', desc: 'Lengkapi data pasien jika tersedia: No. RM, Umur (pilih range standar: 0-1 bln, 1bln-1thn, 1-5thn, 5-15thn, 15-30thn, 30-65thn, 65+), Jenis Kelamin, Penanggung Biaya (Pribadi/BPJS/JAMKESMAS/Asuransi Swasta/Perusahaan/Lainnya), Tgl/Jam Masuk RS. Semua field bersifat opsional.' },
      { label: 'Detail Kejadian', desc: 'Isi kronologis kejadian secara detail (wajib), akibat/dampak (wajib), tindakan segera. Pilih Akibat Insiden (5 kategori standar: Kematian, Cedera Berat, Cedera Sedang, Cedera Ringan, Tidak Ada Cedera), Tindakan Awal, Tindakan Oleh (Tim/Dokter/Perawat/Petugas Lainnya), Pernah Terjadi, dan Pencegahan Ulang.' },
      { label: 'Lapor Anonim', desc: 'Centang "Lapor secara anonim" jika Anda ingin melaporkan tanpa menampilkan identitas sebagai pelapor.' },
    ],
    footer: 'Field wajib: Jenis Insiden, Tanggal, Waktu, Lokasi, Kronologis, dan Akibat. Setelah dikirim, sistem akan memberikan notifikasi ke Validator/PMKP untuk dilakukan grading. Gunakan panel petunjuk di sebelah kanan untuk bantuan setiap field.',
  },
  {
    title: 'Daftar Insiden',
    icon: '📋',
    roles: ['Semua'],
    content: 'Menampilkan daftar insiden dalam bentuk tabel interaktif dengan fitur pencarian dan filter yang lengkap.',
    details: [
      { label: 'Tabel Insiden', desc: 'Kolom: No, Tanggal, Tipe (warna: KTD merah, KNC oranye, KPC kuning, KTC biru, Sentinel pink), Lokasi, Severity (dengan dot dan warna), Status, Pelapor, dan Aksi.' },
      { label: 'Filter & Pencarian', desc: 'Filter berdasarkan teks (pencarian otomatis delay 400ms), ruangan, rentang tanggal, status, tingkat keparahan (severity), dan tipe insiden.' },
      { label: 'Aksi Baris', desc: 'Tombol "Detail" untuk melihat informasi lengkap insiden. Admin juga memiliki tombol "Hapus" dengan konfirmasi sebelum menghapus.' },
      { label: 'Paginate', desc: 'Pilih jumlah baris per halaman: 10/20/30/40/50. Tersedia navigasi halaman.' },
    ],
    footer: 'Setiap role melihat data yang berbeda: Pelapor hanya melihat insiden miliknya, Kepala Unit melihat insiden unitnya, sedangkan Validator/PMKP/Admin/Manajemen melihat semua insiden.',
  },
  {
    title: 'Detail Insiden & Grading',
    icon: '🔍',
    roles: ['Semua'],
    content: 'Halaman detail insiden menampilkan informasi lengkap satu insiden termasuk semua field baru sesuai pedoman IKP.',
    details: [
      { label: 'Informasi Insiden', desc: 'Menampilkan tipe insiden, tanggal & waktu, lokasi, ringkasan insiden, klasifikasi (tipe + subtipe), spesialisasi, unit penyebab, status, severity, pelapor, dan orang pertama melapor. Juga menampilkan data pasien (No. RM, umur, JK, penanggung biaya), kronologis, akibat, tindakan, dan field lainnya.' },
      { label: 'Grading Severity', desc: 'Validator/PMKP/Admin dapat memberikan penilaian tingkat keparahan dengan memilih salah satu dari 4 grade (Biru/Hijau/Kuning/Merah) lalu klik "Simpan Grade". Grade DAPAT diubah (regrade) jika diperlukan — investigasi yang ada akan diperbarui secara otomatis.' },
      { label: 'Update Status (State Machine)', desc: 'Validator/PMKP/Admin dapat mengubah status insiden melalui dropdown yang hanya menampilkan transisi valid: Dilaporkan → Divalidasi/Ditolak, Divalidasi → Investigasi/Ditolak, Investigasi → Ditindaklanjuti/Ditolak, Ditindaklanjuti → Selesai/Ditolak. Status Selesai dan Ditolak tidak bisa diubah lagi.' },
      { label: 'Export', desc: 'PMKP/Manajemen/Admin/Kepala Unit dapat mengekspor data insiden ke Excel atau PDF langsung dari halaman detail.' },
      { label: 'Investigasi', desc: 'Jika insiden sudah memiliki investigasi, akan ditampilkan link menuju halaman detail investigasi beserta tipe dan statusnya.' },
    ],
    footer: 'Grade severity menentukan deadline investigasi: Biru = 7 hari, Hijau = 14 hari, Kuning = 45 hari, Merah = 45 hari. Grade dapat diubah (regrade), deadline akan disesuaikan.',
  },
  {
    title: 'Grading / Penilaian Severity',
    icon: '🏷️',
    roles: ['Validator', 'PMKP', 'Admin'],
    content: 'Grading adalah proses penilaian tingkat keparahan (severity) insiden yang dilakukan oleh Validator atau PMKP melalui panel di halaman Detail Insiden.',
    details: [
      { label: 'Biru (Blue)', desc: 'Insiden nyaris cedera — tidak terjadi cedera pada pasien, namun ada potensi risiko. Contoh: hampir memberikan obat salah tetapi tertangkap sebelum diberikan.' },
      { label: 'Hijau (Green)', desc: 'Insiden dengan cedera ringan — pasien mengalami cedera ringan yang tidak memerlukan penanganan lanjutan. Contoh: lecet akibat jatuh dari tempat tidur.' },
      { label: 'Kuning (Yellow)', desc: 'Insiden dengan cedera sedang — pasien mengalami cedera yang memerlukan tindakan medis tambahan. Contoh: reaksi alergi obat yang memerlukan observasi.' },
      { label: 'Merah (Red)', desc: 'Insiden dengan cedera berat — pasien mengalami cedera serius, mengancam jiwa, atau mengakibatkan kecacatan/kematian. Contoh: kesalahan pembedahan, pemberian obat yang salah dosis fatal.' },
    ],
    footer: 'Grade dipilih melalui radio button di panel Grading halaman Detail Insiden. Grade DAPAT diubah (regrade) jika diperlukan — investigasi dan deadline akan menyesuaikan secara otomatis. Deadline: Biru = 7 hari, Hijau = 14 hari, Kuning = 45 hari, Merah = 45 hari.',
  },
  {
    title: 'Status Insiden & Tindak Lanjut',
    icon: '🔄',
    roles: ['Semua'],
    content: 'Setiap insiden akan melalui alur status yang mencerminkan proses penanganannya. Perubahan status dilakukan oleh Validator/PMKP/Admin melalui state machine yang ketat.',
    details: [
      { label: 'Dilaporkan', desc: 'Status awal saat insiden baru dilaporkan oleh Pelapor. Menunggu validasi oleh Validator atau PMKP.' },
      { label: 'Divalidasi', desc: 'Insiden sudah divalidasi kebenarannya dan sudah di-grade (diberi tingkat keparahan). Investigasi otomatis terbuat sesuai tipe grading.' },
      { label: 'Investigasi', desc: 'Insiden sedang dalam proses investigasi. Tim investigasi melakukan analisis akar masalah (root cause analysis) dan mengisi faktor kontributor.' },
      { label: 'Ditindaklanjuti', desc: 'Rekomendasi hasil investigasi sedang ditindaklanjuti oleh unit terkait. PIC, deadline, dan tindak lanjut dipantau oleh sistem.' },
      { label: 'Selesai', desc: 'Seluruh proses penanganan insiden telah selesai. Status terminal — tidak bisa diubah ke status lain.' },
      { label: 'Ditolak', desc: 'Insiden ditolak karena tidak memenuhi kriteria, data tidak lengkap, atau bukan termasuk insiden keselamatan pasien. Status terminal — tidak bisa diubah ke status lain.' },
    ],
    footer: 'Alur normal: Dilaporkan → Divalidasi → Investigasi → Ditindaklanjuti → Selesai. Semua status bisa langsung ditolak. Status Selesai dan Ditolak bersifat terminal (final).',
  },
  {
    title: 'Investigasi',
    icon: '🔬',
    roles: ['Validator', 'PMKP', 'Admin'],
    content: 'Investigasi dilakukan untuk menganalisis insiden secara mendalam guna menemukan akar masalah dan mencegah kejadian serupa.',
    details: [
      { label: 'Daftar Investigasi', desc: 'Menampilkan semua investigasi dengan filter status (Berlangsung/Selesai). Tabel: NO, Tipe, Severity, Status, Investigasi, Aksi.' },
      { label: 'Investigasi Sederhana', desc: 'Untuk insiden severity Biru atau Hijau (deadline 7-14 hari). Dilakukan oleh unit terkait dengan analisis sederhana. Tidak memerlukan tim investigasi khusus.' },
      { label: 'Investigasi Komprehensif', desc: 'Untuk insiden severity Kuning atau Merah (deadline 45 hari). Melibatkan tim investigasi multidisiplin dengan metode Root Cause Analysis (RCA).' },
      { label: 'Faktor Kontributor', desc: '8 kategori checkbox: Faktor Eksternal/Di Luar RS, Faktor Organisasi & Manajemen, Faktor Lingkungan Kerja, Faktor Tim, Faktor Petugas/Staf, Faktor Tugas, Faktor Pasien, Faktor Komunikasi.' },
      { label: 'PIC & Tindak Lanjut', desc: 'Isi nama dan jabatan PIC (Penanggung Jawab), detail tindak lanjut, deadline tindak lanjut, dan centang jika Manajemen Risiko sudah mereview.' },
      { label: 'Detail Investigasi', desc: 'Halaman detail menampilkan form pengisian investigasi. PMKP/Admin mengisi Root Cause, Rekomendasi, Faktor Kontributor, PIC, Tindak Lanjut. Klik "Simpan & Selesaikan" untuk menyelesaikan investigasi — status insiden otomatis menjadi "Selesai".' },
    ],
    footer: 'Field wajib: Root Cause dan Rekomendasi. Faktor Kontributor, PIC, dan Tindak Lanjut bersifat opsional. Jika terjadi regrade (perubahan grade), tipe investigasi dan deadline akan diupdate otomatis.',
  },
  {
    title: 'Laporan & Export',
    icon: '📑',
    roles: ['Validator', 'PMKP', 'Manajemen', 'Kepala Unit', 'Admin'],
    content: 'Halaman laporan menyediakan tampilan data insiden yang dapat dikustomisasi dan diexport ke berbagai format.',
    details: [
      { label: 'Filter Lengkap', desc: 'Filter berdasarkan teks, ruangan, rentang tanggal, status, severity, dan tipe insiden. Filter diterapkan pada tampilan tabel dan export.' },
      { label: 'Pemilih Kolom', desc: 'Klik tombol "Kolom" untuk memilih kolom yang ingin ditampilkan: Tanggal, Waktu, Tipe, Severity, Status, Lokasi, Pelapor, Unit, Kronologis, Akibat, Tindakan. Pilihan tersimpan otomatis.' },
      { label: 'Export Excel', desc: 'Klik "Excel" untuk mengexport data dengan format XLSX (Microsoft Excel). Data yang diexport sesuai filter dan kolom yang dipilih.' },
      { label: 'Export PDF', desc: 'Klik "PDF" untuk mengexport data ke format PDF. Data yang diexport sesuai filter dan kolom yang dipilih.' },
    ],
    footer: 'Export akan diunduh secara otomatis dengan nama file "laporan_insiden_{timestamp}.xlsx" atau ".pdf". Gunakan filter untuk mempersempit data yang akan diexport.',
  },
  {
    title: 'Master Data - Ruangan',
    icon: '🏥',
    roles: ['Admin'],
    content: 'Kelola data ruangan/unit di rumah sakit yang digunakan sebagai lokasi kejadian insiden.',
    details: [
      { label: 'Tambah Ruangan', desc: 'Klik "+ Tambah Ruangan", isi Nama dan Deskripsi ruangan. Nama bersifat wajib.' },
      { label: 'Edit Ruangan', desc: 'Klik ikon pensil pada baris ruangan yang ingin diedit. Ubah data di modal yang muncul.' },
      { label: 'Hapus Ruangan', desc: 'Klik ikon tong sampah, konfirmasi penghapusan. Peringatan: data yang sudah digunakan pada insiden tidak dapat dihapus.' },
      { label: 'Pencarian', desc: 'Gunakan kotak pencarian untuk mencari ruangan berdasarkan nama atau deskripsi.' },
    ],
    footer: 'Data ruangan digunakan sebagai referensi lokasi pada form Lapor Insiden dan filter pada Daftar Insiden serta Laporan.',
  },
  {
    title: 'Master Data - Pengguna',
    icon: '👥',
    roles: ['Admin'],
    content: 'Kelola semua akun pengguna aplikasi. Setiap pengguna memiliki peran (role) yang menentukan akses fitur.',
    details: [
      { label: 'Tambah Pengguna', desc: 'Klik "+ Tambah Pengguna". Isi Username, Nama Lengkap, Password, Pilih Role, dan Unit/Ruangan. Password bersifat wajib untuk pengguna baru.' },
      { label: 'Edit Pengguna', desc: 'Klik ikon pensil. Ubah data pengguna termasuk role dan unit. Kosongkan password jika tidak ingin mengubahnya.' },
      { label: 'Hapus Pengguna', desc: 'Klik ikon tong sampah dengan konfirmasi. Pastikan pengguna tidak memiliki data terkait sebelum dihapus.' },
      { label: 'Role Pengguna', desc: '6 role tersedia: Pelapor, Validator, PMKP, Kepala Unit, Manajemen, dan Admin. Role Admin memiliki akses penuh ke seluruh sistem.' },
    ],
    footer: 'Pengguna baru akan mendapatkan password default yang harus diganti saat login pertama. Status pengguna (Aktif/Nonaktif) dapat diatur melalui fitur edit.',
  },
  {
    title: 'Notifikasi',
    icon: '🔔',
    roles: ['Semua'],
    content: 'Sistem notifikasi memberitahu Anda tentang perubahan status insiden, investigasi baru, deadline mendekat, atau informasi penting lainnya.',
    details: [
      { label: 'Daftar Notifikasi', desc: 'Menampilkan semua notifikasi dengan tanggal, tipe, dan pesan. Notifikasi yang belum dibaca ditandai dengan latar belakang berbeda.' },
      { label: 'Tandai Dibaca', desc: 'Klik "Tandai Semua Dibaca" untuk menandai semua notifikasi sebagai sudah dibaca. Badge notifikasi di sidebar akan hilang.' },
      { label: 'Notifikasi Deadline (Scheduler)', desc: 'Sistem otomatis mengirim notifikasi pengingat deadline investigasi: H-7, H-3, H-1, dan overdue. Notifikasi dikirim ke PMKP dan Admin.' },
      { label: 'Pagination', desc: 'Atur jumlah notifikasi per halaman (10/20/30/40/50).' },
    ],
    footer: 'Notifikasi muncul secara otomatis ketika: insiden baru dilaporkan, status berubah, grading diberikan, investigasi selesai, atau deadline mendekati jatuh tempo. Pantau badge 🔔 di sidebar untuk notifikasi baru.',
  },
  {
    title: 'Pengaturan',
    icon: '⚙️',
    roles: ['Admin'],
    content: 'Konfigurasi aplikasi meliputi identitas rumah sakit, data RS untuk laporan eksternal, yang ditampilkan di halaman login dan sidebar.',
    details: [
      { label: 'Nama Rumah Sakit', desc: 'Ubah nama rumah sakit yang akan ditampilkan di halaman login dan tab browser. Klik "Simpan" setelah mengubah.' },
      { label: 'Logo Rumah Sakit', desc: 'Upload logo rumah sakit. Format yang didukung: PNG, JPG, SVG. Maksimal 2MB. Logo akan ditampilkan di sidebar, halaman login, dan tab browser.' },
      { label: 'Data Rumah Sakit', desc: 'Data RS untuk laporan eksternal (Dinkes/Kemenkes): Kepemilikan RS (Pemerintah/Swasta), Tipe RS (Umum/Khusus), Kelas RS (A/B/C/D), Kapasitas Tempat Tidur, Provinsi RS, dan Kode RS (Kemenkes).' },
    ],
    footer: 'Perubahan nama, logo, dan data RS akan langsung terlihat setelah disimpan. Data RS diperlukan untuk format laporan eksternal.',
  },
  {
    title: 'Ganti Password',
    icon: '🔑',
    roles: ['Semua'],
    content: 'Halaman untuk mengganti password akun Anda. Disarankan mengganti password secara berkala untuk keamanan akun.',
    details: [
      { label: 'Password Saat Ini', desc: 'Masukkan password yang sedang digunakan.' },
      { label: 'Password Baru', desc: 'Masukkan password baru. Minimal 4 karakter. Tidak boleh sama dengan password lama.' },
      { label: 'Konfirmasi Password', desc: 'Ketik ulang password baru. Harus sama dengan input Password Baru.' },
    ],
    footer: 'Jika Anda login dengan password default (dari Admin), sistem akan menampilkan peringatan di bagian atas halaman. Segera ganti password Anda. Simpan password baru di tempat yang aman.',
  },
  {
    title: 'Tipe-Tipe Insiden',
    icon: '📌',
    roles: ['Semua'],
    content: 'Berikut adalah definisi setiap tipe insiden keselamatan pasien yang digunakan dalam sistem:',
    details: [
      { label: 'KTD — Kejadian Tidak Diharapkan', desc: 'Insiden yang sudah terjadi dan mengakibatkan cedera pada pasien. Contoh: pasien jatuh dari tempat tidur dan mengalami patah tulang.' },
      { label: 'KNC — Kejadian Nyaris Cedera', desc: 'Insiden yang belum sampai mengenai pasien karena tertangkap sebelum diberikan. Contoh: hendak memberikan obat A tapi obat B sudah disiapkan, tertangkap sebelum diberikan.' },
      { label: 'KPC — Kejadian Potensial Cedera', desc: 'Kondisi yang sangat berpotensi menjadi cedera tetapi belum terjadi insiden. Contoh: selang oksigen terlepas, ditemukan saat inspeksi.' },
      { label: 'KTC — Kejadian Tidak Cedera', desc: 'Insiden terjadi tetapi tidak mengakibatkan cedera. Contoh: pasien menerima obat yang salah tetapi tidak menimbulkan efek samping.' },
      { label: 'Sentinel', desc: 'Kejadian sangat serius yang mengakibatkan kematian atau cacat permanen. Contoh: kematian akibat kesalahan anestesi, operasi pada bagian tubuh yang salah.' },
    ],
  },
  {
    title: 'Tentang Aplikasi',
    icon: 'ℹ️',
    roles: ['Semua'],
    content: 'SI-API (Sistem Informasi Analisa Pelaporan Insiden) adalah aplikasi manajemen insiden keselamatan pasien berbasis web yang digunakan untuk mencatat, memantau, menganalisis, dan menindaklanjuti insiden keselamatan pasien di rumah sakit.',
    footer: 'Aplikasi ini mendukung alur kerja pelaporan insiden mulai dari pelaporan awal oleh staf, validasi dan grading oleh validator, investigasi oleh tim PMKP, hingga tindak lanjut dan penyelesaian. Seluruh riwayat perubahan tercatat untuk audit trail.',
  },
];

export default function Bantuan() {
  const ref = useRef(null);

  const handleExportPDF = () => {
    const btn = document.querySelector('.bantuan-export-btn');
    const element = document.getElementById('bantuan-content');
    if (btn) btn.style.display = 'none';
    const opt = {
      margin: [10, 10, 10, 10],
      filename: 'Panduan_SI-API.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
    };
    html2pdf().set(opt).from(element).save().then(() => {
      if (btn) btn.style.display = '';
    });
  };

  return (
    <div className="page">
      <div id="bantuan-content" ref={ref}>
        <div className="page-header">
        <h1>Bantuan</h1>
        <button className="btn btn-primary bantuan-export-btn" onClick={handleExportPDF}>📄 Export PDF</button>
      </div>

      <div className="bantuan-intro">
        <p>Selamat datang di <strong>SI-API</strong> — Sistem Informasi Analisa Pelaporan Insiden. Berikut adalah panduan lengkap penggunaan setiap fitur dalam aplikasi sesuai dengan peran pengguna.</p>
        <p style={{ marginTop: 8, fontSize: 13, color: '#6b7280' }}>Klik tombol <strong>Export PDF</strong> di atas untuk menyimpan panduan ini sebagai file PDF. Gunakan daftar peran pada setiap kartu untuk mengetahui fitur apa saja yang dapat diakses oleh peran Anda.</p>
      </div>

      <div className="bantuan-card bantuan-card-dasar">
        <div className="bantuan-card-header">
          <span className="bantuan-icon">📘</span>
          <h3>Dasar Pengembangan SI-API</h3>
        </div>
        <p className="bantuan-content">SI-API dikembangkan berdasarkan dua pedoman resmi yang digunakan sebagai acuan dalam perancangan fitur, alur kerja, dan formulir pelaporan insiden keselamatan pasien.</p>
        <ul className="bantuan-detail-list">
          <li className="bantuan-detail-item">
            <strong>Pedoman 1 — Pedoman IKP (KKP-RS PERSI)</strong> — Pedoman Nasional Pelaporan Insiden Keselamatan Pasien dari Komite Keselamatan Pasien Rumah Sakit (KKP-RS) PERSI. Berisi panduan grading risiko (Tabel 3-4), 15 tipe insiden (Tabel 5), formulir pelaporan internal &amp; eksternal, serta alur investigasi.
          </li>
          <li className="bantuan-detail-item">
            <strong>Pedoman 2 — Pedoman Mutu RSUD dr. R. Soedjono</strong> — Pedoman Mutu &amp; Keselamatan Pasien RSUD dr. R. Soedjono Selong. Berisi kamus indikator mutu, formulir investigasi sederhana, kuesioner budaya keselamatan pasien, dan form PDSA (Plan-Do-Study-Act).
          </li>
        </ul>
        <p className="bantuan-footer" style={{ fontSize: 14 }}>
          📥 Unduh pedoman:&nbsp;
          <a href="/uploads/pedoman/pedoman_1.pdf" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: '#1d4ed8' }}>Pedoman 1 (KKP-RS)</a>
          &nbsp;|&nbsp;
          <a href="/uploads/pedoman/pedoman_2.pdf" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600, color: '#1d4ed8' }}>Pedoman 2 (RSUD)</a>
        </p>
      </div>

      <div className="bantuan-card bantuan-card-flow">
        <div className="bantuan-card-header">
          <span className="bantuan-icon">🔄</span>
          <h3>Alur Pelaporan Insiden — Tugas &amp; Fungsi Setiap Peran</h3>
        </div>

        <div className="bantuanc-flow-intro">
          <p style={{ marginBottom: 12, lineHeight: 1.6 }}>
            Berikut adalah alur lengkap pelaporan insiden keselamatan pasien dari awal sampai selesai beserta tugas dan fungsi (tupoksi) setiap peran.
            Setiap langkah hanya dapat dilakukan oleh角色 yang memiliki wewenang sesuai sistem.
          </p>
        </div>

        {/* ─── Flow Steps ─── */}
        <div className="bantuan-flow-steps">
          {/* STEP A */}
          <div className="bantuan-flow-step bantuan-flow-step-pelapor">
            <div className="bantuan-flow-step-header">
              <span className="bantuan-flow-step-num">A</span>
              <div>
                <strong>Pelapor Melaporkan Insiden</strong>
                <span className="bantuan-flow-role">Peran: Pelapor (Perawat/Dokter/Petugas)</span>
              </div>
            </div>
            <div className="bantuan-flow-step-body">
              <p><strong>Tugas:</strong> Login → klik menu "Lapor Insiden" → isi formulir lengkap (jenis insiden, kronologis, tipe insiden, data pasien, dll) → submit.</p>
              <p><strong>Yang terjadi:</strong> Insiden tercatat dengan status <code>dilaporkan</code>, severity <code>—</code> (belum di-grade). Notifikasi dikirim ke Validator &amp; PMKP.</p>
              <p className="bantuan-flow-tip">💡 <strong>Tip:</strong> Isi field selengkap mungkin agar memudahkan Validator melakukan grading. Gunakan fitur "Lapor Anonim" jika ingin identitas disembunyikan.</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="bantuan-flow-arrow">⬇</div>

          {/* STEP B */}
          <div className="bantuan-flow-step bantuan-flow-step-validator">
            <div className="bantuan-flow-step-header">
              <span className="bantuan-flow-step-num">B</span>
              <div>
                <strong>Validator Melakukan Grading Risiko</strong>
                <span className="bantuan-flow-role">Peran: Validator / PMKP</span>
              </div>
            </div>
            <div className="bantuan-flow-step-body">
              <p><strong>Tugas:</strong> Buka menu "Semua Insiden" → klik "Detail" pada insiden baru → lakukan grading dengan memilih tingkat keparahan (Biru/Hijau/Kuning/Merah) → simpan.</p>
              <p><strong>Yang terjadi:</strong> Severity terisi, status berubah menjadi <code>divalidasi</code>, investigasi otomatis dibuat sesuai tipe grading (sederhana/komprehensif), deadline dihitung otomatis.</p>
              <div className="bantuan-flow-deadline">
                <div><strong>Biru</strong> → deadline 7 hari (investigasi sederhana)</div>
                <div><strong>Hijau</strong> → deadline 14 hari (investigasi sederhana)</div>
                <div><strong>Kuning</strong> → deadline 45 hari (investigasi komprehensif)</div>
                <div><strong>Merah</strong> → deadline 45 hari (investigasi komprehensif)</div>
              </div>
              <p className="bantuan-flow-tip">💡 <strong>Tip:</strong> Grading dapat diubah (regrade) jika diperlukan. Misal: dari Biru menjadi Kuning setelah ditemukan informasi baru. Deadline dan tipe investigasi akan menyesuaikan otomatis.</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="bantuan-flow-arrow">⬇</div>

          {/* STEP C */}
          <div className="bantuan-flow-step bantuan-flow-step-pmkp">
            <div className="bantuan-flow-step-header">
              <span className="bantuan-flow-step-num">C</span>
              <div>
                <strong>Investigasi Dilaksanakan</strong>
                <span className="bantuan-flow-role">Peran: PMKP / Admin</span>
              </div>
            </div>
            <div className="bantuan-flow-step-body">
              <p><strong>Tugas:</strong> Buka menu "Investigasi" → klik "Detail" pada investigasi yang perlu ditindaklanjuti. Update status insiden secara bertahap:</p>
              <div className="bantuan-flow-status-list">
                <div><strong>① Divalidasi → Investigasi</strong> — Insiden sedang dalam proses investigasi. Tim melakukan analisis akar masalah.</div>
                <div><strong>② Investigasi → Ditindaklanjuti</strong> — Rekomendasi hasil investigasi mulai ditindaklanjuti oleh unit terkait.</div>
              </div>
              <p className="bantuan-flow-tip">💡 <strong>Tip:</strong> Gunakan state machine yang ketat — setiap status hanya bisa pindah ke status yang diizinkan. Status tidak bisa melompat atau mundur.</p>
            </div>
          </div>

          {/* Arrow */}
          <div className="bantuan-flow-arrow">⬇</div>

          {/* STEP D */}
          <div className="bantuan-flow-step bantuan-flow-step-pmkp">
            <div className="bantuan-flow-step-header">
              <span className="bantuan-flow-step-num">D</span>
              <div>
                <strong>PMKP Melengkapi &amp; Menyelesaikan Investigasi</strong>
                <span className="bantuan-flow-role">Peran: PMKP / Admin</span>
              </div>
            </div>
            <div className="bantuan-flow-step-body">
              <p><strong>Tugas:</strong> Buka halaman detail investigasi → isi semua field pelengkap:</p>
              <ul style={{ margin: '6px 0 6px 20px', fontSize: 13, lineHeight: 1.6 }}>
                <li><strong>Root Cause</strong> — Akar masalah insiden</li>
                <li><strong>Faktor Kontributor</strong> — Pilih dari 8 kategori (Faktor Pasien, Komunikasi, Lingkungan Kerja, dll)</li>
                <li><strong>Rekomendasi &amp; Rencana Tindak</strong> — Langkah perbaikan</li>
                <li><strong>PIC</strong> — Penanggung jawab tindak lanjut (nama + jabatan)</li>
                <li><strong>Follow Up</strong> — Detail dan deadline tindak lanjut</li>
                <li><strong>Review Manajemen Risiko</strong> — Centang jika sudah direview</li>
              </ul>
              <p><strong>Yang terjadi:</strong> Status investigasi menjadi <code>selesai</code>, status insiden <strong>otomatis</strong> menjadi <code>selesai</code>. Insiden selesai diproses.</p>
              <p className="bantuan-flow-tip">💡 <strong>Tip:</strong> Pastikan semua field terisi dengan baik. Data investigasi digunakan untuk analisis tren dan laporan manajemen.</p>
            </div>
          </div>
        </div>

        {/* ─── Summary Table ─── */}
        <div style={{ marginTop: 20 }}>
          <h4 style={{ marginBottom: 8, color: '#1e293b' }}>Ringkasan Tupoksi per Peran</h4>
          <div className="bantuan-flow-table-wrap">
            <table className="bantuan-flow-table">
              <thead>
                <tr>
                  <th>Peran</th>
                  <th>Tugas Utama</th>
                  <th>Tidak Bisa Melakukan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="bantuan-role-tag" style={{ background: '#dbeafe', color: '#1e40af' }}>Pelapor</span></td>
                  <td>Lapor insiden, melihat insiden sendiri, mengubah password</td>
                  <td>Grading, mengubah status, menghapus insiden, melihat data pengguna</td>
                </tr>
                <tr>
                  <td><span className="bantuan-role-tag" style={{ background: '#fef3c7', color: '#92400e' }}>Validator</span></td>
                  <td>Grading severity, mengubah status insiden, melihat semua insiden &amp; investigasi</td>
                  <td>Melengkapi investigasi, menghapus insiden, mengelola pengguna/ruangan</td>
                </tr>
                <tr>
                  <td><span className="bantuan-role-tag" style={{ background: '#d1fae5', color: '#065f46' }}>PMKP</span></td>
                  <td>Grading, mengubah status, melengkapi &amp; menyelesaikan investigasi, export laporan</td>
                  <td>Menghapus insiden, mengelola pengguna/ruangan</td>
                </tr>
                <tr>
                  <td><span className="bantuan-role-tag" style={{ background: '#f3e8ff', color: '#6b21a8' }}>Kepala Unit</span></td>
                  <td>Melihat insiden unit sendiri, export laporan</td>
                  <td>Grading, mengubah status, mengelola investigasi, menghapus data</td>
                </tr>
                <tr>
                  <td><span className="bantuan-role-tag" style={{ background: '#fce7f3', color: '#9d174d' }}>Manajemen</span></td>
                  <td>Melihat semua insiden &amp; investigasi, export laporan</td>
                  <td>Grading, mengubah status, mengelola investigasi, menghapus data</td>
                </tr>
                <tr>
                  <td><span className="bantuan-role-tag" style={{ background: '#e0e7ff', color: '#3730a3' }}>Admin</span></td>
                  <td>Semua akses: grading, investigasi, kelola pengguna, ruangan, pengaturan, export</td>
                  <td>— (full access)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── State Machine Diagram ─── */}
        <div style={{ marginTop: 20 }}>
          <h4 style={{ marginBottom: 8, color: '#1e293b' }}>Diagram Alur Status (State Machine)</h4>
          <div className="bantuan-flow-diagram">
            <div className="bantuan-flow-diagram-row">
              <div className="bantuan-flow-diagram-node bantuan-flow-node-start">dilaporkan</div>
              <div className="bantuan-flow-diagram-arrow">➡</div>
              <div className="bantuan-flow-diagram-node bantuan-flow-node-active">divalidasi</div>
              <div className="bantuan-flow-diagram-arrow">➡</div>
              <div className="bantuan-flow-diagram-node bantuan-flow-node-active">investigasi</div>
              <div className="bantuan-flow-diagram-arrow">➡</div>
              <div className="bantuan-flow-diagram-node bantuan-flow-node-active">ditindaklanjuti</div>
              <div className="bantuan-flow-diagram-arrow">➡</div>
              <div className="bantuan-flow-diagram-node bantuan-flow-node-end">selesai</div>
            </div>
            <div className="bantuan-flow-diagram-reject">
              <span className="bantuan-flow-diagram-node bantuan-flow-node-reject">ditolak</span>
              <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>— bisa dari status mana pun (kecuali selesai)</span>
            </div>
          </div>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
            ⚠️ Status <strong>selesai</strong> dan <strong>ditolak</strong> bersifat <em>terminal</em> — tidak bisa diubah ke status lain.
            Transisi mundur (misal: investigasi → dilaporkan) <strong>tidak diizinkan</strong>.
          </p>
        </div>
      </div>

      <div className="bantuan-grid">
        {sections.map((s, i) => (
          <div key={i} className="bantuan-card">
            <div className="bantuan-card-header">
              <span className="bantuan-icon">{s.icon}</span>
              <h3>{s.title}</h3>
            </div>
            <div className="bantuan-roles">
              {s.roles.map(r => <span key={r} className="bantuan-role-tag">{r}</span>)}
            </div>
            <p className="bantuan-content">{s.content}</p>
            {s.details && (
              <ul className="bantuan-detail-list">
                {s.details.map((d, j) => (
                  <li key={j} className="bantuan-detail-item">
                    <strong>{d.label}</strong> — {d.desc}
                  </li>
                ))}
              </ul>
            )}
            {s.footer && (
              <p className="bantuan-footer">{s.footer}</p>
            )}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
