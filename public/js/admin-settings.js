import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

export function initAdminSettingsPage(router) {
    const form = document.getElementById('settings-form');
    const chatHistory = document.getElementById('chat-history');
    const aiPrompt = document.getElementById('ai-prompt');
    const sendAiBtn = document.getElementById('send-ai');
    const aiTarget = document.getElementById('ai-target');
    const quillHeader = new Quill('#editor-header', { theme: 'snow' });
    const quillFooter = new Quill('#editor-footer', { theme: 'snow' });

    let conversationHistory = [];

    const addMessage = (role, content) => {
        const msg = document.createElement('div');
        msg.style.marginBottom = '1rem';
        msg.style.padding = '0.5rem';
        msg.style.borderRadius = '4px';
        msg.style.background = role === 'user' ? '#e3f2fd' : '#f5f5f5';
        msg.innerHTML = `<strong>${role === 'user' ? 'Tu' : 'AI'}:</strong> ${content}`;
        chatHistory.appendChild(msg);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    };

    const loadSettings = async () => {
        try {
            const docRef = doc(window.db, 'settings', 'site');
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                quillHeader.root.innerHTML = data.headerHtml || '';
                quillFooter.root.innerHTML = data.footerHtml || '';
            }
        } catch (error) {
            console.error('Errore caricamento:', error);
        }
    };

    if (sendAiBtn) {
        sendAiBtn.addEventListener('click', async () => {
            const prompt = aiPrompt.value.trim();
            const target = aiTarget.value;
            if (!prompt) return;
            
            addMessage('user', prompt);
            conversationHistory.push({ role: 'user', content: prompt });
            aiPrompt.value = '';
            sendAiBtn.disabled = true;
            sendAiBtn.textContent = 'Generando...';
            
            try {
                const currentHtml = target === 'header' ? quillHeader.root.innerHTML : quillFooter.root.innerHTML;
                const generatePage = httpsCallable(window.functions, 'generatePageApi');
                const result = await generatePage({
                    prompt: `Genera ${target === 'header' ? 'HEADER' : 'FOOTER'} HTML: ${prompt}`,
                    currentHtml: currentHtml,
                    history: conversationHistory
                });
                
                const aiResponse = result.data.html;
                if (target === 'header') {
                    quillHeader.root.innerHTML = aiResponse;
                } else {
                    quillFooter.root.innerHTML = aiResponse;
                }
                addMessage('assistant', `Ho aggiornato il ${target}`);
                conversationHistory.push({ role: 'assistant', content: `Ho aggiornato il ${target}` });
            } catch (error) {
                console.error('Errore AI:', error);
                const errorMsg = error.message || error.code || 'Errore sconosciuto';
                addMessage('assistant', `Errore: ${errorMsg}`);
            }
            
            sendAiBtn.disabled = false;
            sendAiBtn.textContent = 'Invia';
        });
        
        aiPrompt.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendAiBtn.click();
        });
    }

    if (form) {
        loadSettings();
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const docRef = doc(window.db, 'settings', 'site');
                await setDoc(docRef, {
                    headerHtml: quillHeader.root.innerHTML,
                    footerHtml: quillFooter.root.innerHTML,
                    updatedAt: new Date()
                });
                alert('Impostazioni salvate!');
            } catch (error) {
                console.error('Errore salvataggio:', error);
                alert('Errore nel salvataggio');
            }
        });
    }
}
