const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SI-API - Sistem Informasi Analisa Pelaporan Insiden',
      version: '1.0.0',
      description: `Backend API untuk pelaporan dan analisa insiden keselamatan pasien di **RSUD dr. R. Soedjono Selong**.

### Role & Akses
| Role | Akses Utama |
|------|-------------|
| **pelapor** | Membuat laporan insiden, melihat laporan sendiri, notifikasi |
| **validator** | Validasi & grading insiden, investigasi |
| **pmkp** | Investigasi komprehensif, dashboard, export, grading |
| **kepala_unit** | Melihat insiden di unitnya, export |
| **manajemen** | Dashboard + export seluruh RS |
| **admin** | Registrasi user, grading, export |

### Alur Insiden
1. Pelapor membuat laporan → status: \`dilaporkan\`
2. Validator melakukan grading (severity) → investigasi auto-created
3. PMKP melengkapi investigasi → status: \`selesai\``,
    },
    servers: [
      { url: '/api/v1', description: 'API v1' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            details: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, message: { type: 'string' } } } },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            limit: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['username', 'password'],
          properties: {
            username: { type: 'string', minLength: 3, maxLength: 50, example: 'perawat1' },
            password: { type: 'string', minLength: 4, maxLength: 100, example: '12345' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, username: { type: 'string' }, name: { type: 'string' }, role: { type: 'string', enum: ['pelapor', 'validator', 'pmkp', 'kepala_unit', 'manajemen', 'admin'] }, unit: { type: 'string' } } },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['username', 'password', 'name', 'role', 'unit'],
          properties: {
            username: { type: 'string', minLength: 3, maxLength: 50 },
            password: { type: 'string', minLength: 4, maxLength: 100 },
            name: { type: 'string', minLength: 2, maxLength: 100 },
            role: { type: 'string', enum: ['pelapor', 'validator', 'pmkp', 'kepala_unit', 'manajemen'] },
            unit: { type: 'string', minLength: 2, maxLength: 100 },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            username: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string' },
            unit: { type: 'string' },
            is_active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        IncidentCreateRequest: {
          type: 'object',
          required: ['incident_type', 'incident_date', 'incident_time', 'location', 'description', 'consequence'],
          properties: {
            incident_type: { type: 'string', enum: ['KTD', 'KNC', 'KPC', 'KTC', 'sentinel'], description: 'KTD=Kejadian Tidak Diharapkan, KNC=Kejadian Nyaris Cedera, KPC=Kejadian Potensial Cedera, KTC=Kejadian Tidak Cedera' },
            incident_date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', example: '2026-06-10' },
            incident_time: { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '09:00' },
            location: { type: 'string', minLength: 2, maxLength: 200, example: 'Rawat Inap' },
            description: { type: 'string', minLength: 10, maxLength: 5000, example: 'Pasien terima obat salah dosis' },
            consequence: { type: 'string', minLength: 5, maxLength: 2000, example: 'Hipotensi' },
            immediate_action: { type: 'string', maxLength: 2000, example: 'Observasi dan koreksi dosis' },
            is_anonymous: { type: 'boolean', default: false },
          },
        },
        Incident: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            reporter_id: { type: 'string', format: 'uuid', nullable: true },
            is_anonymous: { type: 'boolean' },
            incident_type: { type: 'string', enum: ['KTD', 'KNC', 'KPC', 'KTC', 'sentinel'] },
            incident_date: { type: 'string' },
            incident_time: { type: 'string' },
            location: { type: 'string' },
            description: { type: 'string' },
            consequence: { type: 'string' },
            immediate_action: { type: 'string', nullable: true },
            severity: { type: 'string', enum: ['biru', 'hijau', 'kuning', 'merah'], nullable: true },
            status: { type: 'string', enum: ['dilaporkan', 'divalidasi', 'investigasi', 'ditindaklanjuti', 'selesai', 'ditolak'] },
            reporter_name: { type: 'string' },
            reporter_unit: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        IncidentGradeRequest: {
          type: 'object',
          required: ['severity'],
          properties: { severity: { type: 'string', enum: ['biru', 'hijau', 'kuning', 'merah'] } },
        },
        IncidentStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: { status: { type: 'string', enum: ['dilaporkan', 'divalidasi', 'investigasi', 'ditindaklanjuti', 'selesai', 'ditolak'] } },
        },
        Investigation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            incident_id: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['komprehensif', 'sederhana'] },
            root_cause: { type: 'string', nullable: true },
            recommendations: { type: 'string', nullable: true },
            action_plan: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['berlangsung', 'selesai'] },
            completed_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        InvestigationCompleteRequest: {
          type: 'object',
          required: ['root_cause', 'recommendations'],
          properties: {
            root_cause: { type: 'string', minLength: 10, maxLength: 5000 },
            recommendations: { type: 'string', minLength: 10, maxLength: 5000 },
            action_plan: { type: 'string', maxLength: 5000 },
          },
        },
        DashboardStats: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            dilaporkan: { type: 'integer' },
            divalidasi: { type: 'integer' },
            investigasi: { type: 'integer' },
            selesai: { type: 'integer' },
            ditolak: { type: 'integer' },
            biru: { type: 'integer' },
            hijau: { type: 'integer' },
            kuning: { type: 'integer' },
            merah: { type: 'integer' },
            belum_grade: { type: 'integer' },
            KTD: { type: 'integer' }, KNC: { type: 'integer' }, KPC: { type: 'integer' }, KTC: { type: 'integer' }, sentinel: { type: 'integer' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            message: { type: 'string' },
            type: { type: 'string' },
            is_read: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Autentikasi & Manajemen User' },
      { name: 'Incidents', description: 'CRUD Laporan Insiden' },
      { name: 'Investigations', description: 'Investigasi Insiden' },
      { name: 'Dashboard', description: 'Statistik & Tren' },
      { name: 'Export', description: 'Export Laporan (Excel/PDF)' },
      { name: 'Notifications', description: 'Notifikasi User' },
      { name: 'System', description: 'Health Check' },
    ],
    paths: {
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check',
          responses: {
            200: { description: 'Server OK', content: { 'application/json': { example: { status: 'ok', timestamp: '2026-06-10T00:00:00.000Z' } } } },
          },
        },
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login user',
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
          responses: {
            200: { description: 'Login berhasil', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
            401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
      },
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register user baru (admin only)',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } } },
          responses: {
            201: { description: 'User berhasil dibuat', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            409: { description: 'Username already exists' },
          },
        },
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Profil user saat ini',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Data user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          },
        },
      },
      '/incidents': {
        post: {
          tags: ['Incidents'],
          summary: 'Buat laporan insiden baru',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/IncidentCreateRequest' } } } },
          responses: {
            201: { description: 'Insiden berhasil dibuat', content: { 'application/json': { schema: { $ref: '#/components/schemas/Incident' } } } },
            422: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          },
        },
        get: {
          tags: ['Incidents'],
          summary: 'Daftar insiden (dengan pagination & filter)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 20, maximum: 100 } },
            { in: 'query', name: 'status', schema: { type: 'string', enum: ['dilaporkan', 'divalidasi', 'investigasi', 'ditindaklanjuti', 'selesai', 'ditolak'] } },
            { in: 'query', name: 'severity', schema: { type: 'string', enum: ['biru', 'hijau', 'kuning', 'merah'] } },
            { in: 'query', name: 'incident_type', schema: { type: 'string', enum: ['KTD', 'KNC', 'KPC', 'KTC', 'sentinel'] } },
            { in: 'query', name: 'unit', schema: { type: 'string' } },
            { in: 'query', name: 'start_date', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'end_date', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Daftar insiden', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Incident' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } } },
          },
        },
      },
      '/incidents/{id}': {
        get: {
          tags: ['Incidents'],
          summary: 'Detail insiden beserta investigasi',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: {
            200: { description: 'Detail insiden', content: { 'application/json': { schema: { type: 'object', properties: { investigation: { $ref: '#/components/schemas/Investigation' } } } } } },
            404: { description: 'Not found' },
          },
        },
      },
      '/incidents/{id}/grade': {
        patch: {
          tags: ['Incidents'],
          summary: 'Grading insiden (validator/pmkp/admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/IncidentGradeRequest' } } } },
          responses: {
            200: { description: 'Grading berhasil' },
            409: { description: 'Already graded' },
          },
        },
      },
      '/incidents/{id}/status': {
        patch: {
          tags: ['Incidents'],
          summary: 'Update status insiden (pmkp/validator/admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/IncidentStatusRequest' } } } },
          responses: { 200: { description: 'Status updated' } },
        },
      },
      '/investigations': {
        get: {
          tags: ['Investigations'],
          summary: 'Daftar investigasi',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
            { in: 'query', name: 'status', schema: { type: 'string', enum: ['berlangsung', 'selesai'] } },
            { in: 'query', name: 'type', schema: { type: 'string', enum: ['komprehensif', 'sederhana'] } },
          ],
          responses: {
            200: { description: 'Daftar investigasi', content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Investigation' } }, pagination: { $ref: '#/components/schemas/Pagination' } } } } } },
          },
        },
      },
      '/investigations/{id}': {
        get: {
          tags: ['Investigations'],
          summary: 'Detail investigasi',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Detail investigasi', content: { 'application/json': { schema: { $ref: '#/components/schemas/Investigation' } } } } },
        },
      },
      '/investigations/{id}/complete': {
        patch: {
          tags: ['Investigations'],
          summary: 'Selesaikan investigasi (pmkp/admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/InvestigationCompleteRequest' } } } },
          responses: { 200: { description: 'Investigasi selesai' }, 409: { description: 'Already completed' } },
        },
      },
      '/dashboard/stats': {
        get: {
          tags: ['Dashboard'],
          summary: 'Statistik insiden',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'start_date', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'end_date', schema: { type: 'string', format: 'date' } },
          ],
          responses: { 200: { description: 'Statistik', content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardStats' } } } } },
        },
      },
      '/dashboard/trends': {
        get: {
          tags: ['Dashboard'],
          summary: 'Tren insiden (monthly/yearly)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'period', schema: { type: 'string', enum: ['monthly', 'yearly'], default: 'monthly' } },
            { in: 'query', name: 'unit', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Data tren' } },
        },
      },
      '/export/excel': {
        get: {
          tags: ['Export'],
          summary: 'Export insiden ke Excel (pmkp/manajemen/admin/kepala_unit)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { in: 'query', name: 'status', schema: { type: 'string' } },
            { in: 'query', name: 'start_date', schema: { type: 'string', format: 'date' } },
            { in: 'query', name: 'end_date', schema: { type: 'string', format: 'date' } },
          ],
          responses: { 200: { description: 'File Excel (.xlsx)', content: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {} } } },
        },
      },
      '/export/pdf': {
        get: {
          tags: ['Export'],
          summary: 'Export insiden ke PDF (pmkp/manajemen/admin/kepala_unit)',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'query', name: 'status', schema: { type: 'string' } }],
          responses: { 200: { description: 'File PDF', content: { 'application/pdf': {} } } },
        },
      },
      '/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Daftar notifikasi user',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Notifikasi', content: { 'application/json': { schema: { type: 'object', properties: { notifications: { type: 'array', items: { $ref: '#/components/schemas/Notification' } }, unreadCount: { type: 'integer' } } } } } },
          },
        },
      },
      '/notifications/{id}/read': {
        patch: {
          tags: ['Notifications'],
          summary: 'Tandai satu notifikasi sudah dibaca',
          security: [{ bearerAuth: [] }],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string', format: 'uuid' } }],
          responses: { 200: { description: 'Berhasil' } },
        },
      },
      '/notifications/read-all': {
        patch: {
          tags: ['Notifications'],
          summary: 'Tandai semua notifikasi sudah dibaca',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Berhasil' } },
        },
      },
    },
  },
  apis: [],
};

module.exports = swaggerJsdoc(options);
