import { ref, uploadBytes, listAll, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

export function initAdminMediaPage(router) {
    const uploadBtn = document.getElementById('upload-btn');
    const fileUpload = document.getElementById('file-upload');
    const mediaGrid = document.getElementById('media-grid');

    const loadMedia = async () => {
        mediaGrid.innerHTML = '<p>Caricamento...</p>';
        try {
            const storageRef = ref(window.storage, 'media');
            const result = await listAll(storageRef);
            
            mediaGrid.innerHTML = '';
            
            for (const itemRef of result.items) {
                const url = await getDownloadURL(itemRef);
                const card = document.createElement('div');
                card.style.cssText = 'border:1px solid #ddd;border-radius:8px;overflow:hidden;background:white;';
                card.innerHTML = `
                    <img src="${url}" style="width:100%;height:150px;object-fit:cover;cursor:pointer;" data-url="${url}">
                    <div style="padding:0.5rem;display:flex;gap:0.5rem;justify-content:space-between;">
                        <button class="copy-url" data-url="${url}" style="flex:1;padding:0.5rem;font-size:0.8rem;background:#007bff;color:white;border:none;border-radius:4px;cursor:pointer;">Copia URL</button>
                        <button class="delete-img" data-path="${itemRef.fullPath}" style="padding:0.5rem;background:#dc3545;color:white;border:none;border-radius:4px;cursor:pointer;">🗑️</button>
                    </div>
                `;
                mediaGrid.appendChild(card);
            }

            if (result.items.length === 0) {
                mediaGrid.innerHTML = '<p>Nessuna immagine caricata</p>';
            }
        } catch (error) {
            console.error('Errore caricamento media:', error);
            mediaGrid.innerHTML = '<p>Errore caricamento immagini</p>';
        }
    };

    uploadBtn.addEventListener('click', () => fileUpload.click());

    fileUpload.addEventListener('change', async (e) => {
        const files = e.target.files;
        if (!files.length) return;

        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Caricamento...';

        try {
            for (const file of files) {
                const storageRef = ref(window.storage, `media/${Date.now()}_${file.name}`);
                await uploadBytes(storageRef, file);
            }
            alert('Immagini caricate!');
            loadMedia();
        } catch (error) {
            console.error('Errore upload:', error);
            alert('Errore caricamento immagini');
        }

        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Carica Immagini';
        fileUpload.value = '';
    });

    mediaGrid.addEventListener('click', async (e) => {
        if (e.target.classList.contains('copy-url')) {
            const url = e.target.dataset.url;
            await navigator.clipboard.writeText(url);
            const originalText = e.target.textContent;
            e.target.textContent = 'Copiato!';
            setTimeout(() => e.target.textContent = originalText, 2000);
        }

        if (e.target.classList.contains('delete-img')) {
            if (!confirm('Eliminare questa immagine?')) return;
            try {
                const storageRef = ref(window.storage, e.target.dataset.path);
                await deleteObject(storageRef);
                alert('Immagine eliminata');
                loadMedia();
            } catch (error) {
                console.error('Errore eliminazione:', error);
                alert('Errore eliminazione immagine');
            }
        }

        if (e.target.tagName === 'IMG') {
            const url = e.target.dataset.url;
            window.open(url, '_blank');
        }
    });

    loadMedia();
}
