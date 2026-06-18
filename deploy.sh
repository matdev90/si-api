#!/bin/bash
# ==============================================================
# deploy.sh — Instalasi Cepat SI-API Production
# Sistem Informasi Analisa Pelaporan Insiden
# RSUD dr. R. Soedjono Selong
# ==============================================================
set -euo pipefail

# Warna output
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info() { echo -e "${CYAN}[i]${NC} $1"; }

# ─── Konfigurasi ──────────────────────────────────────────────
INSTALL_DIR="${INSTALL_DIR:-/opt/si-api}"
SERVER_IP="${SERVER_IP:-$(hostname -I | awk '{print $1}')}"
JWT_SECRET="${JWT_SECRET:-$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")}"
DB_PATH="${DB_PATH:-./data/si-api.db}"
PORT="${PORT:-3000}"
METHOD="${METHOD:-direct}"          # direct | docker | nginx

# ─── Cek Prasyarat ───────────────────────────────────────────
info "Memeriksa prasyarat..."

check_cmd() { command -v "$1" >/dev/null 2>&1 || err "$1 tidak ditemukan. Install dulu."; }

if ! command -v node >/dev/null 2>&1; then
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    . "$HOME/.nvm/nvm.sh"
    nvm install 24 >/dev/null 2>&1
    nvm alias default 24 >/dev/null 2>&1
    log "Node.js $(node --version) terinstall via nvm"
  else
    err "Node.js tidak ditemukan. Install via:\n  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash\n  nvm install 24"
  fi
fi

NODE_VER=$(node --version | sed 's/v//' | cut -d. -f1)
[ "$NODE_VER" -ge 20 ] || err "Minimal Node.js 20.x (terinstall: $(node --version))"

check_cmd npm
check_cmd curl

# ─── Setup Direktori ──────────────────────────────────────────
info "Menyiapkan direktori $INSTALL_DIR..."
if [ ! -d "$INSTALL_DIR" ]; then
  sudo mkdir -p "$INSTALL_DIR"
  sudo chown "$(whoami):$(whoami)" "$INSTALL_DIR"
fi
cd "$INSTALL_DIR"

# ─── Copy File Aplikasi ──────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ "$SCRIPT_DIR" != "$INSTALL_DIR" ]; then
  info "Menyalin file aplikasi..."
  cp -r "$SCRIPT_DIR"/* "$INSTALL_DIR/" 2>/dev/null || true
  cp "$SCRIPT_DIR"/.[!.]* "$INSTALL_DIR/" 2>/dev/null || true
fi

# ─── Install Backend ──────────────────────────────────────────
info "Menginstall dependensi backend..."
npm ci --omit=dev --ignore-scripts 2>/dev/null || npm install --omit=dev
log "Dependensi backend siap"

# ─── Build Frontend ──────────────────────────────────────────
if [ -d "frontend" ]; then
  info "Membangun frontend..."
  cd frontend
  npm ci --ignore-scripts 2>/dev/null || npm install
  npm run build
  cd "$INSTALL_DIR"
  log "Frontend siap"
fi

# ─── Konfigurasi Environment ─────────────────────────────────
info "Menyiapkan konfigurasi environment..."
cat > .env << EOF
PORT=$PORT
HOST=0.0.0.0
NODE_ENV=production
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=8h
DB_PATH=$DB_PATH
CORS_ORIGIN=http://$SERVER_IP:$PORT
LOG_LEVEL=info
RATE_LIMIT_MAX=200
EOF
log ".env siap"

# ─── Inisialisasi Database & Uploads ─────────────────────────
info "Inisialisasi database..."
mkdir -p data logs uploads
node src/config/migrate.js
node src/config/seed.js
log "Database siap"

# ─── Firewall ─────────────────────────────────────────────────
info "Membuka port $PORT di firewall..."
if command -v firewall-cmd >/dev/null 2>&1; then
  sudo firewall-cmd --permanent --add-port="$PORT/tcp" 2>/dev/null && sudo firewall-cmd --reload 2>/dev/null && log "Firewall (firewalld) OK"
elif command -v ufw >/dev/null 2>&1; then
  sudo ufw allow "$PORT/tcp" 2>/dev/null && log "Firewall (ufw) OK"
else
  warn "Tidak bisa konfigurasi firewall otomatis. Buka port $PORT manual."
fi

# ─── Systemd Service ──────────────────────────────────────────
info "Membuat systemd service..."
NODE_PATH="$(which node)"
cat > /tmp/si-api.service << EOF
[Unit]
Description=SI-API - Sistem Informasi Analisa Pelaporan Insiden
After=network.target

[Service]
Type=simple
User=$(whoami)
Group=$(whoami)
WorkingDirectory=$INSTALL_DIR
ExecStart=$NODE_PATH src/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/si-api.service /etc/systemd/system/si-api.service
sudo systemctl daemon-reload
sudo systemctl enable si-api.service
sudo systemctl start si-api.service
log "Service si-api aktif"

# ─── Verifikasi ───────────────────────────────────────────────
sleep 3
echo ""
info "Memverifikasi instalasi..."

HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/api/v1/health" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  log "API Health: OK (200)"
else
  warn "API Health: $HTTP_CODE (cek log: journalctl -u si-api -n 20)"
fi

HTTP_UI=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/" 2>/dev/null || echo "000")
if [ "$HTTP_UI" = "200" ]; then
  log "Frontend: OK (200)"
else
  warn "Frontend: $HTTP_CODE"
fi

# ─── Opsi: Nginx Reverse Proxy ────────────────────────────────
if [ "$METHOD" = "nginx" ]; then
  info "Konfigurasi Nginx reverse proxy..."
  check_cmd nginx
  sudo tee /etc/nginx/conf.d/si-api.conf > /dev/null << EOF
server {
    listen 80;
    server_name $SERVER_IP;

    client_max_body_size 10m;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
  sudo nginx -t && sudo systemctl enable --now nginx && log "Nginx OK" || warn "Cek konfigurasi nginx"
fi

# ─── Opsi: Docker ────────────────────────────────────────────
if [ "$METHOD" = "docker" ]; then
  info "Membangun container Docker..."
  check_cmd docker
  sudo docker compose up -d --build
  log "Docker container berjalan"
fi

# ─── Selesai ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  SI-API SIAP DIGUNAKAN${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "  URL Aplikasi : ${CYAN}http://$SERVER_IP:${PORT}${NC}"
[ "$METHOD" = "nginx" ] && echo -e "  Via Nginx    : ${CYAN}http://$SERVER_IP${NC}"
echo ""
echo -e "  Login dengan user berikut:"
echo -e "  ${YELLOW}admin${NC}       (password: 12345) — Admin sistem"
echo -e "  ${YELLOW}perawat1${NC}    (password: 12345) — Pelapor"
echo -e "  ${YELLOW}dokter1${NC}     (password: 12345) — Pelapor"
echo -e "  ${YELLOW}validator1${NC}  (password: 12345) — Validator"
echo -e "  ${YELLOW}pmkp1${NC}       (password: 12345) — PMKP"
echo -e "  ${YELLOW}kepala_igd${NC}  (password: 12345) — Kepala Unit"
echo -e "  ${YELLOW}manajemen1${NC}  (password: 12345) — Manajemen"
echo ""
echo -e "  Dokumentasi API: ${CYAN}http://$SERVER_IP:${PORT}/api/v1/docs${NC}"
echo ""
echo -e "${GREEN}============================================${NC}"

# ─── Petunjuk ─────────────────────────────────────────────────
echo ""
echo "Perintah berguna:"
echo "  sudo systemctl status si-api     # Cek status service"
echo "  sudo journalctl -u si-api -f     # Lihat log"
echo "  sudo systemctl restart si-api    # Restart"
echo "  $INSTALL_DIR/node_modules/.bin/vitest run  # Jalankan test"
echo ""
