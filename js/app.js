import { renderSidebar, initSidebarEvents } from "./components/sidebar.js";
import { renderNavbar } from "./components/navbar.js";
import { navigate, initRouter } from "./router.js";
import { isAuthenticated } from "./services/authService.js";
import { renderLoginPage } from "./pages/loginPage.js";

// Injecte la barre latérale et la barre de navigation dans le DOM
function mountLayout() {
  document.getElementById("sidebarRoot").innerHTML = renderSidebar();
  document.getElementById("navbarRoot").innerHTML = renderNavbar();
}

// Gère l'ouverture/fermeture de la barre latérale sur mobile
function initSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const toggle = document.getElementById("sidebarToggle");

  const close = () => {
    if (sidebar) sidebar.classList.add("-translate-x-full");
    if (overlay) overlay.classList.add("hidden");
  };

  if (toggle) {
    toggle.addEventListener("click", () => {
      if (sidebar) sidebar.classList.remove("-translate-x-full");
      if (overlay) overlay.classList.remove("hidden");
    });
  }

  if (overlay) {
    overlay.addEventListener("click", close);
  }

  return { close };
}

// Associe la navigation entre pages aux boutons du menu latéral
function initNavigation(sidebar) {
  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", async () => {
      await navigate(button.dataset.page);
      if (window.innerWidth < 1024) sidebar.close();
    });
  });
}

// Point d'entrée de l'application : affiche la connexion ou lance l'interface principale
function startApp() {
  if (!isAuthenticated()) {
    renderLoginPage();
    return;
  }

  document.body.className = "min-h-screen bg-slate-100 font-sans text-slate-900";
  document.querySelector("main").className = "min-h-screen pt-16 lg:pl-72";
  document.getElementById("app").className = "px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8";

  mountLayout();
  initSidebarEvents();
  const sidebar = initSidebar();
  initNavigation(sidebar);
  initRouter();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
