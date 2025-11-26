import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

export function initAdminSettingsPage(router) {
    const form = document.getElementById('settings-form');
    const chatHistory = document.getElementById('chat-history');
    const aiPrompt = document.getElementById('ai-prompt');
    const sendAiBtn = document.getElementById('send-ai');
    const aiTarget = document.getElementById('ai-target');
    const headerCode = document.getElementById('header-code');
    const headerVisual = document.getElementById('header-visual');
    const footerCode = document.getElementById('footer-code');
    const footerVisual = document.getElementById('footer-visual');
    const toggleHeader = document.getElementById('toggle-header');
    const toggleFooter = document.getElementById('toggle-footer');

    let conversationHistory = [];
    let isHeaderCodeView = true;
    let isFooterCodeView = true;

    if (toggleHeader) {
        toggleHeader.addEventListener('click', () => {
            isHeaderCodeView = !isHeaderCodeView;
            if (isHeaderCodeView) {
                headerCode.value = headerVisual.innerHTML;
                headerVisual.style.display = 'none';
                headerCode.style.display = 'block';
                toggleHeader.textContent = 'Mostra Visuale';
            } else {
                headerVisual.innerHTML = headerCode.value;
                headerVisual.style.display = 'block';
                headerCode.style.display = 'none';
                toggleHeader.textContent = 'Mostra Codice';
            }
        });
    }

    if (toggleFooter) {
        toggleFooter.addEventListener('click', () => {
            isFooterCodeView = !isFooterCodeView;
            if (isFooterCodeView) {
                footerCode.value = footerVisual.innerHTML;
                footerVisual.style.display = 'none';
                footerCode.style.display = 'block';
                toggleFooter.textContent = 'Mostra Visuale';
            } else {
                footerVisual.innerHTML = footerCode.value;
                footerVisual.style.display = 'block';
                footerCode.style.display = 'none';
                toggleFooter.textContent = 'Mostra Codice';
            }
        });
    }

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
                headerCode.value = data.headerHtml || '';
                footerCode.value = data.footerHtml || '';
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
                const currentHtml = target === 'header' ? headerCode.value : footerCode.value;
                const generatePage = httpsCallable(window.functions, 'generatePageApi');
                const result = await generatePage({
                    prompt: `Genera ${target === 'header' ? 'HEADER' : 'FOOTER'} HTML: ${prompt}`,
                    currentHtml: currentHtml,
                    history: conversationHistory
                });
                
                const aiResponse = result.data.html;
                if (target === 'header') {
                    headerCode.value = aiResponse;
                    if (!isHeaderCodeView) headerVisual.innerHTML = aiResponse;
                } else {
                    footerCode.value = aiResponse;
                    if (!isFooterCodeView) footerVisual.innerHTML = aiResponse;
                }
                addMessage('assistant', `Ho modificato il ${target}`);
                conversationHistory.push({ role: 'assistant', content: `Ho modificato il ${target}` });
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
            
            if (!isHeaderCodeView) headerCode.value = headerVisual.innerHTML;
            if (!isFooterCodeView) footerCode.value = footerVisual.innerHTML;
            
            try {
                const docRef = doc(window.db, 'settings', 'site');
                await setDoc(docRef, {
                    headerHtml: headerCode.value,
                    footerHtml: footerCode.value,
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
