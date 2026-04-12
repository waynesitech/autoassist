#!/usr/bin/env bash
# Quick checks when Expo Go says "offline" but the QR shows exp://192.168.x.x:8081
set -euo pipefail
PORT="${RCT_METRO_PORT:-8081}"

lan_ip() {
  for iface in en0 en1 en2; do
    ip="$(ipconfig getifaddr "$iface" 2>/dev/null || true)"
    if [[ -n "$ip" ]]; then
      echo "$ip"
      return 0
    fi
  done
  # Fallback when ipconfig is unavailable (e.g. some sandboxes) or Wi‑Fi is on a different interface
  ip="$(ifconfig 2>/dev/null | awk '/inet / && $2 != "127.0.0.1" { print $2; exit }')"
  if [[ -n "$ip" ]]; then
    echo "$ip"
    return 0
  fi
  echo ""
  return 1
}

IP="$(lan_ip || true)"
if [[ -z "$IP" ]]; then
  IP="<this Mac's Wi‑Fi IPv4 address>"
fi

echo "=== Expo LAN preflight (port ${PORT}) ==="
echo ""
echo "1) Phone and this Mac must use the same Wi‑Fi (not guest / isolated AP)."
echo "2) iPhone: Settings → Privacy & Security → Local Network → enable Expo Go."
echo "3) Mac: System Settings → Network → Firewall — allow incoming for Node (or turn firewall off briefly to test)."
echo "4) In Safari on the phone, open: http://${IP}:${PORT}"
echo "   If that does not load, Expo Go cannot reach Metro either."
echo ""

if command -v lsof >/dev/null 2>&1; then
  echo "Metro listen state (start Expo in another terminal if empty):"
  lsof -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || echo "  (nothing listening on $PORT)"
  echo ""
  echo "If you see only 127.0.0.1:${PORT} and not *:${PORT} or 0.0.0.0:${PORT},"
  echo "the bundler is not accepting LAN connections."
fi

echo ""
echo "Android + USB: run  npm run start:usb-android  (adb reverse + localhost mode)."
