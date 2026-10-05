#!/usr/bin/env bash

# ==============================================================================
# JURLAY AGENT - Orchestrator & Process Lifecycle Manager
# Owner: Nyons (CEO)
# ==============================================================================

set -e

export PATH="/Users/apple/.local/bin:$PATH"

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

ACTION="${1:-dev}"

print_banner() {
  echo ""
  echo "  ██╗██╗   ██╗██████╗ ██╗      █████╗ ██╗   ██╗     █████╗  ██████╗ ███████╗███╗   ██╗████████╗"
  echo "  ██║██║   ██║██╔══██╗██║     ██╔══██╗╚██╗ ██╔╝    ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝"
  echo "  ██║██║   ██║██████╔╝██║     ███████║ ╚████╔╝     ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   "
  echo "  ██║██║   ██║██╔══██╗██║     ██╔══██║  ╚██╔╝      ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   "
  echo "  ██║╚██████╔╝██║  ██║███████╗██║  ██║   ██║       ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   "
  echo "  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝   ╚═╝       ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   "
  echo "  🏢 Autonomous Virtual AI Software House & Hermes Orchestrator"
  echo "  👑 CEO: Nyons | Version: 1.0.0"
  echo " =============================================================================="
  echo ""
}

case "$ACTION" in
  "install")
    print_banner
    echo "📦 Menginstall dependencies Backend..."
    cd "$DIR/backend" && npm install
    echo "📦 Menginstall dependencies Frontend..."
    cd "$DIR/frontend" && npm install
    echo "✅ Semua dependencies berhasil diinstall!"
    ;;

  "build")
    print_banner
    echo "🔨 Building Backend..."
    cd "$DIR/backend" && npm run build
    echo "🔨 Building Frontend..."
    cd "$DIR/frontend" && npm run build
    echo "✅ Build selesai!"
    ;;

  "dev"|"start")
    print_banner
    echo "🔍 Memeriksa koneksi MySQL (Port 3306)..."
    if ! nc -z 127.0.0.1 3306 2>/dev/null; then
      echo "⚠️  Peringatan: MySQL tidak terdeteksi aktif di localhost:3306."
      echo "   Pastikan XAMPP / MySQL Service sudah running!"
    else
      echo "✅ MySQL Port 3306 terdeteksi aktif."
    fi

    # Trap Ctrl+C (SIGINT) and SIGTERM to kill both background child processes
    cleanup() {
      echo ""
      echo "🛑 Menghentikan JURLAY AGENT (Backend & Frontend)..."
      if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
      fi
      if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
      fi
      echo "👋 JURLAY AGENT dimatikan dengan aman. Sampai jumpa CEO Nyons!"
      exit 0
    }

    trap cleanup SIGINT SIGTERM

    echo "🚀 Menjalankan Backend (Node.js + Express + TypeORM) di port 5001..."
    (cd "$DIR/backend" && npm run dev) &
    BACKEND_PID=$!

    echo "🚀 Menjalankan Frontend (React + Vite + Tailwind) di port 5173..."
    (cd "$DIR/frontend" && npm run dev) &
    FRONTEND_PID=$!

    echo ""
    echo "✨ JURLAY AGENT siap digunakan!"
    echo "   🔗 Frontend Web UI:  http://localhost:5173"
    echo "   ⚙️  Backend API:      http://localhost:5001/api"
    echo "   📊 Health Check:     http://localhost:5001/health"
    echo ""
    echo "Tekan Ctrl + C untuk mematikan semua layanan."
    echo "------------------------------------------------------------------------------"

    wait
    ;;

  *)
    echo "Perintah tidak dikenali: $ACTION"
    echo "Penggunaan: ./start-dev.sh [dev|start|build|install]"
    exit 1
    ;;
esac
