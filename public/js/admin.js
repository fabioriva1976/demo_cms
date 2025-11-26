import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
            const querySnapshot = await getDocs(collection(window.db, "pages"));
            contentList.innerHTML = ''; // Pulisce la lista
            if (querySnapshot.empty) {
                contentList.innerHTML = '<li>Nessun contenuto trovato.</li>';
                return;
            }
            querySnapshot.forEach((doc) => {
                const content = doc.data();
                const li = document.createElement('li');
                li.style.display = 'grid';
                li.style.gridTemplateColumns = '2fr 1fr auto';
                li.style.gap = '1rem';
                li.style.alignItems = 'center';
                li.innerHTML = `
                    <span>${content.title}</span>
                    <a href="/${content.slug}" target="_blank" style="color:#007bff;text-decoration:none;">/${content.slug} ↗</a>
                    <div class="btn-group">
                        <button class="btn-edit" data-id="${doc.id}">Modifica</button>
                        <button class="btn-delete" data-id="${doc.id}">Elimina</button>
                    </div>
                `;
                li.querySelector('.btn-edit').addEventListener('click', (e) => router.navigate(`/admin/edit/${e.target.dataset.id}`));
                li.querySelector('.btn-delete').addEventListener('click', async (e) => {
                    if (confirm('Sei sicuro di voler eliminare questa pagina?')) {
                        try {
                            await deleteDoc(doc(window.db, 'pages', e.target.dataset.id));
                            loadContent();
                        } catch (error) {
                            console.error('Errore eliminazione:', error);
                            alert('Errore nell\'eliminazione');
                        }
                    }
                });
                contentList.appendChild(li);
            });
        } catch (error) {
            console.error("Errore nel caricare i contenuti: ", error);
            contentList.innerHTML = '<li>Errore nel caricamento dei contenuti.</li>';
        }
    };

    loadContent();
}