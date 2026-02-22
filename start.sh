#!/bin/bash
# start.sh — Arranca Interviewr con URL pública vía Cloudflare Tunnel

set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Check API key
if [ ! -f .env.local ] || grep -q "your-key-here" .env.local; then
  echo ""
  echo "🔑 Necesitas tu API key de Anthropic."
  echo "   Cógela de: https://console.anthropic.com/settings/keys"
  echo ""
  read -p "   Pega tu API key (sk-ant-...): " API_KEY
  echo "ANTHROPIC_API_KEY=$API_KEY" > .env.local
  echo ""
fi

# Build if needed
if [ ! -d .next ]; then
  echo "📦 Building..."
  npm run build
fi

echo "🚀 Arrancando servidor en localhost:3000..."
npm run start &
SERVER_PID=$!

sleep 3

echo "🌐 Creando túnel público..."
echo ""
TUNNEL_LOG=$(mktemp)
cloudflared tunnel --url http://localhost:3000 > "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!

# Wait for URL to appear
for i in $(seq 1 15); do
  URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$TUNNEL_LOG" 2>/dev/null | head -1)
  if [ -n "$URL" ]; then
    echo "✅ Interviewr está online:"
    echo ""
    echo "   🏠 Admin:   $URL"
    echo "   🔗 Comparte: $URL/interview/<id>"
    echo ""
    echo "   Ctrl+C para parar."
    break
  fi
  sleep 1
done

# Cleanup on exit
cleanup() {
  kill $SERVER_PID $TUNNEL_PID 2>/dev/null
  rm -f "$TUNNEL_LOG"
}
trap cleanup EXIT INT TERM

wait $SERVER_PID
