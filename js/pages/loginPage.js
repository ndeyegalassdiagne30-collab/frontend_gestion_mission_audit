import { login } from "../services/authService.js";

// Affiche la page de connexion 
export function renderLoginPage() {
  document.getElementById("sidebarRoot").innerHTML = "";
  document.getElementById("navbarRoot").innerHTML = "";

  document.body.className = "min-h-screen bg-slate-100 font-sans text-slate-900";
  document.querySelector("main").className = "min-h-screen pt-0 lg:pl-0";
  document.getElementById("app").className = "";

  document.getElementById("app").innerHTML = `
    <div class="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">

      <!-- Panneau gauche : illustration / mise en avant -->
      <div class="af-auth-panel relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div class="af-auth-grid"></div>
        <div class="af-auth-orb af-auth-orb--1 h-72 w-72" style="top: -6rem; left: -4rem;"></div>
        <div class="af-auth-orb af-auth-orb--2 h-56 w-56" style="bottom: -3rem; right: -3rem;"></div>
        <div class="af-auth-orb af-auth-orb--3 h-24 w-24" style="top: 45%; right: 12%;"></div>

        <div class="relative z-10 flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <i class="fa-solid fa-graduation-cap text-xl"></i>
          </div>
          <span class="text-xl font-extrabold tracking-tight">AuditFlow</span>
        </div>

        <div class="relative z-10 max-w-md">
          <span class="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/80 backdrop-blur-sm">
            <i class="fa-solid fa-shield-halved"></i> Plateforme d'audit sécurisée
          </span>
          <h1 class="text-4xl font-black leading-tight tracking-tight">
            Pilotez vos missions d'audit avec clarté.
          </h1>
          <p class="mt-4 text-base leading-7 text-white/70">
            Clients, missions, affectations et documents réunis dans un seul espace pensé pour les cabinets d'expertise comptable.
          </p>

          <div class="mt-10 grid gap-4">
            <div class="flex items-center gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <i class="fa-solid fa-briefcase"></i>
              </div>
              <p class="text-sm font-semibold text-white/85">Suivi en temps réel de l'avancement des missions</p>
            </div>
            <div class="flex items-center gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <i class="fa-solid fa-users"></i>
              </div>
              <p class="text-sm font-semibold text-white/85">Affectation simplifiée des auditeurs par client</p>
            </div>
            <div class="flex items-center gap-3 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <i class="fa-solid fa-file-shield"></i>
              </div>
              <p class="text-sm font-semibold text-white/85">Documents centralisés et sauvegardés </p>
            </div>
          </div>
        </div>

        <p class="relative z-10 text-xs font-medium text-white/50"></p>
      </div>

      <!-- Panneau droit : formulaire -->
      <div class="flex min-h-screen items-center justify-center bg-slate-50 p-6 sm:p-10">
        <div class="af-auth-card w-full max-w-md">
          <div class="mb-8 flex items-center gap-3 lg:hidden">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/30">
              <i class="fa-solid fa-graduation-cap"></i>
            </div>
            <span class="text-xl font-extrabold tracking-tight text-slate-950">AuditFlow</span>
          </div>

          <div class="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/60 sm:p-9">
            <div class="mb-8">
              <h2 class="text-2xl font-black tracking-tight text-slate-950">Bon retour parmi nous</h2>
              <p class="mt-2 text-sm text-slate-500">Connectez-vous pour accéder à votre espace de travail.</p>
            </div>

            <div id="loginError" class="mb-4 hidden rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600"></div>

            <form id="loginForm" novalidate class="grid gap-5">
              <div>
                <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="loginEmail">Email</label>
                <div class="af-search af-input relative flex items-center rounded-2xl border border-slate-200 bg-slate-50">
                  <i class="fa-solid fa-envelope pointer-events-none absolute left-4 text-sm text-slate-400"></i>
                  <input
                    class="w-full bg-transparent py-3.5 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                    type="email"
                    id="loginEmail"
                    placeholder="vous@cabinet-audit.sn"
                    autocomplete="email"
                  />
                </div>
                <p id="loginEmailError" class="mt-1.5 hidden text-xs font-semibold text-rose-500"></p>
              </div>

              <div>
                <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="loginPassword">Mot de passe</label>
                <div class="af-search af-input relative flex items-center rounded-2xl border border-slate-200 bg-slate-50">
                  <i class="fa-solid fa-lock pointer-events-none absolute left-4 text-sm text-slate-400"></i>
                  <input
                    class="w-full bg-transparent py-3.5 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                    type="password"
                    id="loginPassword"
                    placeholder="••••••••••••"
                    autocomplete="current-password"
                  />
                </div>
                <p id="loginPasswordError" class="mt-1.5 hidden text-xs font-semibold text-rose-500"></p>
              </div>

              <button
                type="submit"
                id="loginBtn"
                class="af-btn-primary mt-2 flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-extrabold text-white disabled:cursor-not-allowed"
              >
                <i class="fa-solid fa-arrow-right-to-bracket"></i>
                <span>Se connecter</span>
              </button>
            </form>
          </div>

          <p class="mt-6 text-center text-xs font-medium text-slate-400">
      
          </p>
        </div>
      </div>
    </div>
  `;

  bindLoginEvents();
}

// Gère la soumission du formulaire de connexion et l'affichage des erreurs
function bindLoginEvents() {
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const loginBtn = document.getElementById("loginBtn");
  const errorBox = document.getElementById("loginError");
  const emailError = document.getElementById("loginEmailError");
  const passwordError = document.getElementById("loginPasswordError");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    errorBox.classList.add("hidden");
    emailError.classList.add("hidden");
    passwordError.classList.add("hidden");

    const email = emailInput.value.trim();
    const motDePasse = passwordInput.value;

    let hasErrors = false;

    if (!email) {
      emailError.textContent = "L'email est requis";
      emailError.classList.remove("hidden");
      hasErrors = true;
    }

    if (!motDePasse) {
      passwordError.textContent = "Le mot de passe est requis";
      passwordError.classList.remove("hidden");
      hasErrors = true;
    }

    if (hasErrors) return;

    const defaultBtnContent = loginBtn.innerHTML;
    loginBtn.disabled = true;
    loginBtn.innerHTML = `
      <div class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></div>
      <span>Connexion en cours...</span>
    `;

    try {
      await login(email, motDePasse);
      window.location.reload();
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.classList.remove("hidden");
    } finally {
      loginBtn.disabled = false;
      loginBtn.innerHTML = defaultBtnContent;
    }
  });
}
