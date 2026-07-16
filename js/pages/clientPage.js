import { pageHeader, renderFilterBar } from "../components/pageHerder.js";
import { renderTable, actionButton } from "../components/table.js";
import { openModal, closeModal } from "../components/modal.js";
import { openConfirmModal } from "../components/confirmModal.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { sameId } from "../utils/id.js";
import {
  createClient,
  deleteClient,
  getClients,
  updateClient,
} from "../services/clientService.js";
import { getCurrentUser } from "../services/authService.js";

// Génère le formulaire de création/modification d'un client
function clientFormBody(client, errors = {}) {
  return `
    <div>
      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="clientRaisonSociale">Raison sociale *</label>
        <input class="w-full rounded-2xl border ${errors.raison_sociale ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="text" id="clientRaisonSociale" value="${escapeHtml(client?.raison_sociale || "")}" placeholder="ex: SENTECH SARL" autocomplete="off" />
        ${errors.raison_sociale ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.raison_sociale}</p>` : ""}
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="clientNinea">NINEA *</label>
        <input class="w-full rounded-2xl border ${errors.ninea ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="text" id="clientNinea" value="${escapeHtml(client?.ninea || "")}" placeholder="ex: SN123456789" autocomplete="off" />
        ${errors.ninea ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.ninea}</p>` : ""}
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="clientAdresse">Adresse *</label>
        <input class="w-full rounded-2xl border ${errors.adresse ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="text" id="clientAdresse" value="${escapeHtml(client?.adresse || "")}" placeholder="ex: Dakar, Sénégal" autocomplete="off" />
        ${errors.adresse ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.adresse}</p>` : ""}
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="clientTelephone">Téléphone *</label>
        <input class="w-full rounded-2xl border ${errors.telephone ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="text" id="clientTelephone" value="${escapeHtml(client?.telephone || "")}" placeholder="ex: 771234567" autocomplete="off" />
        ${errors.telephone ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.telephone}</p>` : ""}
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="clientEmail">Email *</label>
        <input class="w-full rounded-2xl border ${errors.email ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="email" id="clientEmail" value="${escapeHtml(client?.email || "")}" placeholder="ex: contact@client.sn" autocomplete="off" />
        ${errors.email ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.email}</p>` : ""}
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="clientDateCreation">Date de création *</label>
        <input class="w-full rounded-2xl border ${errors.date_creation ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="date" id="clientDateCreation" value="${escapeHtml(client?.date_creation || new Date().toISOString().slice(0, 10))}" />
        ${errors.date_creation ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.date_creation}</p>` : ""}
      </div>

      <div class="mb-2">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="clientStatut">Statut</label>
        <select class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" id="clientStatut">
          <option value="actif" ${client?.statut !== "inactif" ? "selected" : ""}>Actif</option>
          <option value="inactif" ${client?.statut === "inactif" ? "selected" : ""}>Inactif</option>
        </select>
      </div>
    </div>
  `;
}

// Extrait les valeurs saisies dans le formulaire client
function readClientForm(modalElement) {
  return {
    raison_sociale: modalElement.querySelector("#clientRaisonSociale").value.trim(),
    ninea: modalElement.querySelector("#clientNinea").value.trim(),
    adresse: modalElement.querySelector("#clientAdresse").value.trim(),
    telephone: modalElement.querySelector("#clientTelephone").value.trim(),
    email: modalElement.querySelector("#clientEmail").value.trim(),
    date_creation: modalElement.querySelector("#clientDateCreation").value,
    statut: modalElement.querySelector("#clientStatut").value,
  };
}

// Vérifie les champs obligatoires du formulaire client et retourne les erreurs trouvées
function validateClientForm(data) {
  const errors = {};
  if (!data.raison_sociale) errors.raison_sociale = "La raison sociale est requise";
  if (!data.ninea) errors.ninea = "Le NINEA est requis";
  if (!data.adresse) errors.adresse = "L'adresse est requise";
  if (!data.telephone) errors.telephone = "Le téléphone est requis";
  if (!data.email) errors.email = "L'email est requis";
  if (!data.date_creation) errors.date_creation = "La date de création est requise";
  return errors;
}

// Ouvre la fenêtre modale de création ou modification d'un client
function openClientForm(client = null) {
  const utilisateurId = getCurrentUser().id;

  openModal({
    title: client ? "Modifier le client" : "Nouveau client",
    icon: "fa-building",
    body: clientFormBody(client),
    confirmLabel: client ? "Enregistrer" : "Créer",
    onConfirm: async (modalElement) => {
      const data = readClientForm(modalElement);
      const errors = validateClientForm(data);

      if (Object.keys(errors).length > 0) {
        const formEl = modalElement.querySelector("[data-modal-form]");
        formEl.innerHTML = clientFormBody(data, errors) + defaultButtons();
        formEl.querySelector("[data-modal-cancel]").addEventListener("click", closeModal);
        return false;
      }

      try {
        if (client) {
          await updateClient(client.id, data, utilisateurId);
          showToast("Client modifié avec succès.");
        } else {
          await createClient(data, utilisateurId);
          showToast("Client créé avec succès.");
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
      <button type="button" data-modal-cancel class="af-btn-ghost rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Annuler</button>
      <button type="submit" data-modal-submit class="af-btn-primary inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-extrabold text-white">
        <i class="fa-solid fa-floppy-disk"></i>
        <span>Enregistrer</span>
      </button>
    </div>
  `;
}

// Ouvre la fenêtre modale affichant le détail d'un client
function openClientDetails(client) {
  openModal({
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
