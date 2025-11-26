// functions/index.js

// --- CONFIGURAZIONE GLOBALE ---
const { defineSecret } = require('firebase-functions/params');

// Esporta le configurazioni in modo che altri file possano importarle.
exports.region = "europe-west1";
exports.timezone = "Europe/Rome";

//config Gemini
exports.geminiModel = "gemini-2.5-flash"
exports.geminiApiKey = defineSecret("AIzaSyCkVXMfrzhidqbSguxQfRZH2Xwh8ZDPXS4"); // Uso il nome con _SECRET per chiarezza

//config mail
exports.emailSender = 'fabio.riva@avirin.it';
exports.emailPasswordSecret = defineSecret("EMAIL_APP_PASSWORD");

// --- ESPORTAZIONE DELLE FUNZIONI ---

// Funzioni Cron
//exports.databaseCleanerCron = require("./cron/databaseCleaner").databaseCleanerCron;

// Funzioni API (Callable)
//exports.doSomethingApi = require("./api/doSomething").doSomethingApi;
exports.generatePageApi = require("./api/generatePage").generatePageApi;

