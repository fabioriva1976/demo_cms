import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from './firebase-config.js';

export function initAdminPage(router) { // <-- Accetta il router come parametro
    console.log("Pagina Admin inizializzata.");
    const contentList = document.getElementById('contentList');
    const newContentBtn = document.getElementById('btn-new-content');

    if (newContentBtn) {
        newContentBtn.onclick = () => router.navigate('/admin/new');
    }

    if (!contentList) {
        console.error("Elemento #contentList non trovato!");
        return;
    }

    const loadContent = async () => {
        contentList.innerHTML = '<li>Caricamento...</li>';
        try {
            const querySnapshot = await getDocs(collection(db, "pages"));
            contentList.innerHTML = ''; // Pulisce la lista
            if (querySnapshot.empty) {
                contentList.innerHTML = '<li>Nessun contenuto trovato.</li>';
                return;
            }
            querySnapshot.forEach((doc) => {
                const content = doc.data();
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${content.title} (/${content.slug})</span>
                    <div>
                        <button class="btn-edit" data-id="${doc.id}">Modifica</button>
                        <button class="btn-delete" data-id="${doc.id}">Elimina</button>
                    </div>
                `;
                li.querySelector('.btn-edit').addEventListener('click', (e) => router.navigate(`/admin/edit/${e.target.dataset.id}`));
                li.querySelector('.btn-delete').addEventListener('click', (e) => console.log('Delete ' + e.target.dataset.id)); // Logica di eliminazione da implementare
                contentList.appendChild(li);
            });
        } catch (error) {
            console.error("Errore nel caricare i contenuti: ", error);
            contentList.innerHTML = '<li>Errore nel caricamento dei contenuti.</li>';
        }
    };

    loadContent();
}