import { pageHeader } from "../components/pageHerder.js";
import { openDrawer, closeDrawer } from "../components/drawer.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { updateUser } from "../services/userService.js";
import { uploadToCloudinary } from "../services/cloudinary.js";
import { getCurrentUser, updateCurrentUser } from "../services/authService.js";

const ROLE_LABELS = {
  administrateur: "Administrateur",
  expert_comptable: "Expert-comptable",
  auditeur: "Auditeur",
  client: "Client",
};

// Génère le formulaire de modification du profil (infos personnelles, photo, mot de passe)
function profileFormBody(user, errors = {}) {
  return `
    <div>
      <div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="profileNom">Nom *</label>
          <input class="w-full rounded-2xl border ${errors.nom ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="text" id="profileNom" value="${escapeHtml(user.nom || "")}" />
          ${errors.nom ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.nom}</p>` : ""}
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="profilePrenom">Prénom *</label>
          <input class="w-full rounded-2xl border ${errors.prenom ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="text" id="profilePrenom" value="${escapeHtml(user.prenom || "")}" />
          ${errors.prenom ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.prenom}</p>` : ""}
        </div>
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="profileEmail">Email *</label>
        <input class="w-full rounded-2xl border ${errors.email ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="email" id="profileEmail" value="${escapeHtml(user.email || "")}" />
        ${errors.email ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.email}</p>` : ""}
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="profileTelephone">Téléphone *</label>
        <input class="w-full rounded-2xl border ${errors.telephone ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="text" id="profileTelephone" value="${escapeHtml(user.telephone || "")}" />
        ${errors.telephone ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.telephone}</p>` : ""}
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="profilePhoto">Photo de profil</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-bold file:text-brand focus:border-brand focus:ring-4 focus:ring-brand/10" type="file" id="profilePhoto" accept="image/*" />
      </div>

      <div class="mb-2">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="profileMotDePasse">Nouveau mot de passe (laisser vide pour ne pas changer)</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="password" id="profileMotDePasse" placeholder="••••••••" autocomplete="new-password" />
      </div>
    </div>
  `;
}

// Génère les boutons Annuler/Enregistrer réaffichés dans le formulaire après une erreur de validation
function defaultButtons() {
  return `
    <div class="mt-2 flex justify-end gap-3">
      <button type="button" data-drawer-cancel class="af-btn-ghost rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Annuler</button>
      <button type="submit" data-drawer-submit class="af-btn-primary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold text-white">
        <i class="fa-solid fa-floppy-disk"></i>
        <span>Enregistrer</span>
      </button>
    </div>
  `;
}

// Ouvre le drawer de modification du profil de l'utilisateur connecté
function openProfileForm(user) {
  openDrawer({
    title: "Modifier mon profil",
    icon: "fa-user-pen",
    body: profileFormBody(user),
    confirmLabel: "Enregistrer",
    onConfirm: async (drawerElement) => {
      const data = {
        nom: drawerElement.querySelector("#profileNom").value.trim(),
        prenom: drawerElement.querySelector("#profilePrenom").value.trim(),
        email: drawerElement.querySelector("#profileEmail").value.trim(),
        telephone: drawerElement.querySelector("#profileTelephone").value.trim(),
        role: user.role,
        photo: user.photo || "",
        mot_de_passe: drawerElement.querySelector("#profileMotDePasse").value,
      };
      const photoFile = drawerElement.querySelector("#profilePhoto")?.files[0];

      const errors = {};
      if (!data.nom) errors.nom = "Le nom est requis";
      if (!data.prenom) errors.prenom = "Le prénom est requis";
      if (!data.email) errors.email = "L'email est requis";
      if (!data.telephone) errors.telephone = "Le téléphone est requis";

      if (Object.keys(errors).length > 0) {
        const formEl = drawerElement.querySelector("[data-drawer-form]");
        formEl.innerHTML = profileFormBody({ ...user, ...data }, errors) + defaultButtons();
        formEl.querySelector("[data-drawer-cancel]").addEventListener("click", closeDrawer);
        return false;
      }

      try {
        if (photoFile) {
          const uploaded = await uploadToCloudinary(photoFile);
          data.photo = uploaded.url;
        }

        const updated = await updateUser(user.id, data, user.id);
        updateCurrentUser({ ...user, ...updated });
        showToast("Profil mis à jour avec succès.");
        window.location.reload();
        return true;
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    },
  });
}

// Affiche la page de profil de l'utilisateur connecté (lecture seule + accès à la modification via un drawer)
export async function renderProfilePage() {
  const app = document.getElementById("app");
  const user = getCurrentUser();

  const hasPhoto = user.photo?.startsWith("http");
  const initiales = `${user.prenom?.[0] || ""}${user.nom?.[0] || ""}`.toUpperCase();

  app.innerHTML = `
    <section>
      ${pageHeader({ title: "Mon profil" })}

      <article class="af-card mx-auto max-w-2xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div class="flex items-center gap-4">
          ${hasPhoto
            ? `<img src="${escapeHtml(user.photo)}" alt="Photo de profil" class="af-avatar-ring h-16 w-16 rounded-full object-cover" />`
            : `<div class="af-avatar-ring flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-lg font-black text-brand">${escapeHtml(initiales)}</div>`}
          <div>
            <p class="text-lg font-black text-slate-950">${escapeHtml(user.prenom)} ${escapeHtml(user.nom)}</p>
            <span class="af-badge rounded-full bg-brand/10 px-3 py-1 text-xs font-bold text-brand">${ROLE_LABELS[user.role] || user.role}</span>
          </div>
        </div>

        <div class="mt-6 grid gap-3 border-t border-slate-100 pt-6 text-sm text-slate-700">
          <p><strong class="text-slate-950">Email :</strong> ${escapeHtml(user.email)}</p>
          <p><strong class="text-slate-950">Téléphone :</strong> ${escapeHtml(user.telephone)}</p>
        </div>

        <div class="mt-6 flex justify-end">
          <button id="editProfileBtn" type="button" class="af-btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold text-white">
            <i class="fa-solid fa-pen"></i>
            <span>Modifier mon profil</span>
          </button>
        </div>
      </article>
    </section>
  `;

  document.getElementById("editProfileBtn").addEventListener("click", () => openProfileForm(user));
}
