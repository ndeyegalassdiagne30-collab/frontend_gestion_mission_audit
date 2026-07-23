import { escapeHtml } from "../utils/html.js";

// Génère un sélecteur multiple : un champ affichant les auditeurs
// choisis sous forme de puces retirables, qui ouvre au clic une liste à cocher.
// Les cases à cocher gardent l'attribut data-auditeur-checkbox : le code appelant
// (missionPage.js, affectationPage.js) continue de lire la sélection avec
// `querySelectorAll("[data-auditeur-checkbox]:checked")` sans rien changer.
export function renderAuditeurSelect(auditeurs, selected = []) {
  const options = auditeurs.map((a) => `
    <label class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
      <input
        type="checkbox"
        value="${a.id}"
        data-name="${escapeHtml(a.prenom)} ${escapeHtml(a.nom)}"
        ${selected.some((id) => id == a.id) ? "checked" : ""}
        class="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
        data-auditeur-checkbox
      />
      ${escapeHtml(a.prenom)} ${escapeHtml(a.nom)}
    </label>
  `).join("");

  return `
    <div class="relative" data-auditeur-select>
      <button
        type="button"
        data-auditeur-trigger
        class="af-input flex min-h-[3rem] w-full flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10"
      >
        <span data-auditeur-chips class="flex flex-1 flex-wrap items-center gap-1.5"></span>
        <i class="fa-solid fa-chevron-down shrink-0 text-xs text-slate-400 transition" data-auditeur-caret></i>
      </button>

      <div
        data-auditeur-dropdown
        class="af-animate-fade absolute left-0 right-0 top-[calc(100%+6px)] z-20 hidden max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
      >
        ${options || `<p class="px-3 py-2 text-sm text-slate-500">Aucun auditeur disponible.</p>`}
      </div>
    </div>
  `;
}

// Branche l'interactivité (ouverture/fermeture, puces, retrait) sur chaque sélecteur
// présent dans `root`. À rappeler après tout remplacement du HTML du formulaire
// (ex: réaffichage après erreur de validation).
export function initAuditeurSelect(root) {
  root.querySelectorAll("[data-auditeur-select]").forEach((wrapper) => {
    const trigger = wrapper.querySelector("[data-auditeur-trigger]");
    const caret = wrapper.querySelector("[data-auditeur-caret]");
    const dropdown = wrapper.querySelector("[data-auditeur-dropdown]");
    const chipsBox = wrapper.querySelector("[data-auditeur-chips]");
    const checkboxes = () => wrapper.querySelectorAll("[data-auditeur-checkbox]");

    function syncChips() {
      const checked = Array.from(checkboxes()).filter((cb) => cb.checked);

      chipsBox.innerHTML = checked.length
        ? checked.map((cb) => `
            <span class="inline-flex items-center gap-1.5 rounded-full bg-brand/10 py-1 pl-3 pr-1.5 text-xs font-semibold text-brand">
              ${escapeHtml(cb.dataset.name)}
              <button type="button" data-auditeur-remove="${cb.value}" title="Retirer" class="flex h-4 w-4 items-center justify-center rounded-full text-brand/70 transition hover:bg-brand/20 hover:text-brand">
                <i class="fa-solid fa-xmark text-[10px]"></i>
              </button>
            </span>
          `).join("")
        : `<span class="py-1 text-sm text-slate-400">Sélectionner des auditeurs</span>`;

      chipsBox.querySelectorAll("[data-auditeur-remove]").forEach((removeBtn) => {
        removeBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          const target = Array.from(checkboxes()).find((cb) => cb.value === removeBtn.dataset.auditeurRemove);
          if (target) {
            target.checked = false;
            syncChips();
          }
        });
      });
    }

    function openDropdown() {
      dropdown.classList.remove("hidden");
      caret.classList.add("rotate-180");
    }

    function closeDropdown() {
      dropdown.classList.add("hidden");
      caret.classList.remove("rotate-180");
    }

    trigger.addEventListener("click", () => {
      dropdown.classList.contains("hidden") ? openDropdown() : closeDropdown();
    });

    checkboxes().forEach((cb) => cb.addEventListener("change", syncChips));

    document.addEventListener("click", (event) => {
      if (!wrapper.contains(event.target)) closeDropdown();
    });

    syncChips();
  });
}
