# Panduan Instalasi Produksi SI-API

> Sistem Informasi Analisa Pelaporan Insiden — RSUD dr. R. Soedjono Selong

---

## 1. Persyaratan Server

| Komponen | Minimal | Rekomendasi |
|----------|---------|-------------|
| OS | Linux (AlmaLinux 9 / Ubuntu 22.04) | AlmaLinux 9 |
| CPU | 2 core | 4 core |
| RAM | 2 GB | 4 GB |
| Disk | 20 GB | 50 GB |
| Node.js | 20.x | 24.x LTS |
| Docker | 24.x | 27.x |

## 2. Persiapan Server

### 2.1 Install Node.js (via nvm)

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
source ~/.bashrc

# Install Node.js LTS
nvm install 24
nvm alias default 24
node --version  # verifikasi: v24.x
```

### 2.2 Install Docker (opsional — untuk container)

```bash
# CentOS / AlmaLinux / RHEL
sudo dnf config-manager --add-repo https://download.docker.com/linux/rhel/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io
sudo systemctl enable --now docker
sudo usermod -aG docker $USER  # logout-login setelah ini

# Ubuntu
sudo apt update
sudo apt install -y docker.io docker-compose-v2
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
```

### 2.3 Firewall

```bash
# AlmaLinux / CentOS
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# Ubuntu
sudo ufw allow 3000/tcp
```

### 2.4 Siapkan Direktori

```bash
sudo mkdir -p /opt/si-api
sudo chown $(whoami):$(whoami) /opt/si-api
```

---

## 3. Metode Instalasi

### Opsi A — Instalasi Langsung (Non-Docker)

**Langkah 1: Copy file ke server**

```bash
# Via SCP dari mesin development
scp -r /home/siapp/si-api user@192.168.90.7:/opt/si-api

# Atau via Git
cd /opt/si-api
git clone <repository-url> .
```

**Langkah 2: Install dependensi**

```bash
cd /opt/si-api
npm ci --omit=dev
```

**Langkah 3: Konfigurasi environment**

```bash
cp .env.example .env
nano .env
```

Isi `.env` untuk produksi:

```env
PORT=3000
HOST=0.0.0.0
NODE_ENV=production
JWT_SECRET=<generate-string-acak-kuat>
JWT_EXPIRES_IN=8h
DB_PATH=./data/si-api.db
CORS_ORIGIN=http://192.168.90.7:3000
LOG_LEVEL=info
RATE_LIMIT_MAX=200
```

Hasilkan JWT_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: 1a2b3c4d... (copy paste ke .env)
```

**Langkah 4: Build frontend**

```bash
cd /opt/si-api/frontend
npm ci
npm run build
cd ..
```

**Langkah 5: Siapkan direktori upload & data**

```bash
mkdir -p /opt/si-api/uploads /opt/si-api/data /opt/si-api/logs
```

**Langkah 6: Inisialisasi database**

```bash
node src/config/migrate.js   # Membuat tabel + seed user default + migrasi
node src/config/seed.js      # Seed tambahan (jika user belum ada)
```

Migrasi berjalan otomatis saat server start, tetapi bisa dijalankan manual.

**Langkah 7: Jalankan**

```bash
node src/index.js
```

Server akan:
- Menjalankan migrasi otomatis
- Memulai scheduler notifikasi deadline (setiap jam 07:00)
- Menyajikan frontend dan API

Verifikasi:

```bash
curl http://localhost:3000/api/v1/health
# Output: {"status":"ok","timestamp":"...","version":"1.0.0"}
curl http://192.168.90.7:3000/api/v1/health
# Output: {"status":"ok","timestamp":"...","version":"1.0.0"}
```

**Langkah 8: Setup systemd service (auto-start)**

```bash
sudo tee /etc/systemd/system/si-api.service << 'EOF'
[Unit]
Description=SI-API - Sistem Informasi Analisa Pelaporan Insiden
After=network.target

[Service]
Type=simple
User=sisiapp
Group=sisiapp
WorkingDirectory=/opt/si-api
ExecStart=/home/sisiapp/.nvm/nvm-exec node src/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=HOST=0.0.0.0

[Install]
WantedBy=multi-user.target
EOF
```

> **Catatan**: Ganti `User`, `Group`, dan path `nvm-exec` sesuai user yang digunakan.

```bash
# Buat user khusus jika belum ada
sudo useradd -r -s /bin/false -m sisiapp
sudo chown -R sisiapp:sisiapp /opt/si-api

# Aktifkan service
sudo systemctl daemon-reload
sudo systemctl enable --now si-api.service
sudo systemctl status si-api.service
```

### Opsi B — Instalasi Docker

**Langkah 1: Copy file**

```bash
scp -r /home/siapp/si-api user@192.168.90.7:/opt/si-api
```

**Langkah 2: Konfigurasi**

```bash
cd /opt/si-api
cp .env.example .env
nano .env
```

**Langkah 3: Build & jalankan**

```bash
docker compose up -d --build
```

Docker akan:
- Build backend + frontend dalam multi-stage build
- Menjalankan migrasi + seed otomatis di `start.sh`
- Healthcheck setiap 30 detik ke `/api/v1/health`

**Langkah 4: Verifikasi**

```bash
curl http://192.168.90.7:3000/api/v1/health
docker logs si-api
```

### Opsi C — Reverse Proxy dengan Nginx (Rekomendasi)

Akses via port standar (80/443) tanpa menyebut port di URL.

```bash
sudo dnf install -y nginx
# atau: sudo apt install -y nginx
```

Buat config:

```bash
sudo tee /etc/nginx/conf.d/si-api.conf << 'EOF'
server {
    listen 80;
    server_name 192.168.90.7 si-api.rsusoedjono.local;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
```

```bash
# Test config & start
sudo nginx -t
sudo systemctl enable --now nginx

# Firewall port 80
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --reload
```

Sekarang akses via `http://192.168.90.7` (tanpa port 3000).

Untuk HTTPS, tambahkan **Let's Encrypt**:

```bash
sudo dnf install -y certbot python3-certbot-nginx
# atau: sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx -d si-api.rsusoedjono.local
```

---

## 4. Pengguna Default

Setelah seed, 7 user default tersedia:

| Username | Password | Role | Unit |
|----------|----------|------|------|
| `admin` | `12345` | Admin | IT |
| `perawat1` | `12345` | Pelapor | IGD |
| `dokter1` | `12345` | Pelapor | IGD |
| `validator1` | `12345` | Validator | PMKP |
| `pmkp1` | `12345` | PMKP | PMKP |
| `kepala_igd` | `12345` | Kepala Unit | IGD |
| `manajemen1` | `12345` | Manajemen | Direksi |

Semua user default memiliki `must_change_password=1` — akan diminta ganti password saat login pertama.

---

## 5. Struktur API

### Autentikasi

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Profil user saat ini |
| PATCH | `/api/v1/auth/change-password` | Ubah password |

### Insiden

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/v1/incidents` | Buat laporan baru |
| GET | `/api/v1/incidents` | Daftar insiden (pagination + filter) |
| GET | `/api/v1/incidents/:id` | Detail insiden |
| PATCH | `/api/v1/incidents/:id/grade` | Grading severity |
| PATCH | `/api/v1/incidents/:id/status` | Update status (state machine) |
| DELETE | `/api/v1/incidents/:id` | Hapus insiden (admin only) |

### Investigasi

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/investigations` | Daftar investigasi |
| GET | `/api/v1/investigations/:id` | Detail investigasi |
| PATCH | `/api/v1/investigations/:id/complete` | Lengkapi investigasi |

### Master Data

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/master/ruangan` | Daftar ruangan |
| POST | `/api/v1/master/ruangan` | Tambah ruangan (admin) |
| PATCH | `/api/v1/master/ruangan/:id` | Edit ruangan (admin) |
| DELETE | `/api/v1/master/ruangan/:id` | Hapus ruangan (admin) |
| GET | `/api/v1/master/users` | Daftar users (admin) |
| POST | `/api/v1/master/users` | Tambah user (admin) |
| PATCH | `/api/v1/master/users/:id` | Edit user (admin) |
| DELETE | `/api/v1/master/users/:id` | Hapus user (admin) |

### Dashboard

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/dashboard/stats` | Statistik dashboard |
| GET | `/api/v1/dashboard/trends` | Trend bulanan/tahunan |

### Laporan & Export

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/laporan` | Data laporan (JSON) |
| GET | `/api/v1/laporan/export/excel` | Export Excel |
| GET | `/api/v1/laporan/export/pdf` | Export PDF |

### Lainnya

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/v1/notifications` | Notifikasi user |
| GET | `/api/v1/settings` | Pengaturan sistem |
| PUT | `/api/v1/settings` | Update pengaturan (admin) |
| POST | `/api/v1/settings/logo` | Upload logo RS |
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/docs` | Dokumentasi API (Swagger) |

---

## 6. State Machine Status Insiden

Status insiden mengikuti aturan transisi berikut:

```
dilaporkan ──→ divalidasi ──→ investigasi ──→ ditindaklanjuti ──→ selesai
     │              │              │                │
     └──→ ditolak ←┘              └──→ ditolak ←───┘
```

Status `selesai` dan `ditolak` bersifat terminal — tidak ada transisi keluar.

Hanya role `pmkp`, `validator`, dan `admin` yang bisa mengubah status.

---

## 7. Backup & Restore

### Backup Database & Uploads

```bash
# Cron harian
sudo crontab -e
# Tambahkan:
0 2 * * * cp /opt/si-api/data/si-api.db /opt/si-api/backup/si-api-$(date +\%Y\%m\%d).db && cp -r /opt/si-api/uploads /opt/si-api/backup/uploads-$(date +\%Y\%m\%d)
```

### Restore Database

```bash
cp /opt/si-api/backup/si-api-20260610.db /opt/si-api/data/si-api.db
cp -r /opt/si-api/backup/uploads-20260610/* /opt/si-api/uploads/
sudo systemctl restart si-api
# atau: docker compose restart
```

---

## 8. Logging & Monitoring

### Lokasi Log

| Jenis | Path |
|-------|------|
| Aplikasi | `/opt/si-api/app.log` |
| Systemd | `journalctl -u si-api -f` |
| Docker | `docker logs si-api -f` |

### Rotasi Log (logrotate)

```bash
sudo tee /etc/logrotate.d/si-api << 'EOF'
/opt/si-api/*.log {
    daily
    rotate 30
    compress
    missingok
    notifempty
    copytruncate
}
EOF
```

### Scheduler Notifikasi

Sistem menjalankan scheduler cron setiap jam 07:00 yang:
- Mengecek investigasi dengan deadline H-7, H-3, H-1
- Mendeteksi investigasi yang overdue
- Mengirim notifikasi ke user terkait

---

## 9. Verifikasi Kelengkapan

Jalankan test setelah instalasi:

```bash
cd /opt/si-api
npm test
# Output: 76+ passed
```

Buka browser: `http://192.168.90.7:3000` (atau `http://192.168.90.7` jika pakai Nginx)

---

## 10. Troubleshooting

| Masalah | Penyebab | Solusi |
|---------|----------|--------|
| `ECONNREFUSED` saat curl | Server tidak jalan | `systemctl status si-api` atau `docker ps` |
| Halaman tidak bisa diakses dari client | Firewall blocking | `firewall-cmd --add-port=3000/tcp` |
| `JWT_SECRET must be at least 10 characters` | .env tidak lengkap | Generate secret baru |
| 502 Bad Gateway (Nginx) | Backend mati | `systemctl restart si-api` |
| 413 Request Entity Too Large | Upload > limit | Tambah `client_max_body_size` di Nginx |
| Permission denied (data/) | User ownership | `chown -R sisiapp:sisiapp /opt/si-api` |
| Transisi status ditolak | State machine violation | Cek status insiden saat ini |
| Notifikasi deadline tidak terkirim | Scheduler butuh restart | `systemctl restart si-api` |
