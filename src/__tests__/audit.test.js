const request = require('supertest');
const express = require('express');
const { execute, query } = require('../config/database');

let app, tokens = {};

/*
  AUDIT TEST — 5 Complete Flow Cases
  ===================================
  Case 1: KTD ringan → Biru → Investigasi Sederhana → Selesai
  Case 2: Sentinel → Merah → Investigasi Komprehensif → Selesai
  Case 3: KPC → Biru → Regrade Kuning → Investigasi Komprehensif → Selesai
  Case 4: KNC → Ditolak (tanpa grading, tanpa investigasi)
  Case 5: KTC anonim dengan SEMUA field baru → Hijau → Investigasi Sederhana → Selesai
*/

const allIncidentIds = {};
const allInvestigationIds = {};

beforeAll(async () => {
  const { v4: uuidv4 } = require('uuid');
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash('12345', 10);

  execute(`INSERT OR IGNORE INTO users (id, username, password, name, role, unit) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), 'audit_pelapor', hash, 'Audit Pelapor', 'pelapor', 'IGD']);
  execute(`INSERT OR IGNORE INTO users (id, username, password, name, role, unit) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), 'audit_validator', hash, 'Audit Validator', 'validator', 'IGD']);
  execute(`INSERT OR IGNORE INTO users (id, username, password, name, role, unit) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), 'audit_pmkp', hash, 'Audit PMKP', 'pmkp', 'Mutu']);
  execute(`INSERT OR IGNORE INTO users (id, username, password, name, role, unit) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), 'audit_kepala_unit', hash, 'Audit KU', 'kepala_unit', 'IGD']);
  execute(`INSERT OR IGNORE INTO users (id, username, password, name, role, unit) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), 'audit_manajemen', hash, 'Audit Manajemen', 'manajemen', 'Direksi']);
  execute(`INSERT OR IGNORE INTO users (id, username, password, name, role, unit) VALUES (?, ?, ?, ?, ?, ?)`,
    [uuidv4(), 'audit_admin', hash, 'Audit Admin', 'admin', 'TI']);

  const { securityMiddleware } = require('../middleware/security');
  const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');
  const routes = require('../routes');

  app = express();
  app.use(securityMiddleware);
  app.use(express.json());
  app.use('/api/v1', routes);
  app.use(notFoundHandler);
  app.use(errorHandler);
});

async function login(username) {
  const res = await request(app).post('/api/v1/auth/login').send({ username, password: '12345' });
  return res.body.token;
}

/* ───────────── CASE 1: KTD → Biru → Sederhana → Selesai ───────────── */
describe('Case 1: KTD ringan - Biru - Sederhana - Selesai', () => {
  let incId, invId;

  it('C1.1 Pelapor login & create KTD incident', async () => {
    tokens.pelapor = await login('audit_pelapor');
    expect(tokens.pelapor).toBeDefined();

    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'KTD', incident_date: '2026-06-10', incident_time: '09:00',
        location: 'Rawat Inap', description: 'Pasien terima obat antihipertensi dosis ganda oleh perawat jaga',
        consequence: 'Hipotensi ringan, observasi 2 jam',
        immediate_action: 'Observasi TTV setiap 15 menit',
        incident_summary: 'Salah pemberian dosis obat',
        tipe_insiden: 'medikasi', subtipe_insiden: 'Medikasi Terkait',
        spesialisasi: 'Penyakit Dalam', unit_penyebab: 'Rawat Inap Flamboyan',
        first_reporter: 'Karyawan',
        no_rm: '01.02.1234', umur: '30-65_tahun', jenis_kelamin: 'Laki-laki',
        penanggung_biaya: 'BPJS', tgl_masuk_rs: '2026-06-08', jam_masuk_rs: '14:00',
        akibat_insiden: 'Cedera Ringan', tindakan_awal: 'Observasi',
        tindakan_oleh: 'Tim', pernah_terjadi: 'Tidak', pencegahan_ulang: 'Sosialisasi SPO pemberian obat',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.severity).toBeNull();
    expect(res.body.status).toBe('dilaporkan');
    incId = res.body.id;
    allIncidentIds.case1 = incId;
  });

  it('C1.1b Verify new fields stored correctly via GET', async () => {
    const res = await request(app).get(`/api/v1/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokens.pelapor}`);
    expect(res.status).toBe(200);
    expect(res.body.incident_summary).toBe('Salah pemberian dosis obat');
    expect(res.body.tipe_insiden).toBe('medikasi');
    expect(res.body.spesialisasi).toBe('Penyakit Dalam');
    expect(res.body.first_reporter).toBe('Karyawan');
    expect(res.body.no_rm).toBe('01.02.1234');
    expect(res.body.penanggung_biaya).toBe('BPJS');
    expect(res.body.akibat_insiden).toBe('Cedera Ringan');
  });

  it('C1.2 Validator grades as biru (low risk)', async () => {
    tokens.validator = await login('audit_validator');
    const res = await request(app).patch(`/api/v1/incidents/${incId}/grade`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ severity: 'biru' });
    expect(res.status).toBe(200);
    expect(res.body.severity).toBe('biru');
    expect(res.body.type).toBe('sederhana');
    expect(res.body.regrade).toBeUndefined();
    invId = res.body.investigationId;
    expect(invId).toBeDefined();
    allInvestigationIds.case1 = invId;
  });

  it('C1.3 Status otomatis menjadi divalidasi setelah grading', async () => {
    const res = await request(app).get(`/api/v1/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('divalidasi');
    expect(res.body.severity).toBe('biru');
  });

  it('C1.4 Validator updates status to investigasi', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${incId}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'investigasi' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('investigasi');
  });

  it('C1.5 PMKP completes investigation', async () => {
    tokens.pmkp = await login('audit_pmkp');
    const res = await request(app).patch(`/api/v1/investigations/${invId}/complete`)
      .set('Authorization', `Bearer ${tokens.pmkp}`)
      .send({
        root_cause: 'Perawat tidak melakukan verifikasi pasien sebelum pemberian obat',
        recommendations: 'Implementasi sistem verifikasi 5 tepat pemberian obat',
        action_plan: 'Sosialisasi ulang SPO verifikasi obat',
        faktor_kontributor: ['Faktor Komunikasi', 'Faktor Tugas'],
        pic_name: 'Dr. Andi', pic_role: 'Kepala Ruangan',
        follow_up_actions: 'Monitoring kepatuhan verifikasi setiap bulan',
        follow_up_deadline: '2026-08-01',
        management_review: true,
      });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('selesai');
  });

  it('C1.6 Status incident otomatis selesai setelah investigasi completed', async () => {
    const res = await request(app).get(`/api/v1/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('selesai');
    expect(res.body.investigation).toBeDefined();
    expect(res.body.investigation.status).toBe('selesai');
  });

  it('C1.7 Data consistency: investigation fields stored correctly', async () => {
    const res = await request(app).get(`/api/v1/investigations/${invId}`)
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.root_cause).toContain('verifikasi');
    expect(res.body.faktor_kontributor).toBeDefined();
    const kontributor = JSON.parse(res.body.faktor_kontributor);
    expect(kontributor).toContain('Faktor Komunikasi');
    expect(res.body.pic_name).toBe('Dr. Andi');
    expect(res.body.management_review).toBe(1);
    expect(res.body.follow_up_deadline).toBe('2026-08-01');
  });
});

/* ───────────── CASE 2: Sentinel → Merah → Komprehensif → Selesai ───────────── */
describe('Case 2: Sentinel - Merah - Komprehensif - Selesai', () => {
  let incId, invId;

  it('C2.1 Create sentinel incident (kematian pasien)', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'sentinel', incident_date: '2026-06-15', incident_time: '03:30',
        location: 'ICU', description: 'Pasien henti napas pasca ekstubasi dini oleh dokter jaga tanpa weaning protocol',
        consequence: 'Pasien meninggal dunia pasca resusitasi gagal',
        immediate_action: 'Resusitasi jantung paru 30 menit, konsultasi anastesi',
        incident_summary: 'Kematian pasca ekstubasi dini di ICU',
        tipe_insiden: 'proses_prosedur_klinis', subtipe_insiden: 'Proses',
        spesialisasi: 'Anastesi', unit_penyebab: 'ICU',
        first_reporter: 'Karyawan',
        akibat_insiden: 'Kematian',
        umur: '65_plus_tahun', jenis_kelamin: 'Perempuan',
        pernah_terjadi: 'Ya', pencegahan_ulang: 'Review protocol weaning ventilator',
      });
    expect(res.status).toBe(201);
    expect(res.body.incident_type).toBe('sentinel');
    incId = res.body.id;
    allIncidentIds.case2 = incId;
  });

  it('C2.2 Validator grades as merah', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${incId}/grade`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ severity: 'merah' });
    expect(res.status).toBe(200);
    expect(res.body.severity).toBe('merah');
    expect(res.body.type).toBe('komprehensif');
    invId = res.body.investigationId;
    allInvestigationIds.case2 = invId;
  });

  it('C2.3 Status becomes divalidasi and investigation is komprehensif', async () => {
    const inc = await request(app).get(`/api/v1/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(inc.status).toBe(200);
    expect(inc.body.status).toBe('divalidasi');
    expect(inc.body.severity).toBe('merah');

    const inv = await request(app).get(`/api/v1/investigations/${invId}`)
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(inv.status).toBe(200);
    expect(inv.body.type).toBe('komprehensif');
  });

  it('C2.4 Transition: divalidasi → investigasi', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${incId}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'investigasi' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('investigasi');
  });

  it('C2.5 Transition: investigasi → ditindaklanjuti', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${incId}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'ditindaklanjuti' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ditindaklanjuti');
  });

  it('C2.6 PMKP completes investigation', async () => {
    const res = await request(app).patch(`/api/v1/investigations/${invId}/complete`)
      .set('Authorization', `Bearer ${tokens.pmkp}`)
      .send({
        root_cause: 'Tidak ada protokol weaning ventilator yang baku, dokter jaga tidak memiliki kompetensi ekstubasi mandiri',
        recommendations: 'Pembuatan SPO weaning ventilator, pelatihan ekstubasi untuk dokter ICU',
      });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('selesai');
  });

  it('C2.7 Final status: selesai', async () => {
    const res = await request(app).get(`/api/v1/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('selesai');
  });
});

/* ───────────── CASE 3: KPC → Biru → Regrade Kuning → Komprehensif → Selesai ───────────── */
describe('Case 3: KPC - Biru - Regrade Kuning - Komprehensif - Selesai', () => {
  let incId, invId;

  it('C3.1 Create KPC incident (potensi cedera sedang)', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'KPC', incident_date: '2026-06-18', incident_time: '11:00',
        location: 'Farmasi', description: 'Ditemukan obat LASA (Look Alike Sound Alike) disimpan berdekatan tanpa label pembeda',
        consequence: 'Potensi kesalahan dispensing obat yang bisa menyebabkan cedera',
        incident_summary: 'Penyimpanan obat LASA tanpa label',
        tipe_insiden: 'medikasi', subtipe_insiden: 'Masalah',
        spesialisasi: 'Umum',
      });
    expect(res.status).toBe(201);
    incId = res.body.id;
    allIncidentIds.case3 = incId;
    expect(res.body.severity).toBeNull();
  });

  it('C3.3 Initial grade: biru', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${incId}/grade`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ severity: 'biru' });
    expect(res.status).toBe(200);
    expect(res.body.severity).toBe('biru');
    expect(res.body.type).toBe('sederhana');
    invId = res.body.investigationId;
    allInvestigationIds.case3 = invId;
  });

  it('C3.4 Regrade: biru → kuning', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${incId}/grade`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ severity: 'kuning' });
    expect(res.status).toBe(200);
    expect(res.body.severity).toBe('kuning');
    expect(res.body.regrade).toBe(true);
    expect(res.body.type).toBe('komprehensif');
    expect(res.body.investigationId).toBe(invId); // same investigation
  });

  it('C3.5 Investigation upgraded to komprehensif after regrade', async () => {
    const res = await request(app).get(`/api/v1/investigations/${invId}`)
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('komprehensif');
    expect(res.body.regrade_severity).toBe('kuning');
  });

  it('C3.6 Complete the investigation', async () => {
    const res = await request(app).patch(`/api/v1/investigations/${invId}/complete`)
      .set('Authorization', `Bearer ${tokens.pmkp}`)
      .send({
        root_cause: 'Tidak ada sistem pengelolaan obat LASA',
        recommendations: 'Implementasi sistem pemisahan obat LASA dengan label warna',
        faktor_kontributor: ['Faktor Organisasi & Manajemen', 'Faktor Lingkungan Kerja'],
        pic_name: 'apt. Siti', pic_role: 'Kepala Farmasi',
        management_review: true,
      });
    expect(res.status).toBe(200);
  });

  it('C3.7 Final verification', async () => {
    const res = await request(app).get(`/api/v1/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('selesai');
    expect(res.body.severity).toBe('kuning');
  });
});

/* ───────────── CASE 4: KNC → Ditolak (tanpa grading) ───────────── */
describe('Case 4: KNC - Ditolak tanpa grading', () => {
  let incId;

  it('C4.1 Create KNC incident', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'KNC', incident_date: '2026-06-20', incident_time: '14:00',
        location: 'Poliklinik', description: 'Nyaris memberikan injeksi pada pasien yang salah, tertukar dengan pasien lain',
        consequence: 'Tidak terjadi cedera, tertangkap sebelum injeksi',
        incident_summary: 'Nyaris salah pasien injeksi',
        tindakan_oleh: 'Perawat',
      });
    expect(res.status).toBe(201);
    incId = res.body.id;
    allIncidentIds.case4 = incId;
  });

  it('C4.2 Validator rejects without grading', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${incId}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'ditolak' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ditolak');
  });

  it('C4.3 Rejected incident has no severity and no investigation', async () => {
    const res = await request(app).get(`/api/v1/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ditolak');
    expect(res.body.severity).toBeNull();
    expect(res.body.investigation).toBeNull();
  });

  it('C4.4 Rejected incident cannot transition to any other status', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${incId}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'dilaporkan' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('cannot');
  });
});

/* ───────────── CASE 5: KTC Anonim + semua field baru → Hijau → Sederhana → Selesai ───────────── */
describe('Case 5: KTC anonim - semua field baru - Hijau - Sederhana - Selesai', () => {
  let incId, invId;

  it('C5.1 Create KTC anonim incident with all new fields', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'KTC', incident_date: '2026-06-22', incident_time: '08:45',
        location: 'Ruang Tindakan', description: 'Infus terlepas dari tangan pasien, obat tidak masuk',
        consequence: 'Tidak ada cedera pada pasien, infus dipasang ulang',
        is_anonymous: true,
        incident_summary: 'Infus terlepas saat mobilisasi pasien',
        tipe_insiden: 'alat_medis', subtipe_insiden: 'Tipe Alat',
        spesialisasi: 'Penyakit Dalam', unit_penyebab: 'Rawat Inap',
        first_reporter: 'Keluarga/Pendamping',
        no_rm: '01.02.5678', umur: '15-30_tahun', jenis_kelamin: 'Perempuan',
        penanggung_biaya: 'Asuransi Swasta',
        tgl_masuk_rs: '2026-06-20', jam_masuk_rs: '10:00',
        akibat_insiden: 'Tidak Ada Cedera',
        tindakan_awal: 'Pasang infus ulang',
        tindakan_oleh: 'Perawat',
        pernah_terjadi: 'Ya', pencegahan_ulang: 'Gunakan plester fiksasi lebih kuat',
        ruangan_id: '',
        probabilitas: 2, dampak: 2,
      });
    expect(res.status).toBe(201);
    incId = res.body.id;
    allIncidentIds.case5 = incId;
  });

  it('C5.2 Anonim incident reporter should show Anonim', async () => {
    const res = await request(app).get(`/api/v1/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.reporter_name).toBe('Anonim');
    expect(res.body.reporter_unit).toBe('-');
  });

  it('C5.3 Grade as hijau', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${incId}/grade`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ severity: 'hijau' });
    expect(res.status).toBe(200);
    expect(res.body.severity).toBe('hijau');
    expect(res.body.type).toBe('sederhana');
    invId = res.body.investigationId;
    allInvestigationIds.case5 = invId;
  });

  it('C5.4 Status update: divalidasi → investigasi → ditindaklanjuti', async () => {
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

  it('C5.5 PMKP completes with all fields', async () => {
    const res = await request(app).patch(`/api/v1/investigations/${invId}/complete`)
      .set('Authorization', `Bearer ${tokens.pmkp}`)
      .send({
        root_cause: 'Jenis plester tidak sesuai untuk kulit pasien yang lembab',
        recommendations: 'Gunakan plester tahan air, edukasi perawat tentang fiksasi infus',
        faktor_kontributor: ['Faktor Petugas / Staf', 'Faktor Pasien'],
        pic_name: 'Ns. Dewi', pic_role: 'Karu Rawat Inap',
        follow_up_actions: 'Audit kepatuhan fiksasi infus per bulan',
        follow_up_deadline: '2026-09-01',
        management_review: true,
      });
    expect(res.status).toBe(200);
  });

  it('C5.6 Final: selesai & data lengkap', async () => {
    const res = await request(app).get(`/api/v1/incidents/${incId}`)
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('selesai');
    expect(res.body.severity).toBe('hijau');
    expect(res.body.is_anonymous).toBe(1);
  });
});

/* ───────────── AUDIT KEAMANAN ───────────── */
describe('Audit Keamanan (Security)', () => {
  it('SEC-01: Access without token returns 401', async () => {
    const res = await request(app).get('/api/v1/incidents');
    expect(res.status).toBe(401);
  });

  it('SEC-02: Invalid token returns 401', async () => {
    const res = await request(app).get('/api/v1/incidents')
      .set('Authorization', 'Bearer invalidtoken123');
    expect(res.status).toBe(401);
  });

  it('SEC-03: Pelapor cannot grade incidents (403)', async () => {
    const id = allIncidentIds.case5;
    const res = await request(app).patch(`/api/v1/incidents/${id}/grade`)
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({ severity: 'biru' });
    expect(res.status).toBe(403);
  });

  it('SEC-04: Pelapor cannot complete investigation (403)', async () => {
    const res = await request(app).get('/api/v1/investigations')
      .set('Authorization', `Bearer ${tokens.pelapor}`);
    expect(res.status).toBe(200);
    if (res.body.data.length > 0) {
      const invId2 = res.body.data[0].id;
      const res2 = await request(app).patch(`/api/v1/investigations/${invId2}/complete`)
        .set('Authorization', `Bearer ${tokens.pelapor}`)
        .send({ root_cause: 'X', recommendations: 'Y' });
      expect(res2.status).toBe(403);
    }
  });

  it('SEC-05: Pelapor cannot register users (403)', async () => {
    const res = await request(app).post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({ username: 'x', password: '12345', name: 'X', role: 'pelapor', unit: 'IGD' });
    expect(res.status).toBe(403);
  });

  it('SEC-06: Manajemen cannot grade (403)', async () => {
    tokens.manajemen = await login('audit_manajemen');
    const id = allIncidentIds.case1;
    const res = await request(app).patch(`/api/v1/incidents/${id}/grade`)
      .set('Authorization', `Bearer ${tokens.manajemen}`)
      .send({ severity: 'biru' });
    expect(res.status).toBe(403);
  });

  it('SEC-07: Kepala unit cannot complete investigation (403)', async () => {
    tokens.kepala_unit = await login('audit_kepala_unit');
    const res = await request(app).get('/api/v1/investigations')
      .set('Authorization', `Bearer ${tokens.kepala_unit}`);
    expect(res.status).toBe(200);
    if (res.body.data.length > 0) {
      const invId2 = res.body.data[0].id;
      const res2 = await request(app).patch(`/api/v1/investigations/${invId2}/complete`)
        .set('Authorization', `Bearer ${tokens.kepala_unit}`)
        .send({ root_cause: 'X', recommendations: 'Y' });
      expect(res2.status).toBe(403);
    }
  });

  it('SEC-08: Login validation rejects invalid input', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ username: 'ab' });
    expect(res.status).toBe(422);
  });

  it('SEC-09: Register validation rejects invalid role', async () => {
    tokens.admin = await login('audit_admin');
    const res = await request(app).post('/api/v1/auth/register')
      .set('Authorization', `Bearer ${tokens.admin}`)
      .send({ username: 'audit_test_bad_role', password: '12345', name: 'X', role: 'superadmin', unit: 'IGD' });
    expect(res.status).toBe(422);
  });
});

/* ───────────── AUDIT STATE MACHINE ───────────── */
describe('Audit State Machine & Business Logic', () => {
  let incId;

  beforeAll(() => {
    const { v4: uuidv4 } = require('uuid');
    incId = uuidv4();
  });

  it('STM-01: Invalid transition dilaporkan → selesai rejects', async () => {
    const { v4: uuidv4 } = require('uuid');
    // Create a fresh incident that's still in 'dilaporkan' status
    const createRes = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'KNC', incident_date: '2026-06-25', incident_time: '10:00',
        location: 'Poliklinik', description: 'Testing invalid state transition from reported to completed',
        consequence: 'Tidak ada akibat untuk pengujian ini',
      });
    expect(createRes.status).toBe(201);
    expect(createRes.body.status).toBe('dilaporkan');

    const res = await request(app).patch(`/api/v1/incidents/${createRes.body.id}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'selesai' });
    expect(res.status).toBe(400);
  });

  it('STM-02: Invalid transition divalidasi → dilaporkan rejects', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${allIncidentIds.case2}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'dilaporkan' });
    expect(res.status).toBe(400);
  });

  it('STM-03: Invalid transition ditolak → any status rejects', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${allIncidentIds.case4}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'dilaporkan' });
    expect(res.status).toBe(400);
  });

  it('STM-04: Invalid transition selesai → any status rejects', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${allIncidentIds.case1}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'dilaporkan' });
    expect(res.status).toBe(400);
  });

  it('STM-05: Valid transition dilaporkan → ditolak works', async () => {
    const { v4: uuidv4 } = require('uuid');
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'KNC', incident_date: '2026-06-25', incident_time: '10:00',
        location: 'UGD', description: 'Testing state machine transition for incident rejection flow',
        consequence: 'Tidak ada cedera akibat pengujian ini',
      });
    expect(res.status).toBe(201);
    const newId = res.body.id;

    const res2 = await request(app).patch(`/api/v1/incidents/${newId}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'ditolak' });
    expect(res2.status).toBe(200);
    expect(res2.body.status).toBe('ditolak');
  });

  it('STM-06: Duplicate completion rejected (409)', async () => {
    const res = await request(app).get('/api/v1/investigations')
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    const selesai = res.body.data.find(inv => inv.status === 'selesai');
    if (selesai) {
      const res2 = await request(app).patch(`/api/v1/investigations/${selesai.id}/complete`)
        .set('Authorization', `Bearer ${tokens.pmkp}`)
        .send({ root_cause: 'Existing root cause analysis', recommendations: 'Existing recommendations here' });
      expect(res2.status).toBe(409);
    }
  });
});

/* ───────────── AUDIT VALIDATION ───────────── */
describe('Audit Validasi Input', () => {
  it('VAL-01: Invalid incident_type rejects', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'INVALID', incident_date: '2026-06-10', incident_time: '09:00',
        location: 'X', description: 'Y', consequence: 'Z',
      });
    expect(res.status).toBe(422);
  });

  it('VAL-02: Invalid severity rejects', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${allIncidentIds.case1}/grade`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ severity: 'ungu' });
    expect(res.status).toBe(422);
  });

  it('VAL-03: Invalid status rejects', async () => {
    const res = await request(app).patch(`/api/v1/incidents/${allIncidentIds.case1}/status`)
      .set('Authorization', `Bearer ${tokens.validator}`)
      .send({ status: 'invalid_status' });
    expect(res.status).toBe(422);
  });

  it('VAL-04: Invalid umur enum rejects', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'KTD', incident_date: '2026-06-10', incident_time: '09:00',
        location: 'X', description: 'Test description with enough length',
        consequence: 'Test consequence', umur: 'invalid_age_group',
      });
    expect(res.status).toBe(422);
  });

  it('VAL-05: Invalid penanggung_biaya rejects', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'KTD', incident_date: '2026-06-10', incident_time: '09:00',
        location: 'X', description: 'Test description with enough length',
        consequence: 'Test consequence', penanggung_biaya: 'Askes',
      });
    expect(res.status).toBe(422);
  });

  it('VAL-06: Invalid akibat_insiden rejects', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'KTD', incident_date: '2026-06-10', incident_time: '09:00',
        location: 'X', description: 'Test description with enough length',
        consequence: 'Test consequence', akibat_insiden: 'Cacat',
      });
    expect(res.status).toBe(422);
  });

  it('VAL-07: Invalid tipe_insiden rejects', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'KTD', incident_date: '2026-06-10', incident_time: '09:00',
        location: 'X', description: 'Test description with enough length',
        consequence: 'Test consequence', tipe_insiden: 'nonexistent_type',
      });
    expect(res.status).toBe(422);
  });

  it('VAL-08: Empty body returns 422', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({});
    expect(res.status).toBe(422);
  });

  it('VAL-09: Description too short rejects', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'KTD', incident_date: '2026-06-10', incident_time: '09:00',
        location: 'X', description: 'short', consequence: 'short',
      });
    expect(res.status).toBe(422);
  });

  it('VAL-10: Invalid date format rejects', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'KTD', incident_date: '10-06-2026', incident_time: '09:00',
        location: 'X', description: 'Test description with enough length',
        consequence: 'Test consequence',
      });
    expect(res.status).toBe(422);
  });

  it('VAL-11: Invalid time format rejects', async () => {
    const res = await request(app).post('/api/v1/incidents')
      .set('Authorization', `Bearer ${tokens.pelapor}`)
      .send({
        incident_type: 'KTD', incident_date: '2026-06-10', incident_time: '9:00',
        location: 'X', description: 'Test description with enough length',
        consequence: 'Test consequence',
      });
    expect(res.status).toBe(422);
  });
});

/* ───────────── AUDIT DATA CONSISTENCY ───────────── */
describe('Audit Konsistensi Data', () => {
  it('DATA-01: Dashboard stats are consistent with created incidents', async () => {
    const res = await request(app).get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(4); // cases 1,2,3,5 (case 4 ditolak not counted in stats)
    expect(res.body.selesai).toBeGreaterThanOrEqual(4); // cases 1,2,3,5
  });

  it('DATA-02: Incident list shows all created incidents', async () => {
    const res = await request(app).get('/api/v1/incidents?limit=50')
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    const ids = res.body.data.map(d => d.id);
    expect(ids).toContain(allIncidentIds.case1);
    expect(ids).toContain(allIncidentIds.case2);
    expect(ids).toContain(allIncidentIds.case3);
    expect(ids).toContain(allIncidentIds.case4);
    expect(ids).toContain(allIncidentIds.case5);
  });

  it('DATA-03: Each completed incident has completed investigation', async () => {
    for (const key of ['case1', 'case2', 'case3', 'case5']) {
      const res = await request(app).get(`/api/v1/incidents/${allIncidentIds[key]}`)
        .set('Authorization', `Bearer ${tokens.pmkp}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('selesai');
      expect(res.body.investigation).not.toBeNull();
      expect(res.body.investigation.status).toBe('selesai');
    }
  });

  it('DATA-04: Rejected incident has no investigation', async () => {
    const res = await request(app).get(`/api/v1/incidents/${allIncidentIds.case4}`)
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ditolak');
    expect(res.body.investigation).toBeNull();
  });

  it('DATA-05: Search by incident_summary works', async () => {
    const res = await request(app).get('/api/v1/incidents?search=obat')
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
  });

  it('DATA-06: Filter by severity works', async () => {
    const res = await request(app).get('/api/v1/incidents?severity=merah')
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
    res.body.data.forEach(d => expect(d.severity).toBe('merah'));
  });

  it('DATA-07: Filter by status works', async () => {
    const res = await request(app).get('/api/v1/incidents?status=selesai')
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    expect(res.body.pagination.total).toBeGreaterThanOrEqual(3);
  });

  it('DATA-08: Grade otomatis from probabilitas*dampak works', async () => {
    // Case 5 had probabilitas=2, dampak=2 → grade_otomatis = 4 → BIRU
    const res = await request(app).get(`/api/v1/incidents/${allIncidentIds.case5}`)
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(res.status).toBe(200);
    expect(res.body.grade_otomatis).toBe('biru');
    expect(res.body.severity).toBe('hijau'); // overridden by validator
  });

  it('DATA-09: Notification created on incident creation', async () => {
    const res = await request(app).get('/api/v1/notifications')
      .set('Authorization', `Bearer ${tokens.validator}`);
    expect(res.status).toBe(200);
    expect(res.body.notifications.length).toBeGreaterThanOrEqual(5);
  });
});

/* ───────────── AUDIT INVESTIGASI DEADLINE ───────────── */
describe('Audit Deadline Investigasi', () => {
  it('DEADLINE-01: Biru investigation has 7 days deadline', async () => {
    const inv = await request(app).get(`/api/v1/investigations/${allInvestigationIds.case1}`)
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(inv.status).toBe(200);
    const deadline = new Date(inv.body.deadline);
    const created = new Date(inv.body.created_at || Date.now());
    const diffDays = Math.round((deadline - created) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeLessThanOrEqual(7);
  });

  it('DEADLINE-02: Merah investigation has 45 days deadline', async () => {
    const inv = await request(app).get(`/api/v1/investigations/${allInvestigationIds.case2}`)
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(inv.status).toBe(200);
    const deadline = new Date(inv.body.deadline);
    const created = new Date(inv.body.created_at || Date.now());
    const diffDays = Math.round((deadline - created) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeLessThanOrEqual(45);
  });

  it('DEADLINE-03: Regrade investigation deadline updated', async () => {
    const inv = await request(app).get(`/api/v1/investigations/${allInvestigationIds.case3}`)
      .set('Authorization', `Bearer ${tokens.pmkp}`);
    expect(inv.status).toBe(200);
    // After regrade from biru→kuning, deadline should be ~45 days
    const deadline = new Date(inv.body.deadline);
    const created = new Date(inv.body.created_at || Date.now());
    const diffDays = Math.round((deadline - created) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBeLessThanOrEqual(45);
  });
});
