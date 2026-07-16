// Génère un tableau HTML générique (en-têtes, lignes, état vide) à partir de colonnes et de lignes de données
export function renderTable({ columns, rows, emptyMessage = "Aucune donnée disponible." }) {
  if (!rows || rows.length === 0) {
    return `
      <div class="af-animate-fade flex flex-col items-center gap-3 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-14 text-center">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <i class="fa-solid fa-inbox text-xl"></i>
        </div>
        <p class="text-sm font-semibold text-slate-500">${emptyMessage}</p>
      </div>
    `;
  }

  const ALIGN_CLASSES = { center: "text-center", right: "text-right", left: "text-left" };
  const alignClass = (align) => ALIGN_CLASSES[align] || ALIGN_CLASSES.left;

  // Largeurs fixes définies par les pages (colonnes compactes : statut, actions, dates...)
  // Les colonnes sans largeur se partagent l'espace restant à parts égales.
  // N'agit qu'à partir de md (table-layout fixed) : en dessous, le tableau reste en
  // layout auto + scroll horizontal pour rester lisible sur mobile.
  const colgroup = columns
    .map((column) => `<col${column.width ? ` style="width:${column.width}"` : ""} />`)
    .join("");

  const headers = columns
    .map((column) => `<th class="whitespace-nowrap px-3 py-3.5 ${alignClass(column.align)} text-xs font-black uppercase tracking-[0.06em] text-white/90 md:whitespace-normal md:break-words md:text-[0.68rem] md:leading-tight md:tracking-[0.04em]">${column.label}</th>`)
    .join("");

  const body = rows
    .map((row) => {
      const cells = columns
        .map((column) => {
          const value = typeof column.render === "function" ? column.render(row) : row[column.key];
          return `<td class="px-3 py-3 ${alignClass(column.align)} align-middle text-sm text-slate-700 md:break-words">${value ?? "-"}</td>`;
        })
        .join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `
    <div class="af-table-wrap overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div class="max-h-[70vh] overflow-auto md:overflow-x-hidden">
        <table class="af-table w-full min-w-[720px] border-collapse md:min-w-0 md:table-fixed">
          <colgroup>${colgroup}</colgroup>
          <thead class="bg-gradient-to-r from-brand to-brand-dark">
            <tr>${headers}</tr>
          </thead>
          <tbody class="divide-y divide-slate-100">${body}</tbody>
        </table>
      </div>
    </div>
  `;
}

// Boutons d'action ronds réutilisés dans tous les tableaux (voir / modifier / supprimer)
export function actionButton({ icon, colorClass, title, attr }) {
  return `
    <button type="button" title="${title}" ${attr} class="af-btn-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}">
      <i class="fa-solid ${icon} text-xs"></i>
    </button>
  `;
}
