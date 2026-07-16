let activeModal = null;

// Récupère le conteneur racine des fenêtres modales dans le DOM
function getRoot() {
  let root = document.getElementById("modalRoot");
  if (!root) {
    root = document.createElement("div");
    root.id = "modalRoot";
    document.body.appendChild(root);
  }
  return root;
}

// Ouvre une fenêtre modale générique réutilisée pour les formulaires de création/édition
export function openModal({
  title,
  icon = "fa-circle-info",
  iconClass = "bg-brand/10 text-brand",
  body = "",
  confirmLabel = "Enregistrer",
  confirmIcon = "fa-floppy-disk",
  confirmClass = "",
  cancelLabel = "Annuler",
  onConfirm = null,
  onMount = null,
}) {
  closeModal();

  const lastFocused = document.activeElement;

  const overlay = document.createElement("div");
  overlay.className = "af-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  overlay.innerHTML = `
    <div class="af-modal-panel w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
      <div class="mb-5 flex items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}">
            <i class="fa-solid ${icon}"></i>
          </div>
          <h2 class="truncate text-xl font-black tracking-tight text-slate-950">${title}</h2>
        </div>
        <button type="button" data-modal-close class="af-btn-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Fermer">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <form data-modal-form class="grid gap-4">
        ${body}
        <div class="mt-2 flex justify-end gap-3">
          <button type="button" data-modal-cancel class="af-btn-ghost rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">${cancelLabel}</button>
          <button type="submit" data-modal-submit class="af-btn-primary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold text-white ${confirmClass}">
            <i class="fa-solid ${confirmIcon}"></i>
            <span>${confirmLabel}</span>
          </button>
        </div>
      </form>
    </div>
  `;

  getRoot().appendChild(overlay);

  function close() {
    overlay.remove();
    document.removeEventListener("keydown", onKeydown);
    activeModal = null;
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

  overlay.querySelector("[data-modal-close]").addEventListener("click", close);
  overlay.querySelector("[data-modal-cancel]").addEventListener("click", close);

  overlay.querySelector("[data-modal-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (typeof onConfirm !== "function") {
      close();
      return;
    }

    const submitBtn = overlay.querySelector("[data-modal-submit]");
    const originalContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<div class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></div><span>Enregistrement...</span>`;

    try {
      const result = await onConfirm(overlay);
      if (result === false) return;
      close();
    } finally {
      if (document.contains(submitBtn)) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
      }
    }
  });

  document.addEventListener("keydown", onKeydown);
  activeModal = { close };

  if (typeof onMount === "function") {
    onMount(overlay);
  } else {
    const target = overlay.querySelector("input, select, textarea");
    if (target) target.focus();
  }

  return { close };
}

// Ferme la fenêtre modale actuellement ouverte
export function closeModal() {
  if (activeModal) activeModal.close();
}
