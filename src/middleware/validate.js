const z = require('zod');

function isZodError(err) {
  return err?.name === 'ZodError' && Array.isArray(err.issues);
}

function validate(schema) {
  return (req, res, next) => {
    try {
      req.validated = schema.parse(req.body);
      next();
    } catch (err) {
      if (isZodError(err)) {
        const errors = err.issues.map(e => ({
          field: e.path?.join('.') || 'unknown',
          message: e.message,
        }));
        return res.status(422).json({ error: 'Validation failed', details: errors });
      }
      next(err);
    }
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.validatedQuery = schema.parse(req.query);
      next();
    } catch (err) {
      if (isZodError(err)) {
        const errors = err.issues.map(e => ({
          field: e.path?.join('.') || 'unknown',
          message: e.message,
        }));
        return res.status(422).json({ error: 'Invalid query parameters', details: errors });
      }
      next(err);
    }
  };
}

const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(4).max(100),
});

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(4).max(100),
  name: z.string().min(2).max(100),
  role: z.enum(['pelapor', 'validator', 'pmkp', 'kepala_unit', 'manajemen']),
  unit: z.string().min(2).max(100),
});

const tipeInsidenOptions = [
  'administrasi_klinik', 'proses_prosedur_klinis', 'dokumentasi',
  'infeksi_nosokomial', 'medikasi', 'transfusi_darah',
  'nutrisi', 'oksigen_gas', 'alat_medis',
  'perilaku_pasien', 'jatuh', 'kecelakaan',
  'infrastruktur', 'resource_organisasi', 'laboratorium',
];

const subtipeInsidenMap = {
  administrasi_klinik: ['proses', 'masalah'],
  proses_prosedur_klinis: ['proses', 'masalah'],
  dokumentasi: ['dokumen_terkait', 'masalah'],
  infeksi_nosokomial: ['tipe_organisme', 'tipe_bagian_infeksi'],
  medikasi: ['medikasi_terkait', 'proses_penggunaan', 'masalah'],
  transfusi_darah: ['transfusi_terkait', 'proses_transfusi', 'masalah'],
  nutrisi: ['nutrisi_terkait', 'proses_nutrisi', 'masalah'],
  oksigen_gas: ['oksigen_terkait', 'proses_penggunaan', 'masalah'],
  alat_medis: ['tipe_alat', 'masalah'],
  perilaku_pasien: ['perilaku_pasien', 'aggression'],
  jatuh: ['tipe_jatuh', 'keterlibatan_saat_jatuh'],
  kecelakaan: ['benturan_tumpul', 'serangan_tajam', 'kejadian_mekanik', 'mekanisme_panas', 'ancaman_pernafasan', 'paparan_kimia', 'mekanisme_spesifik', 'bencana_alam'],
  infrastruktur: ['keterlibatan_struktur', 'masalah'],
  resource_organisasi: ['beban_kerja', 'ketersediaan_tempat_tidur', 'sdm', 'ketersediaan_staf', 'organisasi_tim', 'protocol_kebijakan', 'ketersediaan_adekuasi'],
  laboratorium: ['pengambilan', 'transport', 'sorting', 'data_entry', 'prosesing', 'verifikasi', 'hasil'],
};

const incidentCreateSchema = z.object({
  incident_type: z.enum(['KTD', 'KNC', 'KPC', 'KTC', 'sentinel']),
  incident_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  incident_time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  location: z.string().min(2).max(200),
  description: z.string().min(10).max(5000),
  consequence: z.string().min(5).max(2000),
  immediate_action: z.string().max(2000).optional(),
  is_anonymous: z.boolean().optional(),
  attachments: z.array(z.string()).max(5).optional(),
  no_rm: z.string().max(20).optional(),
  umur: z.enum(['0-1_bulan', '1_bulan-1_tahun', '1-5_tahun', '5-15_tahun', '15-30_tahun', '30-65_tahun', '65_plus_tahun']).optional(),
  jenis_kelamin: z.enum(['Laki-laki', 'Perempuan']).optional(),
  penanggung_biaya: z.enum(['Pribadi', 'BPJS', 'JAMKESMAS', 'Asuransi Swasta', 'Perusahaan', 'Lainnya']).optional(),
  tgl_masuk_rs: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  jam_masuk_rs: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  ruangan_id: z.string().max(36).optional(),
  probabilitas: z.number().int().min(1).max(5).optional(),
  dampak: z.number().int().min(1).max(5).optional(),
  grade_otomatis: z.string().optional(),
  akibat_insiden: z.enum(['Kematian', 'Cedera Berat/Irreversibel', 'Cedera Sedang/Reversibel', 'Cedera Ringan', 'Tidak Ada Cedera']).optional(),
  tindakan_awal: z.string().max(2000).optional(),
  tindakan_oleh: z.enum(['Tim', 'Dokter', 'Perawat', 'Petugas Lainnya']).optional(),
  pernah_terjadi: z.enum(['Ya', 'Tidak']).optional(),
  pencegahan_ulang: z.string().max(2000).optional(),
  incident_summary: z.string().max(200).optional(),
  tipe_insiden: z.enum(tipeInsidenOptions).optional(),
  subtipe_insiden: z.string().max(100).optional(),
  spesialisasi: z.enum([
    'Penyakit Dalam', 'Anak', 'Bedah', 'Obstetri Ginekologi',
    'THT', 'Mata', 'Saraf', 'Anastesi', 'Kulit & Kelamin',
    'Jantung', 'Paru', 'Jiwa', 'Umum', 'Lainnya',
  ]).optional(),
  unit_penyebab: z.string().max(100).optional(),
  first_reporter: z.enum(['Karyawan', 'Pasien', 'Keluarga/Pendamping', 'Pengunjung', 'Lainnya']).optional(),
});

const incidentGradeSchema = z.object({
  severity: z.enum(['biru', 'hijau', 'kuning', 'merah']),
});

const incidentStatusSchema = z.object({
  status: z.enum(['dilaporkan', 'divalidasi', 'investigasi', 'ditindaklanjuti', 'selesai', 'ditolak']),
});

const investigationCompleteSchema = z.object({
  root_cause: z.string().min(10).max(5000),
  recommendations: z.string().min(10).max(5000),
  action_plan: z.string().max(5000).optional(),
  faktor_kontributor: z.array(z.string()).max(20).optional(),
  pic_name: z.string().max(100).optional(),
  pic_role: z.string().max(100).optional(),
  follow_up_actions: z.string().max(5000).optional(),
  follow_up_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  management_review: z.boolean().optional(),
});

const ruanganSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(4).max(100),
  name: z.string().min(2).max(100),
  role: z.enum(['pelapor', 'validator', 'pmkp', 'kepala_unit', 'manajemen', 'admin']),
  unit: z.string().min(1).max(100),
  ruangan_id: z.string().max(36).optional(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(4, 'New password must be at least 4 characters').max(100),
});

const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(4).max(100).optional(),
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['pelapor', 'validator', 'pmkp', 'kepala_unit', 'manajemen', 'admin']).optional(),
  unit: z.string().min(1).max(100).optional(),
  ruangan_id: z.string().max(36).optional(),
  is_active: z.number().int().min(0).max(1).optional(),
});

module.exports = {
  validate,
  validateQuery,
  loginSchema,
  registerSchema,
  incidentCreateSchema,
  incidentGradeSchema,
  incidentStatusSchema,
  investigationCompleteSchema,
  ruanganSchema,
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
};
