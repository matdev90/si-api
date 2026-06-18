const request = require('supertest');
const express = require('express');
const { execute, query } = require('../config/database');

/*
  UJI COBA LANJUTAN — 5 Skenario Insiden Berbeda
  ===============================================
  Case 6: KTD auto-grade kuning (prob=3, dampak=4 → 12) → Regrade Merah → Komprehensif → Selesai
  Case 7: KNC → Divalidasi → Hijau → Sederhana → Selesai
  Case 8: KPC langsung Merah → Komprehensif → Selesai
  Case 9: KTC non-anonim (manual grade) → Biru → Sederhana → Selesai
  Case 10: Sentinel → Kuning → Komprehensif → Ditindaklanjuti → Selesai

  Verifikasi akhir: Semua insiden masuk rekap laporan & dashboard stats.
*/

let app, tokens = {};
const allIncidentIds = {};
const allInvestigationIds = {};

beforeAll(async () => {
  const { v4: uuidv4 } = require('uuid');
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('12345', 10);

  execute(`INSERT OR IGNORE INTO users (id, username, password, name, role, unit) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), 'uji_pelapor', hash, 'Uji Pelapor', 'pelapor', 'IGD']);
  execute(`INSERT OR IGNORE INTO users (id, username, password, name, role, unit) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), 'uji_validator', hash, 'Uji Validator', 'validator', 'IGD']);
  execute(`INSERT OR IGNORE INTO users (id, username, password, name, role, unit) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), 'uji_pmkp', hash, 'Uji PMKP', 'pmkp', 'Mutu']);

  const { securityMiddleware } = require('../middleware/security');
  const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');
  const routes = require('../routes');

  app = express();
  app.use(securityMiddleware);
  app.use(express.json());
  app.use('/api/v1', routes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Login semua role
  tokens.pelapor = (await request(app).post('/api/v1/auth/login').send({ username: 'uji_pelapor', password: '12345' })).body.token;
  tokens.validator = (await request(app).post('/api/v1/auth/login').send({ username: 'uji_validator', password: '12345' })).body.token;
  tokens.pmkp = (await request(app).post('/api/v1/auth/login').send({ username: 'uji_pmkp', password: '12345' })).body.token;
});

/* ───────────── CASE 6: KTD → Kuning (auto-grade) → Regrade Merah → Komprehensif → Selesai ───────────── */
describe('Case 6: KTD auto-grade kuning - Regrade Merah - Komprehensif - Selesai', () => {
  let incId, invId;

  it('C6.1 Create KTD with prob=3, dampak=4 (auto-grade kuning)', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'KTD',
        incident_date: '2026-06-01',
        incident_time: '07:30',
        location: 'Ruang Bersalin',
        description: 'Pasien postpartum mengalami perdarahan hebat setelah tindakan KBI, Hb turun drastis, perlu transfusi 2 kantung.',
        consequence: 'Pasien syok hipovolemik, transfusi 2 kantung PRC, observasi ICU 24 jam',
        immediate_action: 'Resusitasi cairan, transfusi darurat, konsul anastesi',
        incident_summary: 'Perdarahan postpartum pasca KBI',
        tipe_insiden: 'proses_prosedur_klinis',
        subtipe_insiden: 'Proses',
        spesialisasi: 'Obstetri Ginekologi',
        unit_penyebab: 'Ruangan VK Bersalin',
        first_reporter: 'Karyawan',
        no_rm: '03.04.5678',
        umur: '30-65_tahun',
        jenis_kelamin: 'Perempuan',
        penanggung_biaya: 'BPJS',
        akibat_insiden: 'Cedera Berat/Irreversibel',
        tindakan_awal: 'Resusitasi + transfusi',
        tindakan_oleh: 'Tim',
        probabilitas: 3,
        dampak: 4,
        pernah_terjadi: 'Ya',
        pencegahan_ulang: 'Review SOP KBI dan kesiapan darah darurat',
      });
    expect(res.status).toBe(201);
    expect(res.body.grade_otomatis).toBe('kuning');
    expect(res.body.severity).toBe('kuning'); // auto-grade sets severity langsung
    incId = res.body.id;
    allIncidentIds.case6 = incId;
  });

  it('C6.2 Re-grade: kuning → merah (escalation)', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${incId}/grade`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ severity: 'merah' });
    expect(res.status).toBe(200);
    expect(res.body.severity).toBe('merah');
    expect(res.body.type).toBe('komprehensif');
    invId = res.body.investigationId;
    expect(invId).toBeDefined();
    allInvestigationIds.case6 = invId;
  });

  it('C6.3 Status otomatis divalidasi', async () => {
    const res = await request(app).get(`/api/v1/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('divalidasi');
    expect(res.body.severity).toBe('merah');
  });

  it('C6.4 Transitions: divalidasi → investigasi → ditindaklanjuti', async () => {
    let res = await request(app).patch(`/api/v1/incidents/${incId}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'investigasi' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('investigasi');

    res = await request(app).patch(`/api/v1/incidents/${incId}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'ditindaklanjuti' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ditindaklanjuti');
  });

  it('C6.5 PMKP completes investigation with all fields', async () => {
    const res = await request(app).patch(`/api/v1/investigations/${invId}/complete`)
      .set('Authorization', `Bearer ${tokens.pmkp}`)
      .send({
        root_cause: 'Tidak ada assessment risiko perdarahan pada pasien postpartum, keterlambatan deteksi tanda syok',
        recommendations: 'Implementasi MEOWS scoring, pelatihan early warning sign syok hipovolemik',
        action_plan: 'Sosialisasi MEOWS ke seluruh bidan dan dokter jaga VK',
        faktor_kontributor: ['Faktor Organisasi & Manajemen', 'Faktor Petugas / Staf', 'Faktor Komunikasi'],
        pic_name: 'Dr. Anita SpOG',
        pic_role: 'Kepala VK Bersalin',
        follow_up_actions: 'Audit kepatuhan penggunaan MEOWS setiap bulan, laporan ke komite mutu',
        follow_up_deadline: '2026-08-15',
        management_review: true,
      });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('selesai');
  });

  it('C6.6 Final: incident status selesai (severity: merah)', async () => {
    const res = await request(app).get(`/api/v1/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('selesai');
    expect(res.body.severity).toBe('merah');
    expect(res.body.investigation).not.toBeNull();
    expect(res.body.investigation.status).toBe('selesai');
  });
});

/* ───────────── CASE 7: KNC → Divalidasi → Hijau → Sederhana → Selesai ───────────── */
describe('Case 7: KNC - Hijau - Sederhana - Selesai', () => {
  let incId, invId;

  it('C7.1 Create KNC incident (near miss)', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'KNC',
        incident_date: '2026-06-05',
        incident_time: '10:15',
        location: 'Farmasi Rawat Jalan',
        description: 'Perawat hampir memberikan obat injeksi ceftriaxone tanpa tes kulit terlebih dahulu, pasien memiliki riwayat alergi penisilin.',
        consequence: 'Belum terjadi cedera, obat tertukar dengan pasien lain namun tertangkap sebelum injeksi',
        immediate_action: 'Konfirmasi alergi pasien, tes kulit, edukasi perawat',
        incident_summary: 'Nyaris injeksi ceftriaxone tanpa skin test pada pasien alergi',
        tipe_insiden: 'medikasi',
        subtipe_insiden: 'Proses Penggunaan',
        spesialisasi: 'Umum',
        unit_penyebab: 'Farmasi Rawat Jalan',
        first_reporter: 'Karyawan',
        no_rm: '05.06.7890',
        umur: '30-65_tahun',
        jenis_kelamin: 'Laki-laki',
        penanggung_biaya: 'Asuransi Swasta',
        akibat_insiden: 'Tidak Ada Cedera',
        tindakan_awal: 'Tes kulit, observasi 30 menit',
        tindakan_oleh: 'Perawat',
        pernah_terjadi: 'Tidak',
        pencegahan_ulang: 'Pasang alert alergi di sistem SIMRS dan rekam medis',
      });
    expect(res.status).toBe(201);
    expect(res.body.incident_type).toBe('KNC');
    expect(res.body.severity).toBeNull();
    incId = res.body.id;
    allIncidentIds.case7 = incId;
  });

  it('C7.2 Validator grades as hijau (sedang)', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${incId}/grade`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ severity: 'hijau' });
    expect(res.status).toBe(200);
    expect(res.body.severity).toBe('hijau');
    expect(res.body.type).toBe('sederhana');
    invId = res.body.investigationId;
    allInvestigationIds.case7 = invId;
  });

  it('C7.3 Status: divalidasi → investigasi → ditindaklanjuti', async () => {
    let res = await request(app).patch(`/api/v1/incidents/${incId}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'investigasi' });
    expect(res.status).toBe(200);

    res = await request(app).patch(`/api/v1/incidents/${incId}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'ditindaklanjuti' });
    expect(res.status).toBe(200);
  });

  it('C7.4 PMKP completes investigation sederhana', async () => {
    const res = await request(app).patch(`/api/v1/investigations/${invId}/complete`)
      .set('Authorization', `Bearer ${tokens.pmkp}`)
      .send({
        root_cause: 'Tidak ada sistem alert alergi di sistem informasi, perawat tidak melakukan anamnesis alergi sebelum injeksi',
        recommendations: 'Integrasi alert alergi di SIMRS, edukasi anamnesis alergi sebelum tindakan injeksi',
        action_plan: 'Koordinasi dengan IT untuk alert alergi, pelatihan perawat',
        faktor_kontributor: ['Faktor Komunikasi', 'Faktor Tugas', 'Faktor Organisasi & Manajemen'],
        pic_name: 'apt. Rina, S.Farm',
        pic_role: 'Kepala Farmasi',
        follow_up_actions: 'Monitoring implementasi alert alergi, audit kepatuhan anamnesis alergi',
        follow_up_deadline: '2026-07-30',
        management_review: true,
      });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('selesai');
  });

  it('C7.5 Final: incident selesai', async () => {
    const res = await request(app).get(`/api/v1/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('selesai');
    expect(res.body.severity).toBe('hijau');
  });
});

/* ───────────── CASE 8: KPC → Merah → Komprehensif → Selesai ───────────── */
describe('Case 8: KPC langsung Merah - Komprehensif - Selesai', () => {
  let incId, invId;

  it('C8.1 Create KPC with high-risk potential', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'KPC',
        incident_date: '2026-06-08',
        incident_time: '14:00',
        location: 'NICU',
        description: 'Ditemukan inkubator dengan suhu tidak stabil 41°C pada jam 14.00, bayi prematur 28 minggu di dalamnya berpotensi hipertermia berat.',
        consequence: 'Potensi cedera otak pada bayi prematur akibat hipertermia, belum terjadi karena cepat terdeteksi',
        immediate_action: 'Pindahkan bayi ke inkubator cadangan, kalibrasi inkubator rusak',
        incident_summary: 'Inkubator overheat 41°C pada bayi prematur',
        tipe_insiden: 'alat_medis',
        subtipe_insiden: 'Tipe Alat',
        spesialisasi: 'Anak',
        unit_penyebab: 'NICU',
        first_reporter: 'Karyawan',
        no_rm: '07.08.9012',
        umur: '0-1_bulan',
        jenis_kelamin: 'Perempuan',
        penanggung_biaya: 'BPJS',
        akibat_insiden: 'Cedera Berat/Irreversibel',
        tindakan_awal: 'Pindah inkubator, kalibrasi ulang',
        tindakan_oleh: 'Tim',
        pernah_terjadi: 'Ya',
        pencegahan_ulang: 'Jadwal kalibrasi inkubator berkala, checklist suhu harian',
      });
    expect(res.status).toBe(201);
    incId = res.body.id;
    allIncidentIds.case8 = incId;
  });

  it('C8.2 Validator grades as merah (ekstrim)', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${incId}/grade`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ severity: 'merah' });
    expect(res.status).toBe(200);
    expect(res.body.severity).toBe('merah');
    expect(res.body.type).toBe('komprehensif');
    invId = res.body.investigationId;
    allInvestigationIds.case8 = invId;
  });

  it('C8.3 Status: divalidasi → investigasi → ditindaklanjuti', async () => {
    let res = await request(app).patch(`/api/v1/incidents/${incId}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'investigasi' });
    expect(res.status).toBe(200);

    res = await request(app).patch(`/api/v1/incidents/${incId}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'ditindaklanjuti' });
    expect(res.status).toBe(200);
  });

  it('C8.4 PMKP completes komprehensif investigation', async () => {
    const res = await request(app).patch(`/api/v1/investigations/${invId}/complete`)
      .set('Authorization', `Bearer ${tokens.pmkp}`)
      .send({
        root_cause: 'Tidak ada jadwal kalibrasi preventif untuk inkubator, tidak ada alarm suhu otomatis, engineering non-standar',
        recommendations: 'Kontrak maintenance dengan vendor resmi, pasang thermometer digital terkalibrasi di setiap inkubator, alarm suhu otomatis',
        action_plan: 'Audit seluruh inkubator NICU, re-sertifikasi alat kesehatan',
        faktor_kontributor: ['Faktor Organisasi & Manajemen', 'Faktor Lingkungan Kerja', 'Faktor Tugas'],
        pic_name: 'Dr. Budi SpA',
        pic_role: 'Kepala NICU',
        follow_up_actions: 'Sertifikasi ulang inkubator, pelatihan penggunaan alat kepada perawat NICU',
        follow_up_deadline: '2026-08-01',
        management_review: true,
      });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('selesai');
  });

  it('C8.5 Final: incident selesai', async () => {
    const res = await request(app).get(`/api/v1/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('selesai');
    expect(res.body.severity).toBe('merah');
  });
});

/* ───────────── CASE 9: KTC non-anonim → manual grade Biru → Sederhana → Selesai ───────────── */
describe('Case 9: KTC non-anonim - manual grade Biru - Sederhana - Selesai', () => {
  let incId, invId;

  it('C9.1 Create KTC non-anonim (tanpa auto-grade)', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'KTC',
        incident_date: '2026-06-12',
        incident_time: '09:45',
        location: 'Rawat Inap Melati',
        description: 'Pasien terjatuh dari tempat tidur saat mencoba turun sendiri tanpa bantuan perawat, keluarga sedang ke toilet.',
        consequence: 'Pasien memar ringan di lengan kanan, tidak ada fraktur, kesadaran compos mentis',
        immediate_action: 'Evaluasi TTV, observasi tanda fraktur, kompres dingin',
        is_anonymous: false,
        incident_summary: 'Pasien jatuh dari TT rawat inap',
        tipe_insiden: 'jatuh',
        subtipe_insiden: 'Tipe Jatuh',
        spesialisasi: 'Penyakit Dalam',
        unit_penyebab: 'Rawat Inap',
        first_reporter: 'Keluarga/Pendamping',
        no_rm: '09.10.3456',
        umur: '65_plus_tahun',
        jenis_kelamin: 'Laki-laki',
        penanggung_biaya: 'JAMKESMAS',
        tgl_masuk_rs: '2026-06-10',
        jam_masuk_rs: '15:00',
        akibat_insiden: 'Cedera Ringan',
        tindakan_awal: 'Observasi, kompres dingin',
        tindakan_oleh: 'Perawat',
        pernah_terjadi: 'Ya',
        pencegahan_ulang: 'Pasang side rail bed, edukasi pasien untuk memanggil perawat sebelum turun',
      });
    expect(res.status).toBe(201);
    expect(res.body.grade_otomatis).toBeNull();
    expect(res.body.severity).toBeNull();
    incId = res.body.id;
    allIncidentIds.case9 = incId;
  });

  it('C9.2 Reporter non-anonim tampil', async () => {
    const res = await request(app).get(`/api/v1/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.is_anonymous).toBe(0);
    expect(res.body.reporter_name).not.toBe('Anonim');
    expect(res.body.severity).toBeNull();
  });

  it('C9.3 Validator grades as biru', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${incId}/grade`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ severity: 'biru' });
    expect(res.status).toBe(200);
    expect(res.body.severity).toBe('biru');
    expect(res.body.type).toBe('sederhana');
    expect(res.body.regrade).toBeUndefined();
    invId = res.body.investigationId;
    allInvestigationIds.case9 = invId;
  });

  it('C9.4 Status: divalidasi → investigasi → ditindaklanjuti', async () => {
    let res = await request(app).patch(`/api/v1/incidents/${incId}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'investigasi' });
    expect(res.status).toBe(200);

    res = await request(app).patch(`/api/v1/incidents/${incId}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'ditindaklanjuti' });
    expect(res.status).toBe(200);
  });

  it('C9.5 PMKP completes sederhana investigation', async () => {
    const res = await request(app).patch(`/api/v1/investigations/${invId}/complete`)
      .set('Authorization', `Bearer ${tokens.pmkp}`)
      .send({
        root_cause: 'Keluarga pasien tidak diedukasi untuk menggunakan bell call, side rail tidak terpasang optimal',
        recommendations: 'Edukasi penggunaan bell call, side rail wajib terpasang untuk pasien >65 tahun, checklist keselamatan pasien rawat inap',
        action_plan: 'Sosialisasi ke seluruh perawat rawat inap',
        faktor_kontributor: ['Faktor Komunikasi', 'Faktor Pasien'],
        pic_name: 'Ns. Herman, S.Kep',
        pic_role: 'Kepala Ruang Rawat Inap',
        follow_up_actions: 'Audit kepatuhan pemasangan side rail dan edukasi pasien',
        follow_up_deadline: '2026-07-15',
        management_review: true,
      });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('selesai');
  });

  it('C9.6 Final: incident selesai dengan data lengkap', async () => {
    const res = await request(app).get(`/api/v1/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('selesai');
    expect(res.body.severity).toBe('biru');
    expect(res.body.is_anonymous).toBe(0);
  });
});

/* ───────────── CASE 10: Sentinel → Kuning → Komprehensif → Ditindaklanjuti → Selesai ───────────── */
describe('Case 10: Sentinel - Kuning - Komprehensif - Ditindaklanjuti - Selesai', () => {
  let incId, invId;

  it('C10.1 Create sentinel incident (kuning severity)', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'sentinel',
        incident_date: '2026-06-18',
        incident_time: '22:10',
        location: 'HCU',
        description: 'Pasien post operasi kolesistektomi mengalami aspirasi saat muntah di HCU, terjadi henti napas 3 menit sebelum ditolong.',
        consequence: 'Pasien berhasil diresusitasi, pneumonia aspirasi, perpanjangan rawat 7 hari',
        immediate_action: 'Resusitasi, suction, konsul anastesi, foto toraks',
        incident_summary: 'Aspirasi post operasi di HCU',
        tipe_insiden: 'proses_prosedur_klinis',
        subtipe_insiden: 'Proses',
        spesialisasi: 'Bedah',
        unit_penyebab: 'HCU / Recovery Room',
        first_reporter: 'Karyawan',
        no_rm: '11.12.7890',
        umur: '30-65_tahun',
        jenis_kelamin: 'Perempuan',
        penanggung_biaya: 'BPJS',
        tgl_masuk_rs: '2026-06-16',
        jam_masuk_rs: '08:00',
        akibat_insiden: 'Cedera Sedang/Reversibel',
        tindakan_awal: 'Resusitasi + suction + O2',
        tindakan_oleh: 'Tim',
        pernah_terjadi: 'Ya',
        pencegahan_ulang: 'Review protokol post operasi monitoring di HCU',
      });
    expect(res.status).toBe(201);
    expect(res.body.incident_type).toBe('sentinel');
    incId = res.body.id;
    allIncidentIds.case10 = incId;
  });

  it('C10.2 Validator grades as kuning', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${incId}/grade`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ severity: 'kuning' });
    expect(res.status).toBe(200);
    expect(res.body.severity).toBe('kuning');
    expect(res.body.type).toBe('komprehensif');
    invId = res.body.investigationId;
    allInvestigationIds.case10 = invId;
  });

  it('C10.3 Status: divalidasi → investigasi → ditindaklanjuti', async () => {
    let res = await request(app).patch(`/api/v1/incidents/${incId}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'investigasi' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('investigasi');

    res = await request(app).patch(`/api/v1/incidents/${incId}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'ditindaklanjuti' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ditindaklanjuti');
  });

  it('C10.4 PMKP completes komprehensif investigation', async () => {
    const res = await request(app).patch(`/api/v1/investigations/${invId}/complete`)
      .set('Authorization', `Bearer ${tokens.pmkp}`)
      .send({
        root_cause: 'Tidak ada protokol monitoring status kesadaran dan posisi tidur post operasi di HCU, staffing malam tidak sesuai rasio',
        recommendations: 'Pembuatan SOP monitoring post operasi di HCU, penambahan staf jaga malam, pelatihan BLS untuk perawat HCU',
        action_plan: 'Sosialisasi SOP, koordinasi dengan keperawatan untuk rotasi staf',
        faktor_kontributor: ['Faktor Organisasi & Manajemen', 'Faktor Tugas', 'Faktor Lingkungan Kerja'],
        pic_name: 'dr. Made SpB',
        pic_role: 'Kepala Kamar Operasi',
        follow_up_actions: 'Audit kepatuhan SOP monitoring post operasi, review BLS skill perawat HCU',
        follow_up_deadline: '2026-09-01',
        management_review: true,
      });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('selesai');
  });

  it('C10.5 Final: incident selesai', async () => {
    const res = await request(app).get(`/api/v1/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('selesai');
    expect(res.body.severity).toBe('kuning');
  });
});

/* ───────────── VERIFIKASI REKAP LAPORAN — semua insiden masuk ───────────── */
describe('Verifikasi Rekap Laporan & Dashboard', () => {
  it('REKAP-01: Laporan JSON berisi semua 5 insiden baru', async () => {
    const res = await request(app).get('/api/v1/laporan/')
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
    expect(res.body.total).toBeGreaterThanOrEqual(5);

    // Semua incident ID harus ada di laporan
    const laporanIds = res.body.data.map(d => d._id);
    expect(laporanIds).toContain(allIncidentIds.case6);
    expect(laporanIds).toContain(allIncidentIds.case7);
    expect(laporanIds).toContain(allIncidentIds.case8);
    expect(laporanIds).toContain(allIncidentIds.case9);
    expect(laporanIds).toContain(allIncidentIds.case10);
  });

  it('REKAP-02: Laporan bisa difilter berdasarkan severity merah', async () => {
    const res = await request(app).get('/api/v1/laporan/?severity=merah')
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1); // case6 (merah) dan case8 (merah)
    res.body.data.forEach(d => {
      expect(d.Severity).toBe('merah');
    });
  });

  it('REKAP-03: Laporan bisa difilter berdasarkan status selesai', async () => {
    const res = await request(app).get('/api/v1/laporan/?status=selesai')
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(5);
  });

  it('REKAP-04: Dashboard stats menampilkan data baru', async () => {
    const res = await request(app).get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    const stats = res.body;
    expect(stats.total).toBeGreaterThanOrEqual(5);
    expect(stats.selesai).toBeGreaterThanOrEqual(5);
  });

  it('REKAP-05: Export Excel berhasil (tidak error)', async () => {
    const res = await request(app).get('/api/v1/laporan/export/excel')
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml');
  });

  it('REKAP-06: Export PDF berhasil (tidak error)', async () => {
    const res = await request(app).get('/api/v1/laporan/export/pdf')
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('pdf');
  });

  it('REKAP-07: Pencarian laporan berdasarkan incident_summary berfungsi', async () => {
    const res = await request(app).get('/api/v1/laporan/?search=perdarahan')
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });

  it('REKAP-08: Filter laporan berdasarkan tipe insiden', async () => {
    const res = await request(app).get('/api/v1/laporan/?incident_type=KTC')
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    res.body.data.forEach(d => {
      expect(d.Tipe).toBe('KTC');
    });
  });

  it('REKAP-09: Semua insiden selesai memiliki investigasi selesai', async () => {
    for (const key of ['case6', 'case7', 'case8', 'case9', 'case10']) {
      const res = await request(app).get(`/api/v1/incidents/${allIncidentIds[key]}`)
        .set('Authorization', `Bearer ${tokens.pmkp}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('selesai');
      expect(res.body.investigation).not.toBeNull();
      expect(res.body.investigation.status).toBe('selesai');
    }
  });

  it('REKAP-10: Deadline grading sesuai severity', async () => {
    // case9 = biru → maks 7 hari
    const inv9 = await request(app).get(`/api/v1/investigations/${allInvestigationIds.case9}`)
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(inv9.status).toBe(200);
    const deadline9 = new Date(inv9.body.deadline);
    const created9 = new Date(inv9.body.created_at || Date.now());
    const diffDays9 = Math.round((deadline9 - created9) / (1000 * 60 * 60 * 24));
    expect(diffDays9).toBeLessThanOrEqual(7);

    // case8 = merah → maks 45 hari
    const inv8 = await request(app).get(`/api/v1/investigations/${allInvestigationIds.case8}`)
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(inv8.status).toBe(200);
    const deadline8 = new Date(inv8.body.deadline);
    const created8 = new Date(inv8.body.created_at || Date.now());
    const diffDays8 = Math.round((deadline8 - created8) / (1000 * 60 * 60 * 24));
    expect(diffDays8).toBeLessThanOrEqual(45);
  });
});
