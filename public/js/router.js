import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// Importa le funzioni di inizializzazione delle pagine
import { initAdminPage } from './admin.js';
import { initAdminContentPage } from './adminContent.js';
import { initAdminNewPage } from './admin-new.js';
import { initAdminEditPage } from './admin-edit.js';

const appDiv = document.getElementById('app');
let currentAdminLayout = false;

/**
 * Funzione per caricare dinamicamente una vista HTML.
 * @param {string} url - L'URL del file HTML da caricare.
 * @returns {Promise<string>} Il contenuto HTML come testo.
 */
async function loadView(url) {
    const response = await fetch(url);
    if (!response.ok) {
        // Se il file non viene trovato, reindirizza alla pagina 404
        window.history.pushState({}, "", "/404");
        return loadView('/pages/404.html');
    }
    return response.text();
}

/**
 * Gestisce il caricamento delle viste in base al percorso.
 * @param {string} path - Il percorso della rotta.
 */
async function handleRoute(path) {
    const match = findMatchingRoute(path);

    if (!match) {
        appDiv.innerHTML = await loadView('/pages/404.html');
        return;
    }

    const route = match.route;
    const params = getParams(match);

    // Logica per il layout di amministrazione
    if (route.isAdmin) {
        // Se non siamo già nel layout admin, caricalo
        if (!currentAdminLayout) {
            console.log("Caricamento layout Admin...");
            appDiv.innerHTML = await loadView('/pages/admin-layout.html');
            currentAdminLayout = true;
        }
        // Ora carica la vista specifica dell'admin nel suo contenitore
        const adminContentDiv = document.getElementById('admin-content');
        if (!adminContentDiv) {
            console.error("Contenitore #admin-content non trovato nel layout!");
            return;
        }
        adminContentDiv.innerHTML = await route.view(params);
        // ESEGUI LO SCRIPT ASSOCIATO ALLA PAGINA DOPO IL CARICAMENTO DELL'HTML
        if (route.init) {
            route.init(window.router, params); // Passa il router
        }
    } else {
        // Per le rotte non-admin, carica direttamente nell'#app
        currentAdminLayout = false;
        const viewHtml = await route.view(params);
        appDiv.innerHTML = viewHtml;
        // ESEGUI LO SCRIPT ASSOCIATO ALLA PAGINA DOPO IL CARICAMENTO DELL'HTML
        if (route.init) {
            route.init(window.router, params); // Passa il router
        }
    }
}

/**
 * Converte i percorsi stringa in espressioni regolari.
 */
function pathToRegex(path) {
    return new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");
}

/**
 * Estrae i parametri dall'URL.
 */
function getParams(match) {    
    if (!match || !match.result) return {};
    const values = match.result.slice(1);
    const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(result => result[1]);
    return Object.fromEntries(keys.map((key, i) => [key, values[i]]));
}

function findMatchingRoute(path) {
    for (const route of routes) {
        const regex = pathToRegex(route.path);
        const match = path.match(regex);
        if (match) {
            return { route, result: match };
        }
    }
    return null;
}

// Definizione delle rotte
const routes = [
    { path: "/", view: () => loadView('/pages/home.html'), isAdmin: false },
    { path: "/login", view: () => loadView('/pages/login.html'), isAdmin: false },
    { path: "/admin", view: () => loadView('/pages/admin.html'), isAdmin: true, init: initAdminPage },
    { path: "/admin/new", view: () => loadView('/pages/admin-new.html'), isAdmin: true, init: initAdminNewPage },
    { path: "/admin/edit/:id", view: (params) => loadView(`/pages/admin-edit.html?id=${params.id}`), isAdmin: true, init: initAdminEditPage },
    { path: "/admin/settings", view: () => loadView('/pages/admin-part.html'), isAdmin: true, init: initAdminContentPage },
    { path: "/404", view: () => loadView('/pages/404.html'), isAdmin: false },
];

const router = async () => {
    let match = findMatchingRoute(window.location.pathname);

    if (!match) {
        match = {
            route: routes.find(r => r.path.includes('404')),
            result: [window.location.pathname]
        };
        window.history.pushState({}, "", "/404");
    }

    await handleRoute(window.location.pathname);
};

// Navigazione tramite History API
window.addEventListener("popstate", router);

document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", e => {
        if (e.target.matches("[data-link]")) {
            e.preventDefault();
            window.history.pushState({}, "", e.target.href);
            router();
        }
    });

    onAuthStateChanged(window.auth, (user) => {
        const publicRoutes = ['/', '/login'];
        const isPublic = publicRoutes.includes(window.location.pathname);

        if (user) {
            // Utente loggato
            if (window.location.pathname === '/login') {
                window.history.pushState({}, "", "/admin");
                router();
            } else {
                router();
            }
        } else {
            // Utente non loggato
            if (!isPublic && !window.location.pathname.startsWith('/admin')) {
                 router(); // Permette di vedere le pagine pubbliche
            } else if (window.location.pathname.startsWith('/admin')) {
                window.history.pushState({}, "", "/login");
                router();
            } else {
                router();
            }
        }
    });
});

// Esporta il router se necessario da altri moduli
window.router = { navigate: (path) => { window.history.pushState({}, "", path); router(); } };
