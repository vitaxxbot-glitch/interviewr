#!/bin/bash
# run.sh — Script de inicio para LaunchAgent
# Arranca Next.js en puerto 3000

cd "$(dirname "$0")"
exec /opt/homebrew/bin/node /opt/homebrew/bin/npm run start
