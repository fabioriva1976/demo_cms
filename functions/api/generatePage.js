const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const admin = require("firebase-admin");
const { region, geminiModel } = require("../index");

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.generatePageApi = onCall(
  { region, timeoutSeconds: 300 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Devi essere autenticato");
    }

    const { prompt, currentHtml, history } = request.data;

    if (!prompt) {
      throw new HttpsError("invalid-argument", "Prompt richiesto");
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error("GEMINI_API_KEY non configurata");
        throw new HttpsError("failed-precondition", "API Key non configurata");
      }
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: geminiModel });

      // Carica il prompt personalizzato dal DB
      let customPrompt = '';
      try {
        const promptDoc = await admin.firestore().collection('settings').doc('ai').get();
        if (promptDoc.exists) {
          customPrompt = promptDoc.data().systemPrompt || '';
        }
      } catch (error) {
        console.log('Nessun prompt personalizzato trovato');
      }

      const conversationHistory = history || [];
      const defaultPrompt = conversationHistory.length === 0
        ? `Sei un web designer esperto. Crea una pagina HTML COMPLETA, moderna e professionale con contenuti reali e dettagliati. Includi:
- Struttura HTML5 completa
- CSS inline o in <style>
- Testi reali e significativi (non placeholder)
- Sezioni ben strutturate
Rispondi SOLO con il codice HTML completo.`
        : `Sei un web designer esperto. Modifica l'HTML esistente secondo le istruzioni dell'utente.

HTML ATTUALE:
${currentHtml}

Rispondi SOLO con il nuovo codice HTML completo, mantenendo la struttura e migliorando secondo le istruzioni.`;
      
      const systemPrompt = customPrompt || defaultPrompt;

      const chatHistory = conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "Ok, genererò solo HTML." }] },
          ...chatHistory
        ]
      });

      console.log("Invio prompt a Gemini:", prompt);
      const result = await chat.sendMessage(prompt);
      let html = result.response.text().trim();
      console.log("Risposta AI grezza:", html.substring(0, 500));
      html = html.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
      console.log("HTML generato, lunghezza:", html.length, "primi 500 char:", html.substring(0, 500));

      return { success: true, html: html };
    } catch (error) {
      console.error("Errore generazione:", error.message, error.stack);
      throw new HttpsError("internal", `Errore: ${error.message}`);
    }
  }
);
