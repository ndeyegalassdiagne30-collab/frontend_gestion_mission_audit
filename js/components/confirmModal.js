let activeConfirm = null;

// Récupèrele conteneur racine des fenêtres modales dans le DOM
function getRoot() {
  let root = document.getElementById("modalRoot");
  if (!root) {
    root = document.createElement("div");
    root.id = "modalRoot";
    document.body.appendChild(root);
  }
  return root;
}

// Dialogue de confirmation utilisé avant chaque suppression 
export function openConfirmModal(message, onConfirm) {
  closeConfirmModal();

  const lastFocused = document.activeElement;

  const overlay = document.createElement("div");
  overlay.className = "af-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md";
  overlay.setAttribute("role", "alertdialog");
  overlay.setAttribute("aria-modal", "true");

  overlay.innerHTML = `
    <div class="af-modal-panel w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
      <div class="mb-4 flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h2 class="text-xl font-black tracking-tight text-slate-950">Confirmation</h2>
      </div>
      <p class="text-sm leading-6 text-slate-600">${message}</p>
      <div class="mt-6 flex justify-end gap-3">
        <button type="button" data-confirm-cancel class="af-btn-ghost rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Annuler</button>
        <button type="button" data-confirm-accept class="af-btn-icon inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-rose-200 transition hover:bg-rose-700">
          <i class="fa-solid fa-trash"></i>
          <span>Supprimer</span>
        </button>
      </div>
    </div>
  `;

  getRoot().appendChild(overlay);

  function close() {
    overlay.remove();
    document.removeEventListener("keydown", onKeydown);
    activeConfirm = null;
    if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus();
    }
  }

  function onKeydown(event) {
    if (event.key === "Escape") close();
  }

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });

  overlay.querySelector("[data-confirm-cancel]").addEventListener("click", close);

  overlay.querySelector("[data-confirm-accept]").addEventListener("click", async () => {
    const acceptBtn = overlay.querySelector("[data-confirm-accept]");
    acceptBtn.disabled = true;
    acceptBtn.innerHTML = `<div class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></div>`;

    if (typeof onConfirm === "function") {
      await onConfirm();
    }

    close();
  });

  document.addEventListener("keydown", onKeydown);
  activeConfirm = { close };
  overlay.querySelector("[data-confirm-accept]").focus();
}

// Ferme la fenêtre de confirmation actuellement ouverte
export function closeConfirmModal() {
  if (activeConfirm) activeConfirm.close();
}
