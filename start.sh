#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# PAN!C — Root launcher (convenience wrapper)
# Delegates to rn/start.sh which starts backend + Vite + Expo tunnel
# ─────────────────────────────────────────────────────────────────────────────
exec "$(dirname "$0")/rn/start.sh" "$@"
