#!/bin/bash

METRO_PORT=8081
TUNNEL_SUBDOMAIN="panc-dev-$$"

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $METRO_PID $TUNNEL_PID 2>/dev/null
  exit 0
}
trap cleanup SIGTERM SIGINT

echo "Starting Metro Bundler on port $METRO_PORT..."
npx expo start --port $METRO_PORT --no-dev-client 2>&1 &
METRO_PID=$!

echo "Waiting for Metro to start..."
sleep 8

echo "Starting localtunnel..."
npx localtunnel --port $METRO_PORT --subdomain $TUNNEL_SUBDOMAIN > /tmp/lt_output.txt 2>&1 &
TUNNEL_PID=$!

sleep 4

TUNNEL_URL=$(grep -o 'https://[^ ]*\.loca\.lt' /tmp/lt_output.txt | head -1)

if [ -n "$TUNNEL_URL" ]; then
  # Convert https tunnel URL to exp:// URL for Expo Go
  EXPO_HOST=$(echo "$TUNNEL_URL" | sed 's|https://||')
  EXPO_URL="exp://${EXPO_HOST}"

  echo ""
  echo "============================================"
  echo "  EXPO GO URL (type this in Expo Go app):"
  echo ""
  echo "  $EXPO_URL"
  echo ""
  echo "  Or open in browser first to bypass tunnel"
  echo "  password screen: $TUNNEL_URL"
  echo "============================================"
  echo ""
else
  echo "WARNING: Could not get tunnel URL. Check /tmp/lt_output.txt"
fi

wait $METRO_PID
