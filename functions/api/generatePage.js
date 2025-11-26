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

    const { prompt, pageId } = request.data;

    if (!prompt) {
      throw new HttpsError("invalid-argument", "Prompt richiesto");
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY non configurata");
      }
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: geminiModel });

      let history = [];
      let currentContent = '';
      
      if (pageId) {
        const pageDoc = await admin.firestore().collection("pages").doc(pageId).get();
        if (pageDoc.exists) {
          const data = pageDoc.data();
          currentContent = data.content || '';
          history = data.aiHistory || [];
        }
      }

      // Recupera tutte le pagine esistenti per contesto
      let contextPages = '';
      const pagesSnapshot = await admin.firestore().collection("pages").limit(5).get();
      if (!pagesSnapshot.empty) {
        const pages = [];
        pagesSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.content && data.url) {
            pages.push(`\n--- ${data.url} ---\n${data.content.substring(0, 1000)}`);
          }
        });
        if (pages.length > 0) {
          contextPages = `\n\nPAGINE ESISTENTI (usa se necessario):${pages.join('\n')}`;
        }
      }

      const systemPrompt = history.length === 0
        ? "Sei un web designer esperto. Crea una pagina HTML COMPLETA con <!DOCTYPE html>, <html>, <head>, <body>. Includi tutti gli stili CSS nel tag <style> dentro <head>. Rispondi in questo formato:\n1. Una breve descrizione (max 2 righe)\n2. Il codice HTML completo con DOCTYPE\nSepara con '---'"
        : "Sei un web designer esperto. Modifica l'HTML mantenendo la struttura completa con <!DOCTYPE html>, <html>, <head>, <body>. Rispondi in questo formato:\n1. Una breve descrizione delle modifiche (max 2 righe)\n2. Il codice HTML completo con DOCTYPE\nSepara con '---'";

      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: systemPrompt }] },
          { role: "model", parts: [{ text: "Capito, risponderò con descrizione e HTML separati da ---." }] },
          ...history
        ]
      });

      const result = await chat.sendMessage(prompt + contextPages);
      let response = result.response.text().trim();
      response = response.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
      
      const parts = response.split('---');
      const aiResponse = parts.length > 1 ? parts[0].trim() : 'Ho generato il codice HTML.';
      const html = parts.length > 1 ? parts[1].trim() : response;

      history.push(
        { role: "user", parts: [{ text: prompt }] },
        { role: "model", parts: [{ text: aiResponse }] }
      );

      if (pageId) {
        await admin.firestore().collection("pages").doc(pageId).update({
          content: html,
          aiHistory: history
        });
      }

      return { success: true, content: html, response: aiResponse };
    } catch (error) {
      console.error("Errore generazione:", error);
      throw new HttpsError("internal", "Errore nella generazione del contenuto");
    }
  }
);
