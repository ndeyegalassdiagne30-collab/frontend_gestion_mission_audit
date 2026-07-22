import { showToast } from "./components/toast.js";
import { renderDashboardPage } from "./pages/dashboardPage.js";
import { renderClientPage } from "./pages/clientPage.js";
import { renderMissionPage } from "./pages/missionPage.js";
import { renderAffectationPage } from "./pages/affectationPage.js";
import { renderDocumentPage } from "./pages/documentPage.js";
import { renderUserPage } from "./pages/userPage.js";
import { renderJournalActivitePage } from "./pages/journa_activitePage.js";
import { renderProfilePage } from "./pages/profilePage.js";
import { isAdmin, isExpertComptable, isAuditeur, isClient, isAuthenticated } from "./services/authService.js";
import { renderLoginPage } from "./pages/loginPage.js";
import { API_BASE_URL } from "./config/api.js";

const routes = {
  dashboard: renderDashboardPage,
  clients: renderClientPage,
  missions: renderMissionPage,
  affectations: renderAffectationPage,
  documents: renderDocumentPage,
  utilisateurs: renderUserPage,
  journal: renderJournalActivitePage,
  profil: renderProfilePage,
};

// Retourne la page affichée par défaut après connexion
function getDefaultPage() {
  if (isClient())
    return "missions";
  return "dashboard";
}

// Vérifie si l'utilisateur connecté a le droit d'accéder à la page demandée
function isPageAllowed(page) {
  if (page === "profil")
    return true;
  if (page === "missions")
    return isAdmin() || isExpertComptable() || isAuditeur() || isClient();
  if (["dashboard", "documents"].includes(page))
    return isAdmin() || isExpertComptable() || isAuditeur();
  if (page === "clients")
    return isAdmin() || isExpertComptable();
  if (page === "affectations")
    return isExpertComptable();
  if (["utilisateurs", "journal"].includes(page))
    return isAdmin();
  return false;
}

// Lit la page courante depuis les paramètres de l'URL
function getPageFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("page") || getDefaultPage();
}

// Met à jour l'URL du navigateur avec la page courante sans recharger la page
function updateURL(page) {
  const url = new URL(window.location);
  url.searchParams.set("page", page);
  window.history.pushState({ page }, "", url);
}

// Change de page : vérifie les droits d'accès, affiche un état de chargement puis rend la page demandée
export async function navigate(page, { pushState = true } = {}) {
  if (!page) page = getDefaultPage();

  if (!isPageAllowed(page)) {
    page = getDefaultPage();
  }

  if (pushState) {
    updateURL(page);
  }

  const app = document.getElementById("app");
  const route = routes[page] || routes[getDefaultPage()];

  document.querySelectorAll("[data-page]").forEach((button) => {
    const isActive = button.dataset.page === page;
    button.classList.toggle("is-active", isActive);
  });

  app.innerHTML = `
    <div class="grid min-h-[50vh] place-items-center rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
      <div>
        <div class="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand"></div>
        <p class="mt-4 text-sm font-bold text-slate-500">Chargement...</p>
      </div>
    </div>
  `;

  try {
    await route();
  } catch (error) {
    app.innerHTML = `
      <section class="rounded-[2rem] border border-rose-200 bg-white p-8 shadow-sm">
        <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h1 class="text-2xl font-black tracking-tight text-slate-950">Erreur de chargement</h1>
        <p class="mt-2 text-sm leading-6 text-slate-600">${error.message}</p>
        <p class="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          Vérifie ta connexion internet et que l'API (<code class="font-mono text-xs">${API_BASE_URL}</code>) est bien accessible.
        </p>
      </section>
    `;
    showToast(error.message, "error");
  }
}

// Gère les boutons précédent/suivant du navigateur en réaffichant la page correspondante
window.addEventListener("popstate", (event) => {
  if (!isAuthenticated()) {
    renderLoginPage();
    return;
  }

  const page = event.state?.page || getPageFromURL();
  navigate(page, { pushState: false });
});

// Initialise le routage au démarrage de l'application en affichant la page de l'URL courante
export function initRouter() {
  const page = getPageFromURL();
  navigate(page);
}
