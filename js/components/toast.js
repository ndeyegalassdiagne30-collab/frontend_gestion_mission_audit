let timer = null;

// Affiche une notification temporaire 
export function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;

  clearTimeout(timer);

  const icon = type === "error" ? "fa-circle-exclamation" : "fa-circle-check";

  toast.innerHTML = `
    <span class="inline-flex items-center gap-3">
      <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
        <i class="fa-solid ${icon} text-sm"></i>
      </span>
      <span>${message}</span>
    </span>
  `;

  const typeClasses = type === "error"
    ? "bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-rose-500/30"
    : "bg-gradient-to-r from-brand-light to-brand-dark text-white shadow-brand/40";

  toast.className = `af-toast pointer-events-auto fixed right-5 top-20 z-50 block max-w-sm rounded-2xl px-4 py-3.5 text-sm font-semibold shadow-2xl ${typeClasses}`;

  timer = setTimeout(() => {
    toast.className = "pointer-events-none fixed right-5 top-20 z-50 hidden max-w-sm rounded-2xl px-4 py-3.5 text-sm font-semibold shadow-2xl";
  }, 2800);
}
