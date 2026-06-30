#!/bin/bash
cd "$(dirname "$0")"

IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "TU-IP-LOCAL")

echo ""
echo "Contador de Calorias - servidor local"
echo "-------------------------------------"
echo "En este Mac:     http://localhost:8080"
echo "En tu iPhone:    http://${IP}:8080"
echo ""
echo "Para acceso directo en iPhone:"
echo "Safari > Compartir > Anadir a pantalla de inicio"
echo ""
echo "Presiona Ctrl+C para detener."
python3 -m http.server 8080 --bind 0.0.0.0
