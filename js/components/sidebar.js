import { isAdmin, isExpertComptable, logout } from "../services/authService.js";

const ADMIN_LINKS = [
  { page: "dashboard", label: "Tableau de bord", icon: "fa-table-cells-large" },
  { page: "utilisateurs", label: "Utilisateurs", icon: "fa-user" },
  { page: "journal", label: "Journal d'activité", icon: "fa-list-check" },
  { page: "clients", label: "Clients", icon: "fa-users" },
  { page: "missions", label: "Mission d'audit", icon: "fa-briefcase" },
  { page: "documents", label: "Documents", icon: "fa-file-lines" },
  { page: "profil", label: "Mon profil", icon: "fa-circle-user" },
];

const EXPERT_LINKS = [
  { page: "dashboard", label: "Tableau de bord", icon: "fa-table-cells-large" },
  { page: "clients", label: "Clients", icon: "fa-users" },
  { page: "missions", label: "Mission d'audit", icon: "fa-briefcase" },
  { page: "affectations", label: "Affectation des auditeurs", icon: "fa-user-check" },
  { page: "documents", label: "Documents", icon: "fa-file-lines" },
  { page: "profil", label: "Mon profil", icon: "fa-circle-user" },
];

const AUDITEUR_LINKS = [
  { page: "dashboard", label: "Tableau de bord", icon: "fa-table-cells-large" },
  { page: "missions", label: "Mes missions", icon: "fa-briefcase" },
  { page: "documents", label: "Documents", icon: "fa-file-lines" },
  { page: "profil", label: "Mon profil", icon: "fa-circle-user" },
];

// Retourne les liens de navigation autorisés selon le rôle de l'utilisateur connecté
function getLinks() {
  if (isAdmin()) 
    return ADMIN_LINKS;
  if (isExpertComptable()) 
    return EXPERT_LINKS;
  return AUDITEUR_LINKS;
}

// Génère le HTML de la barre latérale de navigation
export function renderSidebar() {
  const links = getLinks();

  const items = links.map((link) => `
    <button class="af-nav-link nav-link flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold" data-page="${link.page}">
      <i class="fa-solid ${link.icon} w-5 text-center text-[15px]"></i>
      <span>${link.label}</span>
    </button>
  `).join("");

  return `
    <aside id="sidebar" class="af-sidebar fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col shadow-2xl transition-transform duration-300 lg:translate-x-0">
      <div class="flex items-center gap-3 px-6 py-6">
        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand shadow-lg">
          <i class="fa-solid fa-graduation-cap text-lg"></i>
        </div>
        <div class="min-w-0">
          <h1 class="truncate text-lg font-extrabold tracking-tight text-white">AuditFlow</h1>
          <p class="truncate text-xs text-white/55">Gestion des missions d'audit</p>
        </div>
      </div>

      <div class="mx-6 mb-2 h-px bg-white/10"></div>

      <nav class="flex-1 grid content-start gap-1.5 overflow-y-auto px-4 py-4" aria-label="Navigation principale">
      ${items}
      </nav>

      <div class="mx-6 h-px bg-white/10"></div>

      <div class="px-4 py-5">
        <button id="logoutBtn" class="af-nav-link flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold">
          <i class="fa-solid fa-arrow-right-from-bracket w-5 text-center text-[15px]"></i>
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>

    <div id="sidebarOverlay" class="fixed inset-0 z-30 hidden bg-slate-950/40 backdrop-blur-sm lg:hidden"></div>
  `;
}

// Associe le bouton de déconnexion à son action
export function initSidebarEvents() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
}
