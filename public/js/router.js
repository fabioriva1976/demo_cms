import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initAdminPage } from './admin.js';
import { initAdminNewPage } from './admin-new.js';
import { initLoginPage } from './login.js';
import { initAdminEditPage } from './admin-edit.js';
import { initAdminSettingsPage } from './admin-settings.js';
import { initAdminPromptPage } from './admin-prompt.js';

const routes = [
    { path: "/login", view: "/pages/login.html", init: initLoginPage },
    { path: "/admin", view: "/pages/admin.html", isAdmin: true, init: initAdminPage },
    { path: "/admin/new", view: "/pages/admin-new.html", isAdmin: true, init: initAdminNewPage },
    { path: "/admin/edit/:id", view: "/pages/admin-edit.html", isAdmin: true, init: initAdminEditPage },
    { path: "/admin/settings", view: "/pages/admin-settings.html", isAdmin: true, init: initAdminSettingsPage },
    { path: "/admin/prompt", view: "/pages/admin-prompt.html", isAdmin: true, init: initAdminPromptPage },
];

async function loadHTML(url) {
    const res = await fetch(url);
    return res.text();
}

async function loadPageFromDB(slug) {
    const q = query(collection(window.db, 'pages'), where('slug', '==', slug), where('published', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error(`Pagina non trovata: ${slug}`);
    return snap.docs[0].data().content || '';
}

function matchRoute(path) {
    for (const route of routes) {
        const pattern = route.path.replace(/:\w+/g, '([^/]+)');
        const regex = new RegExp(`^${pattern}$`);
        const match = path.match(regex);
        if (match) {
            const keys = (route.path.match(/:\w+/g) || []).map(k => k.substring(1));
            const params = {};
            keys.forEach((key, i) => params[key] = match[i + 1]);
            return { route, params };
        }
    }
    return null;
}

async function router() {
    console.log('Router chiamato, path:', window.location.pathname);
    const mainContent = document.getElementById('main-content');
    const adminSidebar = document.getElementById('admin-sidebar');
    const siteHeader = document.getElementById('site-header');
    const siteFooter = document.getElementById('site-footer');
    
    console.log('Elementi trovati:', {mainContent: !!mainContent, adminSidebar: !!adminSidebar, siteHeader: !!siteHeader, siteFooter: !!siteFooter});
    
    if (!mainContent) {
        console.error('main-content non trovato');
        return;
    }
    
    const path = window.location.pathname;
    const match = matchRoute(path);

    try {
        if (match) {
            const { route, params } = match;
            
            if (route.isAdmin) {
                siteHeader.style.display = 'none';
                siteFooter.style.display = 'none';
                adminSidebar.style.display = 'block';
                adminSidebar.style.display = 'flex';
                adminSidebar.style.flexDirection = 'column';
                adminSidebar.style.justifyContent = 'space-between';
                adminSidebar.innerHTML = `
                    <div>
                        <div style="padding:1rem;border-bottom:1px solid #ddd;">
                            <h3 style="margin:0;font-size:1.2rem;color:white;">CMS Admin</h3>
                        </div>
                        <nav class="admin-nav">
                            <a href="/admin" data-link>Dashboard Pagine</a>
                            <a href="/admin/new" data-link>Nuova Pagina</a>
                            <a href="/admin/settings" data-link>Header & Footer</a>
                            <a href="/admin/prompt" data-link>Prompt AI</a>
                        </nav>
                    </div>
                    <div style="padding:1rem;border-top:1px solid rgba(255,255,255,0.1);">
                        <button onclick="window.logout()" style="width:100%;padding:0.5rem;background:#dc3545;color:white;border:none;border-radius:4px;cursor:pointer;">Logout</button>
                    </div>
                `;
                mainContent.innerHTML = await loadHTML(route.view);
                if (route.init) route.init(window.router, params);
            } else {
                siteHeader.style.display = 'none';
                siteFooter.style.display = 'none';
                adminSidebar.style.display = 'none';
                mainContent.innerHTML = await loadHTML(route.view);
                if (route.init) route.init(window.router, params);
            }
        } else {
            adminSidebar.style.display = 'none';
            const slug = path === '/' ? 'home' : path.substring(1);
            
            console.log('Caricamento pagina frontend, slug:', slug);
            
            // Carica pagina e settings in parallelo
            const [pageContent, settingsSnap] = await Promise.all([
                loadPageFromDB(slug),
                getDoc(doc(window.db, 'settings', 'site')).catch(() => null)
            ]);
            
            console.log('Contenuto caricato, lunghezza:', pageContent.length);
            
            // Estrai solo il body se presente
            let finalContent = pageContent;
            const bodyMatch = pageContent.match(/<body[^>]*>(.*?)<\/body>/is);
            if (bodyMatch) finalContent = bodyMatch[1];
            
            mainContent.innerHTML = finalContent;
            
            // Imposta header e footer
            if (settingsSnap && settingsSnap.exists()) {
                const settings = settingsSnap.data();
                siteHeader.innerHTML = settings.headerHtml || '';
                siteFooter.innerHTML = settings.footerHtml || '';
                siteHeader.style.display = 'block';
                siteFooter.style.display = 'block';
            } else {
                siteHeader.style.display = 'none';
                siteFooter.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Errore router:', error, error.stack);
        siteHeader.style.display = 'none';
        siteFooter.style.display = 'none';
        adminSidebar.style.display = 'none';
        mainContent.innerHTML = '<div style="padding:2rem;text-align:center;"><h1>404</h1><p>Pagina non trovata</p><p>' + error.message + '</p></div>';
    }
}

window.logout = async () => {
    await window.auth.signOut();
    window.router.navigate('/login');
};

window.addEventListener("popstate", router);

document.body.addEventListener("click", e => {
    if (e.target.matches("[data-link]")) {
        e.preventDefault();
        window.history.pushState({}, "", e.target.href);
        router();
    }
});

onAuthStateChanged(window.auth, (user) => {
    const path = window.location.pathname;
    
    if (!user && path.startsWith('/admin')) {
        window.history.pushState({}, "", "/login");
        router();
    } else if (user && path === '/login') {
        window.history.pushState({}, "", "/admin");
        router();
    } else {
        router();
    }
});

window.router = { 
    navigate: (path) => { 
        window.history.pushState({}, "", path); 
        router(); 
    } 
};
