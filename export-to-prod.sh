#!/bin/bash

# Script per esportare dati da emulatori a produzione

echo "📤 Export dati da emulatori locali a produzione Firebase..."

# 1. Ferma emulatori e esporta dati
echo "1. Fermando emulatori ed esportando dati..."
# (Devi fermare manualmente con Ctrl+C se in esecuzione)

# 2. Importa Firestore in produzione
echo "2. Importando Firestore in produzione..."
docker compose exec firebase_cli_cms firebase firestore:import ./emulator-data/firestore_export

# 3. Importa Auth in produzione
echo "3. Importando Auth in produzione..."
docker compose exec firebase_cli_cms firebase auth:import ./emulator-data/auth_export/accounts.json

echo "✅ Export completato!"
