
## Login

docker compose exec firebase_cli_cms firebase login

## Init

docker compose exec firebase_cli_cms firebase init

## Deploy

docker compose exec firebase_cli_cms firebase deploy

## Deploy solo funzioni

docker compose exec firebase_cli_cms firebase deploy --only functions

## Entrare nel container per nmp

docker exec -it firebase_cli_cms sh
cd /app/functions
npm install


## Attivare emulatore per sviluppo locale

docker compose exec firebase_cli_cms firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data


## Accedere all'UI degli emulatori

http://localhost:4000

## Github

https://github.com/fabioriva1976/demo_cms


## SITEMAP LOCALE

http://localhost:5001/demo2-34a32/europe-west1/sitemap

## Export dati da emulatori a produzione

1. Ferma emulatori (Ctrl+C) - i dati vengono esportati in ./emulator-data
2. Importa Firestore: `docker compose exec firebase_cli_cms firebase firestore:import ./emulator-data/firestore_export`
3. Importa Auth: `docker compose exec firebase_cli_cms firebase auth:import ./emulator-data/auth_export/accounts.json`

Oppure usa lo script: `./export-to-prod.sh`

NOTA: Storage non viene esportato dagli emulatori. Se usi Storage emulator, le immagini sono temporanee.