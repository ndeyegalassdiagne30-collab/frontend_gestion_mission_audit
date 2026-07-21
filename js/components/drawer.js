let activeDrawer = null;

// Récupère (ou crée) le conteneur racine des panneaux/fenêtres modales dans le DOM
function getRoot() {
  let root = document.getElementById("modalRoot");
  if (!root) {
    root = document.createElement("div");
    root.id = "modalRoot";
    document.body.appendChild(root);
  }
  return root;
}

// Ouvre un panneau latéral (Drawer) réutilisé pour la consultation, la création et la modification
// dans toute l'application (les popups de confirmation restent gérées par confirmModal.js)
export function openDrawer({
  title,
  subtitle = "",
  icon = "fa-circle-info",
  iconClass = "bg-brand/10 text-brand",
  body = "",
  footer = null,
  confirmLabel = "Enregistrer",
  confirmIcon = "fa-floppy-disk",
  confirmClass = "",
  cancelLabel = "Annuler",
  onConfirm = null,
  onMount = null,
}) {
  closeDrawer();

  const lastFocused = document.activeElement;
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden"; // empêche le scroll de la page tant que le drawer est ouvert

  let closed = false;

  const wrapper = document.createElement("div");
  wrapper.className = "fixed inset-0 z-50";
  wrapper.setAttribute("role", "dialog");
  wrapper.setAttribute("aria-modal", "true");

  wrapper.innerHTML = `
    <div data-drawer-overlay class="af-drawer-overlay absolute inset-0 bg-slate-950/60 opacity-0 backdrop-blur-sm"></div>

    <div data-drawer-panel class="af-drawer-panel absolute right-0 top-0 flex h-full w-full translate-x-full flex-col rounded-l-2xl bg-white shadow-2xl sm:w-[75%] lg:w-[40%] lg:min-w-[420px]">
      <div class="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
        <div class="flex min-w-0 items-center gap-3">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}">
            <i class="fa-solid ${icon}"></i>
          </div>
          <div class="min-w-0">
            <h2 class="truncate text-xl font-black tracking-tight text-slate-950">${title}</h2>
            ${subtitle ? `<p class="truncate text-sm text-slate-500">${subtitle}</p>` : ""}
          </div>
        </div>
        <button type="button" data-drawer-close class="af-btn-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Fermer">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <form data-drawer-form class="grid flex-1 content-start gap-4 overflow-y-auto px-6 py-5">
        ${body}
        ${footer || `
          <div class="mt-2 flex justify-end gap-3">
            <button type="button" data-drawer-cancel class="af-btn-ghost rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">${cancelLabel}</button>
            <button type="submit" data-drawer-submit class="af-btn-primary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold text-white ${confirmClass}">
              <i class="fa-solid ${confirmIcon}"></i>
              <span>${confirmLabel}</span>
            </button>
          </div>
        `}
      </form>
    </div>
  `;

  getRoot().appendChild(wrapper);

  const overlayEl = wrapper.querySelector("[data-drawer-overlay]");
  const panelEl = wrapper.querySelector("[data-drawer-panel]");

  // Force le navigateur à peindre l'état de départ avant de retirer les classes de départ,
  // sinon la transition d'entrée (fade + glissement) ne se joue pas.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      overlayEl.classList.remove("opacity-0");
      panelEl.classList.remove("translate-x-full");
    });
  });

  function close() {
    if (closed) return;
    closed = true;

    overlayEl.classList.add("opacity-0");
    panelEl.classList.add("translate-x-full");
    document.removeEventListener("keydown", onKeydown);
    document.body.style.overflow = previousOverflow;
    activeDrawer = null;

    setTimeout(() => {
      wrapper.remove();
      if (lastFocused && document.contains(lastFocused)) {
        lastFocused.focus();
      }
    }, 300);
  }

  function onKeydown(event) {
    if (event.key === "Escape") close();
  }

  overlayEl.addEventListener("click", close);
  wrapper.querySelector("[data-drawer-close]").addEventListener("click", close);
  wrapper.querySelector("[data-drawer-cancel]")?.addEventListener("click", close);

  wrapper.querySelector("[data-drawer-form]").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (typeof onConfirm !== "function") {
      close();
      return;
    }

    const submitBtn = wrapper.querySelector("[data-drawer-submit]");
    const originalContent = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<div class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></div><span>Enregistrement...</span>`;
    }

    try {
      const result = await onConfirm(wrapper);
      if (result === false) return;
      close();
    } finally {
      if (submitBtn && document.contains(submitBtn)) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalContent;
      }
    }
  });

  document.addEventListener("keydown", onKeydown);
  activeDrawer = { close };

  if (typeof onMount === "function") {
    onMount(wrapper);
  } else {
    const target = wrapper.querySelector("input, select, textarea");
    if (target) target.focus();
  }

  return { close };
}

// Ferme le drawer actuellement ouvert, s'il y en a un
export function closeDrawer() {
  if (activeDrawer) activeDrawer.close();
}
