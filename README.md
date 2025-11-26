
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

