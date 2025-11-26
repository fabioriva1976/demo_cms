import { collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-functions.js";

export function initAdminNewPage(router) {
    const form = document.getElementById('new-page-form');
    const chatHistory = document.getElementById('chat-history');
    const aiPrompt = document.getElementById('ai-prompt');
    const sendAiBtn = document.getElementById('send-ai');
    const toggleBtn = document.getElementById('toggle-view');
    const editorDiv = document.getElementById('editor');
    const htmlCode = document.getElementById('html-code');
    
    let conversationHistory = [];
    let isCodeView = true;

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            isCodeView = !isCodeView;
            if (isCodeView) {
                // Salva modifiche visuale nel textarea
                htmlCode.value = editorDiv.innerHTML;
                editorDiv.style.display = 'none';
                htmlCode.style.display = 'block';
                toggleBtn.textContent = 'Mostra Visuale';
            } else {
                // Mostra visuale dal textarea
                editorDiv.innerHTML = htmlCode.value;
                editorDiv.style.display = 'block';
                htmlCode.style.display = 'none';
                toggleBtn.textContent = 'Mostra Codice';
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

    if (sendAiBtn) {
        sendAiBtn.addEventListener('click', async () => {
            const prompt = aiPrompt.value.trim();
            if (!prompt) return;
            
            addMessage('user', prompt);
            conversationHistory.push({ role: 'user', content: prompt });
            aiPrompt.value = '';
            sendAiBtn.disabled = true;
            sendAiBtn.textContent = 'Generando...';
            
            try {
                const generatePage = httpsCallable(window.functions, 'generatePageApi');
                const currentContent = htmlCode.value || '';
                const result = await generatePage({
                    prompt: prompt,
                    currentHtml: currentContent,
                    history: conversationHistory
                });
                
                const aiResponse = result.data.html;
                let rawHtmlField = document.getElementById('raw-html');
                if (!rawHtmlField) {
                    rawHtmlField = document.createElement('input');
                    rawHtmlField.type = 'hidden';
                    rawHtmlField.id = 'raw-html';
                    form.appendChild(rawHtmlField);
                }
                rawHtmlField.value = aiResponse;
                htmlCode.value = aiResponse;
                if (!isCodeView) {
                    editorDiv.innerHTML = aiResponse;
                }
                addMessage('assistant', currentContent ? 'Ho modificato il contenuto HTML' : 'Ho generato il contenuto HTML');
                conversationHistory.push({ role: 'assistant', content: 'Ho generato il contenuto HTML' });
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
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Se sei in visuale, sincronizza con textarea prima di salvare
            if (!isCodeView && editorDiv.style.display !== 'none') {
                htmlCode.value = editorDiv.innerHTML;
            }
            
            const formData = new FormData(form);
            
            try {
                const rawHtml = document.getElementById('raw-html');
                const finalContent = rawHtml && rawHtml.value ? rawHtml.value : htmlCode.value;
                
                await addDoc(collection(window.db, 'pages'), {
                    slug: formData.get('slug'),
                    title: formData.get('title'),
                    content: finalContent,
                    published: formData.get('published') === 'on',
                    aiHistory: conversationHistory,
                    createdAt: new Date()
                });
                alert('Pagina salvata!');
                router.navigate('/admin');
            } catch (error) {
                console.error('Errore salvataggio:', error);
                alert('Errore nel salvataggio');
            }
        });
    }
}