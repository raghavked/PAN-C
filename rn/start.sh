#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# PAN!C — Local Development Launcher
#
# Starts:
#   1. Express backend on port 3001
#   2. Vite web app on port 5000 (proxies /api → 3001)
#   3. Expo Metro bundler on port 8081 (proxies /api → 3001 via metro.config.js)
#   4. Expo tunnel via @expo/ngrok so Expo Go can connect from any device
#
# Usage:
#   cd rn && bash start.sh
#
# Requirements:
#   - .env file in the repo root (../. env relative to this script)
#   - npm install done in both / and /rn and /server
# ─────────────────────────────────────────────────────────────────────────────

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RN_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_PORT=3001
VITE_PORT=5000
METRO_PORT=8081

# Load .env from repo root
if [ -f "$REPO_ROOT/.env" ]; then
  set -a
  source "$REPO_ROOT/.env"
  set +a
  echo "✅ Loaded .env from $REPO_ROOT"
else
  echo "⚠️  No .env found at $REPO_ROOT/.env — some features may not work"
fi

cleanup() {
  echo ""
  echo "🛑 Shutting down all processes..."
  [ -n "$BACKEND_PID" ] && kill "$BACKEND_PID" 2>/dev/null
  [ -n "$VITE_PID" ]    && kill "$VITE_PID"    2>/dev/null
  [ -n "$EXPO_PID" ]    && kill "$EXPO_PID"    2>/dev/null
  exit 0
}
trap cleanup SIGTERM SIGINT

# ── 1. Start Express backend ──────────────────────────────────────────────────
echo ""
echo "🚀 Starting Express backend on port $BACKEND_PORT..."
cd "$REPO_ROOT/server"
node src/index.js > /tmp/panc_server.log 2>&1 &
BACKEND_PID=$!
sleep 2

if curl -sf "http://localhost:$BACKEND_PORT/health" > /dev/null 2>&1; then
  echo "   ✅ Backend running — http://localhost:$BACKEND_PORT"
else
  echo "   ⚠️  Backend may still be starting (check /tmp/panc_server.log)"
fi

# ── 2. Start Vite web app ─────────────────────────────────────────────────────
echo ""
echo "🌐 Starting Vite web app on port $VITE_PORT..."
cd "$REPO_ROOT"
npx vite --port $VITE_PORT --host 0.0.0.0 > /tmp/panc_vite.log 2>&1 &
VITE_PID=$!
sleep 3
echo "   ✅ Web app running — http://localhost:$VITE_PORT"

# ── 3. Start Expo with tunnel ─────────────────────────────────────────────────
echo ""
echo "📱 Starting Expo Metro bundler with tunnel (port $METRO_PORT)..."
echo "   This may take 30–60 seconds for the tunnel to establish..."
cd "$RN_DIR"

# Use @expo/ngrok tunnel — this is the most reliable method for Expo Go
npx expo start --port $METRO_PORT --tunnel > /tmp/panc_expo.log 2>&1 &
EXPO_PID=$!

# Wait for tunnel URL to appear in the log
TUNNEL_URL=""
for i in $(seq 1 30); do
  sleep 2
  # Expo prints the exp:// URL in the log
  TUNNEL_URL=$(grep -oE 'exp://[a-zA-Z0-9._-]+:[0-9]+' /tmp/panc_expo.log 2>/dev/null | head -1)
  if [ -n "$TUNNEL_URL" ]; then
    break
  fi
  # Also check for the QR code section
  if grep -q 'Metro waiting on' /tmp/panc_expo.log 2>/dev/null; then
    TUNNEL_URL=$(grep -oE 'exp://[a-zA-Z0-9._-]+' /tmp/panc_expo.log 2>/dev/null | head -1)
    [ -n "$TUNNEL_URL" ] && break
  fi
done

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  🚨 PAN!C — LOCAL DEVELOPMENT SERVERS RUNNING"
echo ""
echo "  🌐 Web App:    http://localhost:$VITE_PORT"
echo "  🔧 Backend:    http://localhost:$BACKEND_PORT"
echo "  📋 API Health: http://localhost:$BACKEND_PORT/health"
echo ""
if [ -n "$TUNNEL_URL" ]; then
  echo "  📱 Expo Go URL (scan QR or type in Expo Go):"
  echo "     $TUNNEL_URL"
else
  echo "  📱 Expo Go: Check /tmp/panc_expo.log for the exp:// URL"
  echo "     Or run: grep 'exp://' /tmp/panc_expo.log"
fi
echo ""
echo "  📄 Logs:"
echo "     Backend: tail -f /tmp/panc_server.log"
echo "     Vite:    tail -f /tmp/panc_vite.log"
echo "     Expo:    tail -f /tmp/panc_expo.log"
echo ""
echo "  Press Ctrl+C to stop all servers"
echo "════════════════════════════════════════════════════════════════"

wait $EXPO_PID
