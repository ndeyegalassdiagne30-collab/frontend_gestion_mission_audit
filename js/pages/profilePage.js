import { pageHeader } from "../components/pageHerder.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { updateUser } from "../services/userService.js";
import { uploadToCloudinary } from "../services/cloudinary.js";
import { getCurrentUser, updateCurrentUser } from "../services/authService.js";

const ROLE_LABELS = {
  administrateur: "Administrateur",
  expert_comptable: "Expert-comptable",
  auditeur: "Auditeur",
};

// Affiche la page de profil de l'utilisateur connecté (infos personnelles, photo, mot de passe)
export async function renderProfilePage() {
  const app = document.getElementById("app");
  const user = getCurrentUser();

  const hasPhoto = user.photo?.startsWith("http");
  const initiales = `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase();

  app.innerHTML = `
    <section>
      ${pageHeader({ title: "Mon profil" })}

      <article class="af-card mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div id="profileError" class="mb-4 hidden rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600"></div>

        <div class="mb-6 flex items-center gap-4">
          ${hasPhoto
            ? `<img src="${escapeHtml(user.photo)}" alt="Photo de profil" class="af-avatar-ring h-16 w-16 rounded-full object-cover" />`
            : `<div class="af-avatar-ring flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-lg font-black text-brand">${escapeHtml(initiales)}</div>`}
          <div>
            <p class="text-lg font-black text-slate-950">${escapeHtml(user.prenom)} ${escapeHtml(user.nom)}</p>
            <span class="af-badge rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">${ROLE_LABELS[user.role] || user.role}</span>
          </div>
        </div>

        <form id="profileForm" class="grid gap-4" novalidate>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="profileNom">Nom *</label>
              <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="text" id="profileNom" value="${escapeHtml(user.nom)}" />
            </div>
            <div>
              <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="profilePrenom">Prénom *</label>
              <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="text" id="profilePrenom" value="${escapeHtml(user.prenom)}" />
            </div>
          </div>

          <div>
            <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="profileEmail">Email *</label>
            <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="email" id="profileEmail" value="${escapeHtml(user.email)}" />
          </div>

          <div>
            <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="profileTelephone">Téléphone *</label>
            <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="text" id="profileTelephone" value="${escapeHtml(user.telephone)}" />
          </div>

          <div>
            <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="profilePhoto">Photo de profil</label>
            <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-bold file:text-brand focus:border-brand focus:ring-4 focus:ring-brand/10" type="file" id="profilePhoto" accept="image/*" />
          </div>

          <div>
            <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="profileMotDePasse">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
            <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="password" id="profileMotDePasse" placeholder="••••••••" autocomplete="new-password" />
          </div>

          <div class="mt-2 flex justify-end gap-3">
            <button type="submit" id="profileSaveBtn" class="af-btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold text-white disabled:cursor-not-allowed">
              <i class="fa-solid fa-floppy-disk"></i>
              <span>Enregistrer</span>
            </button>
          </div>
        </form>
      </article>
    </section>
  `;

  bindProfileEvents(user);
}

// Gère la soumission du formulaire de modification du profil (upload photo, mise à jour, session locale)
function bindProfileEvents(user) {
  const form = document.getElementById("profileForm");
  const errorBox = document.getElementById("profileError");
  const saveBtn = document.getElementById("profileSaveBtn");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorBox.classList.add("hidden");

    const data = {
      nom: document.getElementById("profileNom").value.trim(),
      prenom: document.getElementById("profilePrenom").value.trim(),
      email: document.getElementById("profileEmail").value.trim(),
      telephone: document.getElementById("profileTelephone").value.trim(),
      role: user.role,
      photo: user.photo || "",
      mot_de_passe: document.getElementById("profileMotDePasse").value,
    };
    const photoFile = document.getElementById("profilePhoto").files[0];

    if (!data.nom || !data.prenom || !data.email || !data.telephone) {
      errorBox.textContent = "Tous les champs marqués d'un * sont obligatoires.";
      errorBox.classList.remove("hidden");
      return;
    }

    saveBtn.disabled = true;
    saveBtn.innerHTML = `<div class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></div><span>Enregistrement...</span>`;

    try {
      if (photoFile) {
        const uploaded = await uploadToCloudinary(photoFile);
        data.photo = uploaded.url;
      }

      const updated = await updateUser(user.id, data, user.id);
      updateCurrentUser({ ...user, ...updated });
      showToast("Profil mis à jour avec succès.");
      window.location.reload();
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.classList.remove("hidden");
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="fa-solid fa-floppy-disk"></i><span>Enregistrer</span>`;
    }
  });
}
