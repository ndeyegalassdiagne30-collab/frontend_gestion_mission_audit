import { pageHeader, renderFilterBar } from "../components/pageHerder.js";
import { renderTable, actionButton } from "../components/table.js";
import { openDrawer, closeDrawer } from "../components/drawer.js";
import { openConfirmModal } from "../components/confirmModal.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { sameId } from "../utils/id.js";
import { createUser, deleteUser, getUsers, updateUser } from "../services/userService.js";
import { uploadToCloudinary } from "../services/cloudinary.js";
import { getCurrentUser } from "../services/authService.js";

const ROLE_LABELS = {
  administrateur: "Administrateur",
  expert_comptable: "Expert-comptable",
  auditeur: "Auditeur",
  client: "Client",
};

// Génère le formulaire de création/modification d'un utilisateur
function userFormBody(utilisateur, isEdit, errors = {}) {
  return `
    <div>
      <div class="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="userNom">Nom *</label>
          <input class="w-full rounded-2xl border ${errors.nom ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="text" id="userNom" value="${escapeHtml(utilisateur?.nom || "")}" autocomplete="off" />
          ${errors.nom ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.nom}</p>` : ""}
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="userPrenom">Prénom *</label>
          <input class="w-full rounded-2xl border ${errors.prenom ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="text" id="userPrenom" value="${escapeHtml(utilisateur?.prenom || "")}" autocomplete="off" />
          ${errors.prenom ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.prenom}</p>` : ""}
        </div>
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="userEmail">Email *</label>
        <input class="w-full rounded-2xl border ${errors.email ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="email" id="userEmail" value="${escapeHtml(utilisateur?.email || "")}" autocomplete="off" />
        ${errors.email ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.email}</p>` : ""}
      </div>

      <div class="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="userMotDePasse">Mot de passe ${isEdit ? "" : "*"}</label>
          <input class="w-full rounded-2xl border ${errors.mot_de_passe ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="password" id="userMotDePasse" placeholder="••••••••" autocomplete="new-password" />
          ${errors.mot_de_passe ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.mot_de_passe}</p>` : ""}
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="userMotDePasseConfirm">Confirmation ${isEdit ? "" : "*"}</label>
          <input class="w-full rounded-2xl border ${errors.mot_de_passe_confirm ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="password" id="userMotDePasseConfirm" placeholder="••••••••" autocomplete="new-password" />
          <p id="userMotDePasseConfirmError" class="mt-1 text-xs font-semibold text-rose-500 ${errors.mot_de_passe_confirm ? "" : "hidden"}">${errors.mot_de_passe_confirm || "Les mots de passe ne correspondent pas"}</p>
        </div>
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="userTelephone">Téléphone *</label>
        <input class="w-full rounded-2xl border ${errors.telephone ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="text" id="userTelephone" value="${escapeHtml(utilisateur?.telephone || "")}" autocomplete="off" />
        ${errors.telephone ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.telephone}</p>` : ""}
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="userRole">Rôle *</label>
        <select class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" id="userRole">
          <option value="administrateur" ${utilisateur?.role === "administrateur" ? "selected" : ""}>Administrateur</option>
          <option value="expert_comptable" ${utilisateur?.role === "expert_comptable" ? "selected" : ""}>Expert-comptable</option>
          <option value="auditeur" ${!utilisateur || utilisateur.role === "auditeur" ? "selected" : ""}>Auditeur</option>
        </select>
      </div>

      <div class="mb-2">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="userPhoto">Photo (optionnel)</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-bold file:text-brand focus:border-brand focus:ring-4 focus:ring-brand/10" type="file" id="userPhoto" accept="image/*" />
      </div>
    </div>
  `;
}

// Affiche/masque en direct le message "les mots de passe ne correspondent pas" pendant la saisie,
// sans attendre la soumission du formulaire
function bindPasswordMatchCheck(root, passwordId, confirmId, errorId) {
  const passwordInput = root.querySelector(`#${passwordId}`);
  const confirmInput = root.querySelector(`#${confirmId}`);
  const errorEl = root.querySelector(`#${errorId}`);
  if (!passwordInput || !confirmInput || !errorEl) return;

  function check() {
    const mismatch = confirmInput.value.length > 0 && passwordInput.value !== confirmInput.value;
    errorEl.classList.toggle("hidden", !mismatch);
    confirmInput.classList.toggle("border-rose-500", mismatch);
  }

  passwordInput.addEventListener("input", check);
  confirmInput.addEventListener("input", check);
}

// Génère les boutons Annuler/Enregistrer (ou Créer) réaffichés dans le formulaire après une erreur de validation
function defaultButtons(confirmLabel = "Enregistrer") {
  return `
    <div class="mt-2 flex justify-end gap-3">
      <button type="button" data-drawer-cancel class="af-btn-ghost rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Annuler</button>
      <button type="submit" data-drawer-submit class="af-btn-primary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold text-white">
        <i class="fa-solid fa-floppy-disk"></i>
        <span>${confirmLabel}</span>
      </button>
    </div>
  `;
}

// Ouvre le drawer de création ou modification d'un utilisateur (réservé à l'administrateur)
function openUserForm(utilisateur = null) {
  const isEdit = utilisateur !== null;
  const currentUserId = getCurrentUser().id;

  openDrawer({
    title: isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur",
    subtitle: isEdit ? `${utilisateur.prenom} ${utilisateur.nom}` : "",
    icon: "fa-user",
    body: userFormBody(utilisateur, isEdit),
    confirmLabel: isEdit ? "Enregistrer" : "Créer",
    onMount: (drawerElement) => {
      bindPasswordMatchCheck(drawerElement, "userMotDePasse", "userMotDePasseConfirm", "userMotDePasseConfirmError");
      drawerElement.querySelector("input, select, textarea")?.focus();
    },
    onConfirm: async (drawerElement) => {
      const data = {
        nom: drawerElement.querySelector("#userNom").value.trim(),
        prenom: drawerElement.querySelector("#userPrenom").value.trim(),
        email: drawerElement.querySelector("#userEmail").value.trim(),
        mot_de_passe: drawerElement.querySelector("#userMotDePasse").value,
        telephone: drawerElement.querySelector("#userTelephone").value.trim(),
        role: drawerElement.querySelector("#userRole").value,
        photo: utilisateur?.photo || "",
      };
      const motDePasseConfirm = drawerElement.querySelector("#userMotDePasseConfirm").value;
      const photoFile = drawerElement.querySelector("#userPhoto")?.files[0];

      const errors = {};
      if (!data.nom) errors.nom = "Le nom est requis";
      if (!data.prenom) errors.prenom = "Le prénom est requis";
      if (!data.email) errors.email = "L'email est requis";
      if (!isEdit && !data.mot_de_passe) errors.mot_de_passe = "Le mot de passe est requis";
      if (data.mot_de_passe && data.mot_de_passe !== motDePasseConfirm) {
        errors.mot_de_passe_confirm = "Les mots de passe ne correspondent pas";
      }
      if (!data.telephone) errors.telephone = "Le téléphone est requis";

      if (Object.keys(errors).length > 0) {
        const formEl = drawerElement.querySelector("[data-drawer-form]");
        formEl.innerHTML = userFormBody({ ...utilisateur, ...data }, isEdit, errors) + defaultButtons(isEdit ? "Enregistrer" : "Créer");
        formEl.querySelector("[data-drawer-cancel]").addEventListener("click", closeDrawer);
        bindPasswordMatchCheck(formEl, "userMotDePasse", "userMotDePasseConfirm", "userMotDePasseConfirmError");
        return false;
      }

      try {
        if (photoFile) {
          const uploaded = await uploadToCloudinary(photoFile);
          data.photo = uploaded.url;
        }

        if (isEdit) {
          await updateUser(utilisateur.id, data, currentUserId);
          showToast("Utilisateur modifié avec succès.");
        } else {
          await createUser(data, currentUserId);
          showToast("Utilisateur créé avec succès.");
        }
        await renderUserPage();
        return true;
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    },
  });
}

// Affiche la page de gestion des utilisateurs (liste, filtre par rôle, actions)
export async function renderUserPage() {
  const app = document.getElementById("app");
  let utilisateurs = [];

  try {
    utilisateurs = await getUsers();
  } catch (error) {
    showToast(error.message, "error");
  }

  app.innerHTML = `
    <section>
      ${pageHeader({
        title: "Liste des utilisateurs",
        actionLabel: "Nouvel utilisateur",
        actionId: "addUserBtn",
      })}

      ${renderFilterBar({
        placeholder: "---Sélectionner par rôle---",
        options: [
          { value: "administrateur", label: "Administrateur" },
          { value: "expert_comptable", label: "Expert-comptable" },
          { value: "auditeur", label: "Auditeur" },
        ],
      })}

      <article id="userTableWrapper"></article>
    </section>
  `;

  renderUserTable(utilisateurs);
  document.getElementById("addUserBtn").addEventListener("click", () => openUserForm());
  document.getElementById("pageFilter").addEventListener("change", (event) => {
    const value = event.target.value;
    const filtered = value ? utilisateurs.filter((u) => u.role === value) : utilisateurs;
    renderUserTable(filtered);
  });
}

// Génère et affiche le tableau des utilisateurs avec leurs actions (modifier, supprimer sauf soi-même)
function renderUserTable(utilisateurs) {
  const wrapper = document.getElementById("userTableWrapper");
  const currentUserId = getCurrentUser().id;

  wrapper.innerHTML = renderTable({
    rows: utilisateurs,
    emptyMessage: "Aucun utilisateur enregistré.",
    columns: [
      {
        label: "Photo",
        width: "72px",
        align: "center",
        render: (u) => u.photo?.startsWith("http")
          ? `<img src="${escapeHtml(u.photo)}" alt="${escapeHtml(u.prenom)}" class="af-avatar-ring mx-auto h-10 w-10 rounded-full object-cover" />`
          : `<div class="af-avatar-ring mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">${escapeHtml((u.prenom?.[0] || "") + (u.nom?.[0] || ""))}</div>`,
      },
      { label: "Nom", width: "14%", render: (u) => `<strong class="font-bold text-slate-950">${escapeHtml(u.nom)}</strong>` },
      { label: "Prénom", width: "14%", render: (u) => escapeHtml(u.prenom) },
      { label: "Rôle", width: "15%", render: (u) => `<span class="af-badge rounded-full bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand">${ROLE_LABELS[u.role] || u.role}</span>` },
      { label: "Téléphone", width: "13%", render: (u) => escapeHtml(u.telephone) },
      { label: "Email", render: (u) => escapeHtml(u.email) },
      {
        label: "Actions",
        width: "88px",
        align: "center",
        render: (u) => sameId(u.id, currentUserId)
          ? `<span class="text-xs text-slate-400">-</span>`
          : `
          <div class="flex items-center justify-center gap-2">
            ${actionButton({ icon: "fa-pen", colorClass: "bg-amber-100 text-amber-600", title: "Modifier", attr: `data-edit="${escapeHtml(u.id)}"` })}
            ${actionButton({ icon: "fa-trash", colorClass: "bg-rose-100 text-rose-600", title: "Supprimer", attr: `data-delete="${escapeHtml(u.id)}"` })}
          </div>
        `,
      },
    ],
  });

  wrapper.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const utilisateur = utilisateurs.find((u) => sameId(u.id, button.dataset.edit));
      if (utilisateur) openUserForm(utilisateur);
    });
  });

  wrapper.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.delete;
      openConfirmModal("Voulez-vous vraiment supprimer cet utilisateur ?", async () => {
        try {
          await deleteUser(id, currentUserId);
          showToast("Utilisateur supprimé.");
          await renderUserPage();
        } catch (error) {
          showToast(error.message, "error");
        }
      });
    });
  });
}
