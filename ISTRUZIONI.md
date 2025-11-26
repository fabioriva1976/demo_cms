# Istruzioni CMS

## Struttura del Progetto

Il CMS è diviso in due aree:

### 1. Area Amministrazione (URL con /admin)
- **Layout**: Menu laterale sinistro + area contenuto
- **Pagine**:
  - `/login` - Login amministratore
  - `/admin` - Dashboard con lista pagine
  - `/admin/new` - Creazione nuova pagina
  - `/admin/edit/:id` - Modifica pagina esistente
- **Funzionamento**: Carica HTML da file statici in `/public/pages/`

### 2. Area Frontend (URL senza /admin)
- **Layout**: Pagina completa dinamica
- **Funzionamento**: Carica HTML completo dal database Firestore
- **Esempio**: `/chi-siamo`, `/contatti`, `/` (home)

## Come Funziona il Router

1. **Pagine Admin**: Il router cerca una corrispondenza nelle rotte definite
   - Se trova `/admin*`, carica il layout admin e inserisce il contenuto specifico
   
2. **Pagine Frontend**: Se non trova una rotta admin
   - Cerca nel database Firestore una pagina con slug corrispondente
   - Carica l'HTML completo e lo inserisce in `#app`

## Struttura Database Firestore

Collection: `pages`
```
{
  slug: "chi-siamo",           // URL della pagina
  title: "Chi Siamo",          // Titolo
  content: "<div>...</div>",   // HTML completo della pagina
  published: true,             // Visibile o no
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Test del Sistema

1. Avvia gli emulatori Firebase:
   ```bash
   docker compose exec firebase_cli_cms firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data
   ```

2. Accedi all'UI: http://localhost:4000

3. Crea un utente di test nell'emulatore Auth

4. Accedi al CMS: http://localhost:5000/login

5. Crea una nuova pagina con slug "test"

6. Visita: http://localhost:5000/test

## Note Importanti

- Le pagine frontend devono avere `published: true` per essere visibili
- Lo slug "/" viene mappato automaticamente a "home"
- L'editor Quill permette di creare contenuti HTML ricchi
- Il logout è disponibile nel menu laterale admin
