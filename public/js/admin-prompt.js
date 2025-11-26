import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export function initAdminPromptPage(router) {
    const form = document.getElementById('prompt-form');

    const loadPrompt = async () => {
        try {
            const docRef = doc(window.db, 'settings', 'ai');
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                form.systemPrompt.value = docSnap.data().systemPrompt || '';
            }
        } catch (error) {
            console.error('Errore caricamento:', error);
        }
    };

    if (form) {
        loadPrompt();
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            
            try {
                await setDoc(doc(window.db, 'settings', 'ai'), {
                    systemPrompt: formData.get('systemPrompt'),
                    updatedAt: new Date()
                });
                alert('Prompt salvato!');
            } catch (error) {
                console.error('Errore salvataggio:', error);
                alert('Errore nel salvataggio');
            }
        });
    }
}
