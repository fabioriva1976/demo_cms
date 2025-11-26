import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

export function initLoginPage(router) {
    console.log("Pagina Login inizializzata.");

    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            try {
                await signInWithEmailAndPassword(window.auth, email, password);
                // Il listener onAuthStateChanged nel router rileverà il cambio
                // di stato e reindirizzerà automaticamente a /admin.
            } catch (error) {
                console.error("Errore di login:", error);
                if (errorMessage) errorMessage.textContent = "Credenziali non valide. Riprova.";
            }
        });
    }
}