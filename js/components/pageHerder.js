import { escapeHtml } from "../utils/html.js";

// Génère l'en-tête de page commun à toutes les pages
export function pageHeader({ title, actionLabel = null, actionId = null, actionIcon = "fa-plus" }) {
  const action = actionLabel
    ? `
      <button id="${escapeHtml(actionId)}" class="af-btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold text-white">
        <i class="fa-solid ${escapeHtml(actionIcon)}"></i>
        <span>${escapeHtml(actionLabel)}</span>
      </button>
    `
    : "";

  return `
    <header class="af-card mb-6 flex flex-col gap-4 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">${escapeHtml(title)}</h1>
      ${action}
    </header>
  `;
}

// Génère la barre de filtre (menu déroulant) affichée au-dessus des tableaux
export function renderFilterBar({ placeholder = "---Sélectionner par---", options = [] }) {
  const optionsHtml = options
    .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
    .join("");

  return `
    <div class="mb-6 flex flex-col gap-4 rounded-[2rem] bg-gradient-to-r from-brand via-brand to-brand-dark p-5 shadow-lg shadow-brand/20 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-2 text-sm font-bold text-white">
        <span class="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
          <i class="fa-solid fa-filter text-xs"></i>
        </span>
        <span>Filtrer</span>
      </div>
      <select id="pageFilter" class="af-input w-full rounded-full border-0 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-white/30 sm:w-72">
        <option value="">${escapeHtml(placeholder)}</option>
        ${optionsHtml}
      </select>
    </div>
  `;
}
