import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

window.currentUser = null;
window.authReady = false;

onAuthStateChanged(window.auth, (user) => {
    window.currentUser = user;
    window.authReady = true;
    if (window.router && window.routerReady) {
        window.router.navigate(window.location.pathname);
    }
});

window.login = async (email, password) => {
    try {
        await signInWithEmailAndPassword(window.auth, email, password);
    } catch (error) {
        alert('Errore login: ' + error.message);
        throw error;
    }
};

window.logout = async () => {
    await signOut(window.auth);
    window.router.navigate('/');
};
