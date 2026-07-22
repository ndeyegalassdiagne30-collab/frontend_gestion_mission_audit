import { pageHeader, renderFilterBar } from "../components/pageHerder.js";
import { renderTable, actionButton } from "../components/table.js";
import { openDrawer, closeDrawer } from "../components/drawer.js";
import { openConfirmModal } from "../components/confirmModal.js";
import { createSlideToConfirm } from "../components/slideToConfirm.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { sameId } from "../utils/id.js";
import {
  createClient,
  deleteClient,
  getClients,
  updateClient,
} from "../services/clientService.js";
import { createUser } from "../services/userService.js";
import { getCurrentUser } from "../services/authService.js";

// Classes (littérales, scannées par Tailwind) pour l'apparition/disparition animée des champs du compte client
const ACCOUNT_FIELDS_WRAPPER_HIDDEN = "grid overflow-hidden transition-[grid-template-rows] duration-500 ease-out [grid-template-rows:0fr]";
const ACCOUNT_FIELDS_WRAPPER_VISIBLE = "grid overflow-hidden transition-[grid-template-rows] duration-500 ease-out [grid-template-rows:1fr]";
const ACCOUNT_FIELDS_INNER_HIDDEN = "grid grid-cols-1 gap-4 pt-4 opacity-0 -translate-y-1 transition-all duration-500 sm:grid-cols-2";
const ACCOUNT_FIELDS_INNER_VISIBLE = "grid grid-cols-1 gap-4 pt-4 opacity-100 translate-y-0 transition-all duration-500 sm:grid-cols-2";

// Génère le formulaire de création/modification d'un client
// `isEdit` est passé explicitement (plutôt que déduit de `values`) car lors d'un
// réaffichage après erreur de validation, `values` contient les données saisies
// (toujours "truthy") et ne permet donc pas de distinguer création et modification.
function clientFormBody(values, errors = {}, isEdit = false) {
  return `
    <div>
      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="clientRaisonSociale">Raison sociale *</label>
        <input class="w-full rounded-2xl border ${errors.raison_sociale ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="text" id="clientRaisonSociale" value="${escapeHtml(values?.raison_sociale || "")}" placeholder="ex: SENTECH SARL" autocomplete="off" />
        ${errors.raison_sociale ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.raison_sociale}</p>` : ""}
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="clientNinea">NINEA *</label>
        <input class="w-full rounded-2xl border ${errors.ninea ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="text" id="clientNinea" value="${escapeHtml(values?.ninea || "")}" placeholder="ex: SN123456789" autocomplete="off" />
        ${errors.ninea ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.ninea}</p>` : ""}
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="clientAdresse">Adresse *</label>
        <input class="w-full rounded-2xl border ${errors.adresse ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="text" id="clientAdresse" value="${escapeHtml(values?.adresse || "")}" placeholder="ex: Dakar, Sénégal" autocomplete="off" />
        ${errors.adresse ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.adresse}</p>` : ""}
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="clientTelephone">Téléphone *</label>
        <input class="w-full rounded-2xl border ${errors.telephone ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="text" id="clientTelephone" value="${escapeHtml(values?.telephone || "")}" placeholder="ex: 771234567" autocomplete="off" />
        ${errors.telephone ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.telephone}</p>` : ""}
      </div>

      ${isEdit ? `
        <div class="mb-4">
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="clientEmail">Email *</label>
          <input class="w-full rounded-2xl border ${errors.email ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="email" id="clientEmail" value="${escapeHtml(values?.email || "")}" placeholder="ex: contact@client.sn" autocomplete="off" />
          ${errors.email ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.email}</p>` : ""}
        </div>
      ` : ""}

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="clientDateCreation">Date de création *</label>
        <input class="w-full rounded-2xl border ${errors.date_creation ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="date" id="clientDateCreation" value="${escapeHtml(values?.date_creation || new Date().toISOString().slice(0, 10))}" />
        ${errors.date_creation ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.date_creation}</p>` : ""}
      </div>

      <div class="mb-2">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="clientStatut">Statut</label>
        <select class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" id="clientStatut">
          <option value="actif" ${values?.statut !== "inactif" ? "selected" : ""}>Actif</option>
          <option value="inactif" ${values?.statut === "inactif" ? "selected" : ""}>Inactif</option>
        </select>
      </div>

      ${!isEdit ? `
        <div class="mt-4 border-t border-slate-100 pt-4">
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Accès client</label>
          <div id="clientAccountSlide"></div>

          <div id="clientAccountFields" class="${ACCOUNT_FIELDS_WRAPPER_HIDDEN}">
            <div class="min-h-0 overflow-hidden">
              <div id="clientAccountFieldsInner" class="${ACCOUNT_FIELDS_INNER_HIDDEN}">
                <div class="sm:col-span-2">
                  <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="clientEmail">Email *</label>
                  <input class="w-full rounded-2xl border ${errors.email ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="email" id="clientEmail" value="${escapeHtml(values?.email || "")}" placeholder="ex: contact@client.sn" autocomplete="off" />
                  ${errors.email ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.email}</p>` : ""}
                </div>
                <div>
                  <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="clientMotDePasse">Mot de passe *</label>
                  <input class="w-full rounded-2xl border ${errors.mot_de_passe ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="password" id="clientMotDePasse" placeholder="••••••••" autocomplete="new-password" />
                  ${errors.mot_de_passe ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.mot_de_passe}</p>` : ""}
                </div>
                <div>
                  <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="clientMotDePasseConfirm">Confirmation *</label>
                  <input class="w-full rounded-2xl border ${errors.mot_de_passe_confirm ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="password" id="clientMotDePasseConfirm" placeholder="••••••••" autocomplete="new-password" />
                  ${errors.mot_de_passe_confirm ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.mot_de_passe_confirm}</p>` : ""}
                </div>
              </div>
            </div>
          </div>
        </div>
      ` : ""}
    </div>
  `;
}

// Extrait les valeurs saisies dans le formulaire client
function readClientForm(drawerElement) {
  return {
    raison_sociale: drawerElement.querySelector("#clientRaisonSociale").value.trim(),
    ninea: drawerElement.querySelector("#clientNinea").value.trim(),
    adresse: drawerElement.querySelector("#clientAdresse").value.trim(),
    telephone: drawerElement.querySelector("#clientTelephone").value.trim(),
    email: drawerElement.querySelector("#clientEmail").value.trim(),
    date_creation: drawerElement.querySelector("#clientDateCreation").value,
    statut: drawerElement.querySelector("#clientStatut").value,
  };
}

// Vérifie les champs obligatoires du formulaire client et retourne les erreurs trouvées.
// L'email n'est requis qu'en modification : à la création, il n'est demandé que si
// l'option "compte client" est activée (voir validateAccountFields).
function validateClientForm(data, isEdit) {
  const errors = {};
  if (!data.raison_sociale) errors.raison_sociale = "La raison sociale est requise";
  if (!data.ninea) errors.ninea = "Le NINEA est requis";
  if (!data.adresse) errors.adresse = "L'adresse est requise";
  if (!data.telephone) errors.telephone = "Le téléphone est requis";
  if (isEdit && !data.email) errors.email = "L'email est requis";
  if (!data.date_creation) errors.date_creation = "La date de création est requise";
  return errors;
}

// Vérifie l'email, le mot de passe et sa confirmation, requis uniquement quand l'option "compte client" est activée
function validateAccountFields(email, motDePasse, motDePasseConfirm) {
  const errors = {};
  if (!email) errors.email = "L'email est requis pour créer un compte";
  if (!motDePasse) errors.mot_de_passe = "Le mot de passe est requis";
  else if (motDePasse.length < 6) errors.mot_de_passe = "Le mot de passe doit contenir au moins 6 caractères";
  if (!motDePasseConfirm) errors.mot_de_passe_confirm = "La confirmation est requise";
  else if (motDePasse && motDePasseConfirm !== motDePasse) errors.mot_de_passe_confirm = "Les mots de passe ne correspondent pas";
  return errors;
}

// Ouvre le drawer de création ou modification d'un client
function openClientForm(client = null) {
  const utilisateurId = getCurrentUser().id;
  let accountConfirmed = false;

  // (Ré)initialise le composant "glisser pour créer un compte" et branche l'apparition animée des champs associés
  function mountAccountSlide(drawerElement) {
    const slideContainer = drawerElement.querySelector("#clientAccountSlide");
    if (!slideContainer) return;

    const fieldsWrapper = drawerElement.querySelector("#clientAccountFields");
    const fieldsInner = drawerElement.querySelector("#clientAccountFieldsInner");

    createSlideToConfirm(slideContainer, {
      label: "Glisser pour créer un client avec un compte",
      confirmedLabel: "Client avec compte",
      resetLabel: "Retirer le compte",
      confirmed: accountConfirmed,
      onConfirm: () => {
        accountConfirmed = true;
        fieldsWrapper.className = ACCOUNT_FIELDS_WRAPPER_VISIBLE;
        fieldsInner.className = ACCOUNT_FIELDS_INNER_VISIBLE;
      },
      onReset: () => {
        accountConfirmed = false;
        fieldsWrapper.className = ACCOUNT_FIELDS_WRAPPER_HIDDEN;
        fieldsInner.className = ACCOUNT_FIELDS_INNER_HIDDEN;
      },
    });

    if (accountConfirmed) {
      fieldsWrapper.className = ACCOUNT_FIELDS_WRAPPER_VISIBLE;
      fieldsInner.className = ACCOUNT_FIELDS_INNER_VISIBLE;
    }
  }

  openDrawer({
    title: client ? "Modifier le client" : "Nouveau client",
    subtitle: client ? client.raison_sociale : "",
    icon: "fa-building",
    body: clientFormBody(client, {}, Boolean(client)),
    confirmLabel: client ? "Enregistrer" : "Créer",
    onMount: (drawerElement) => {
      mountAccountSlide(drawerElement);
      drawerElement.querySelector("input, select, textarea")?.focus();
    },
    onConfirm: async (drawerElement) => {
      const data = readClientForm(drawerElement);
      const errors = validateClientForm(data, Boolean(client));

      if (!client && accountConfirmed) {
        const motDePasse = drawerElement.querySelector("#clientMotDePasse")?.value || "";
        const motDePasseConfirm = drawerElement.querySelector("#clientMotDePasseConfirm")?.value || "";
        Object.assign(errors, validateAccountFields(data.email, motDePasse, motDePasseConfirm));
      }

      if (Object.keys(errors).length > 0) {
        const formEl = drawerElement.querySelector("[data-drawer-form]");
        formEl.innerHTML = clientFormBody(data, errors, Boolean(client)) + defaultButtons();
        formEl.querySelector("[data-drawer-cancel]").addEventListener("click", closeDrawer);
        mountAccountSlide(formEl);
        return false;
      }

      try {
        if (client) {
          await updateClient(client.id, data, utilisateurId);
          showToast("Client modifié avec succès.");
        } else {
          const createdClient = await createClient(data, utilisateurId);

          if (accountConfirmed) {
            const motDePasse = drawerElement.querySelector("#clientMotDePasse").value;
            try {
              await createUser({
                nom: "Client",
                prenom: data.raison_sociale,
                email: data.email,
                telephone: data.telephone,
                mot_de_passe: motDePasse,
                role: "client",
                clientId: createdClient.id,
              }, utilisateurId);
              showToast("Client créé avec un compte d'accès.");
            } catch (accountError) {
              showToast(`Client créé, mais le compte n'a pas pu être créé : ${accountError.message}`, "error");
            }
          } else {
            showToast("Client créé avec succès.");
          }
        }
        await renderClientPage();
        return true;
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    },
  });
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

// Ouvre le drawer affichant le détail d'un client
function openClientDetails(client) {
  openDrawer({
    title: "Détails du client",
    icon: "fa-eye",
    confirmLabel: "Fermer",
    confirmIcon: "fa-xmark",
    body: `
      <div class="grid gap-3 text-sm text-slate-700">
        <p><strong class="text-slate-950">Raison sociale :</strong> ${escapeHtml(client.raison_sociale)}</p>
        <p><strong class="text-slate-950">NINEA :</strong> ${escapeHtml(client.ninea)}</p>
        <p><strong class="text-slate-950">Adresse :</strong> ${escapeHtml(client.adresse)}</p>
        <p><strong class="text-slate-950">Téléphone :</strong> ${escapeHtml(client.telephone)}</p>
        <p><strong class="text-slate-950">Email :</strong> ${escapeHtml(client.email)}</p>
        <p><strong class="text-slate-950">Date de création :</strong> ${escapeHtml(client.date_creation)}</p>
      </div>
    `,
    onConfirm: () => true,
  });
}

// Affiche la page de gestion des clients (liste, filtre par statut, actions)
export async function renderClientPage() {
  const app = document.getElementById("app");
  let clients = [];

  try {
    clients = await getClients();
  } catch (error) {
    showToast(error.message, "error");
  }

  app.innerHTML = `
    <section>
      ${pageHeader({
        title: "Liste des clients",
        actionLabel: "Nouveau client",
        actionId: "addClientBtn",
      })}

      ${renderFilterBar({
        placeholder: "---Sélectionner par statut---",
        options: [
          { value: "actif", label: "Actif" },
          { value: "inactif", label: "Inactif" },
        ],
      })}

      <article id="clientTableWrapper"></article>
    </section>
  `;

  renderClientTable(clients);
  document.getElementById("addClientBtn").addEventListener("click", () => openClientForm());
  document.getElementById("pageFilter").addEventListener("change", (event) => {
    const value = event.target.value;
    const filtered = value ? clients.filter((c) => c.statut === value) : clients;
    renderClientTable(filtered);
  });
}

// Génère et affiche le tableau des clients avec leurs actions
function renderClientTable(clients) {
  const wrapper = document.getElementById("clientTableWrapper");

  wrapper.innerHTML = renderTable({
    rows: clients,
    emptyMessage: "Aucun client enregistré.",
    columns: [
      { label: "Raison sociale", render: (c) => `<strong class="font-bold text-slate-950">${escapeHtml(c.raison_sociale)}</strong>` },
      { label: "NINEA", width: "11%", render: (c) => escapeHtml(c.ninea) },
      { label: "Adresse", width: "15%", render: (c) => escapeHtml(c.adresse) },
      { label: "Téléphone", width: "10%", render: (c) => escapeHtml(c.telephone) },
      { label: "Email", width: "16%", render: (c) => escapeHtml(c.email) },
      { label: "Date création", width: "10%", render: (c) => escapeHtml(c.date_creation) },
      {
        label: "Statut",
        width: "9%",
        render: (c) => c.statut === "inactif"
          ? `<span class="af-badge rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">Inactif</span>`
          : `<span class="af-badge rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">Actif</span>`,
      },
      {
        label: "Actions",
        width: "112px",
        align: "center",
        render: (c) => `
          <div class="flex items-center justify-center gap-2">
            ${actionButton({ icon: "fa-eye", colorClass: "bg-emerald-100 text-emerald-600", title: "Voir", attr: `data-view="${escapeHtml(c.id)}"` })}
            ${actionButton({ icon: "fa-pen", colorClass: "bg-amber-100 text-amber-600", title: "Modifier", attr: `data-edit="${escapeHtml(c.id)}"` })}
            ${actionButton({ icon: "fa-trash", colorClass: "bg-rose-100 text-rose-600", title: "Supprimer", attr: `data-delete="${escapeHtml(c.id)}"` })}
          </div>
        `,
      },
    ],
  });

  wrapper.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const client = clients.find((c) => sameId(c.id, button.dataset.view));
      if (client) openClientDetails(client);
    });
  });

  wrapper.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const client = clients.find((c) => sameId(c.id, button.dataset.edit));
      if (client) openClientForm(client);
    });
  });

  wrapper.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.delete;
      openConfirmModal("Voulez-vous vraiment supprimer ce client ?", async () => {
        try {
          await deleteClient(id, getCurrentUser().id);
          showToast("Client supprimé.");
          await renderClientPage();
        } catch (error) {
          showToast(error.message, "error");
        }
      });
    });
  });
}
