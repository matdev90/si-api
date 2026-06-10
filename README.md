<p align="center">
  <img src="frontend/public/logo.png" alt="SI-API" width="120" />
</p>

<h1 align="center">SI-API</h1>
<p align="center">
  <strong>Sistem Informasi Analisa Pelaporan Insiden</strong><br />
  RSUD dr. R. Soedjono Selong
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-4.x-000000?logo=express" alt="Express">
  <img src="https://img.shields.io/badge/SQLite(sql.js)-lightblue?logo=sqlite" alt="SQLite">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

---

## Tentang

SI-API adalah sistem internal untuk pelaporan, analisa, dan investigasi insiden keselamatan pasien di RSUD dr. R. Soedjono Selong. Dibangun dengan prinsip **just culture** dan **no-blame**, sistem ini mendukung alur kerja dari pelaporan awal hingga investigasi lengkap dengan grading severity, notifikasi real-time, dan export data.

## Fitur

| Fitur | Deskripsi |
|-------|-----------|
| **Pelaporan Insiden** | Laporan anonim/tidak, 5 tipe insiden (KTD/KNC/KPC/KTC/Sentinel) |
| **Grading Severity** | Biru / Hijau / Kuning / Merah — investigasi auto-created |
| **Investigasi** | Root cause analysis, rekomendasi, action plan |
| **Dashboard** | Statistik & trend bulanan/tahunan |
| **Role-Based Access** | 6 role: pelapor, validator, pmkp, kepala_unit, manajemen, admin |
| **Notifikasi** | Real-time saat insiden baru, deadline investigasi |
| **Export** | Excel (.xlsx) & PDF — dengan filter tanggal/unit/severity |
| **Audit Trail** | Semua aksi tercatat (siapa, apa, kapan) |
| **Dokumentasi API** | Swagger UI interaktif di `/api/v1/docs` |
| **Just Culture** | Pelaporan anonim, tanpa menyalahkan |

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | Node.js 24, Express, SQLite (sql.js) |
| Frontend | React 19, Vite 8, React Router |
| Auth | JWT, bcryptjs |
| Validation | Zod 4 |
| Logging | Pino |
| Export | PDFKit, xlsx |
| Deployment | Docker, systemd, pm2 |

## Panduan Cepat

### 1. Clone & Install

```bash
git clone https://github.com/matdev90/si-api.git
cd si-api
npm install --omit=dev
```

### 2. Build Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

### 3. Setup Environment

```bash
cp .env.example .env
# Edit .env sesuai lingkungan Anda
```

### 4. Migrate & Seed

```bash
node src/config/migrate.js
node src/config/seed.js
```

### 5. Jalankan

```bash
NODE_ENV=production node src/index.js
```

Akses: **http://localhost:3000**

---

## Pengguna Default

| Username | Password | Role | Unit |
|----------|----------|------|------|
| `admin` | `12345` | Admin | IT |
| `perawat1` | `12345` | Pelapor | IGD |
| `dokter1` | `12345` | Pelapor | IGD |
| `validator1` | `12345` | Validator | PMKP |
| `pmkp1` | `12345` | PMKP | PMKP |
| `kepala_igd` | `12345` | Kepala Unit | IGD |
| `manajemen1` | `12345` | Manajemen | Direksi |

---

## Deployment

### Docker

```bash
docker compose up -d --build
```

### Systemd (manual)

```bash
sudo tee /etc/systemd/system/si-api.service > /dev/null << 'EOF'
[Unit]
Description=SI-API
After=network.target

[Service]
Type=simple
User=sisadmin
WorkingDirectory=/opt/si-api
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now si-api
```

### PM2 (auto-restart tanpa root)

```bash
npm install -g pm2
pm2 start src/index.js --name si-api --env NODE_ENV=production
pm2 save
pm2 startup   # ikuti instruksi sudo
```

### Deploy Script

```bash
# Salin project ke server, lalu:
chmod +x deploy.sh
sudo bash deploy.sh
```

---

## Struktur Project

```
si-api/
├── src/
│   ├── config/         # Database, migration, seed, swagger
│   ├── controllers/    # Route handlers
│   ├── middleware/      # Auth, validation, security, audit, error
│   ├── models/         # User, Incident, Investigation, Notification
│   ├── routes/         # Express routers
│   ├── services/       # Grading, notification
│   ├── utils/          # Logger
│   ├── __tests__/      # Unit & integration tests (76)
│   └── index.js        # Entry point
├── frontend/
│   ├── public/         # Logo, favicon
│   ├── src/            # React SPA
│   └── dist/           # Production build
├── scripts/            # Tools (push.js)
├── .github/workflows/  # CI/CD pipeline
├── Dockerfile
├── docker-compose.yml
├── deploy.sh           # Instalasi cepat
├── install.md          # Panduan instalasi detail
└── panduan.md          # Panduan pengguna per role
```

## API Documentation

Dokumentasi API lengkap tersedia secara interaktif via Swagger UI:

```
http://[server-ip]:3000/api/v1/docs
```

**Endpoint Utama:**

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Profil user |
| POST | `/api/v1/incidents` | Buat laporan |
| GET | `/api/v1/incidents` | Daftar insiden (pagination + filter) |
| PATCH | `/api/v1/incidents/:id/grade` | Grading severity |
| PATCH | `/api/v1/incidents/:id/status` | Update status |
| PATCH | `/api/v1/investigations/:id/complete` | Lengkapi investigasi |
| GET | `/api/v1/dashboard/stats` | Statistik dashboard |
| GET | `/api/v1/dashboard/trends` | Trend bulanan/tahunan |
| GET | `/api/v1/notifications` | Notifikasi user |
| GET | `/api/v1/export/excel` | Export Excel |
| GET | `/api/v1/export/pdf` | Export PDF |

## Testing

```bash
npm test              # Jalankan semua test
npm run test:watch    # Watch mode
npm run test:coverage # Dengan coverage
```

76 test mencakup: middleware, model (CRUD), dan API integration (auth, RBAC, CRUD, pagination, validasi).

---

## Lisensi

MIT &copy; 2026 RSUD dr. R. Soedjono Selong

---

<p align="center">
  <i>Dibangun untuk keselamatan pasien yang lebih baik</i>
</p>
