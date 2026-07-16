import { pageHeader, renderFilterBar } from "../components/pageHerder.js";
import { renderTable, actionButton } from "../components/table.js";
import { openModal, closeModal } from "../components/modal.js";
import { openConfirmModal } from "../components/confirmModal.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { sameId } from "../utils/id.js";
import { createDocument, deleteDocument, getDocuments } from "../services/documentService.js";
import { getMissions } from "../services/missionService.js";
import { uploadToCloudinary, formatTaille } from "../services/cloudinary.js";
import { getCurrentUser, isAuditeur } from "../services/authService.js";

// Génère le formulaire d'ajout d'un document (mission, description, fichier)
function documentFormBody(missions, errors = {}) {
  const missionOptions = missions.map((m) => `<option value="${m.id}">${escapeHtml(m.titre)}</option>`).join("");

  return `
    <div>
      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="documentMission">Mission *</label>
        <select class="w-full rounded-2xl border ${errors.missionId ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" id="documentMission">
          <option value="">Sélectionner une mission</option>
          ${missionOptions}
        </select>
        ${errors.missionId ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.missionId}</p>` : ""}
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="documentDescription">Description</label>
        <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="text" id="documentDescription" placeholder="ex: Bilan comptable" autocomplete="off" />
      </div>

      <div class="mb-2">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="documentFile">Fichier *</label>
        <input class="w-full rounded-2xl border ${errors.file ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-bold file:text-brand focus:border-brand focus:ring-4 focus:ring-brand/10" type="file" id="documentFile" />
        ${errors.file ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.file}</p>` : ""}
      </div>
    </div>
  `;
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

// Ouvre la fenêtre modale d'ajout d'un document et l'envoie vers Cloudinary avant enregistrement
function openDocumentForm(missions) {
  const utilisateurId = getCurrentUser().id;

  openModal({
    title: "Nouveau document",
    icon: "fa-file-arrow-up",
    confirmLabel: "Ajouter",
    body: documentFormBody(missions),
    onConfirm: async (modalElement) => {
      const missionId = modalElement.querySelector("#documentMission").value;
      const description = modalElement.querySelector("#documentDescription").value.trim();
      const file = modalElement.querySelector("#documentFile").files[0];

      const errors = {};
      if (!missionId) errors.missionId = "La mission est requise";
      if (!file) errors.file = "Un fichier est requis";

      if (Object.keys(errors).length > 0) {
        const formEl = modalElement.querySelector("[data-modal-form]");
        formEl.innerHTML = documentFormBody(missions, errors) + defaultButtons();
        formEl.querySelector("[data-modal-cancel]").addEventListener("click", closeModal);
        return false;
      }

      try {
        const uploaded = await uploadToCloudinary(file);

        await createDocument({
          nom_fichier: file.name,
          chemin: uploaded.url,
          description,
          missionId,
          taille: formatTaille(file.size),
        }, utilisateurId);

        showToast("Document ajouté avec succès.");
        await renderDocumentPage();
        return true;
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    },
  });
}

// Affiche la page de gestion des documents (liste, filtre par mission, restreinte aux missions de l'auditeur si besoin)
export async function renderDocumentPage() {
  const app = document.getElementById("app");
  const user = getCurrentUser();
  const auditeurMode = isAuditeur();

  let documents = [];
  let missions = [];

  try {
    [documents, missions] = await Promise.all([getDocuments(), getMissions()]);
  } catch (error) {
    showToast(error.message, "error");
  }

  if (auditeurMode) {
    const mesMissionIds = missions.filter((m) => (m.auditeurs || []).some((id) => sameId(id, user.id))).map((m) => m.id);
    missions = missions.filter((m) => mesMissionIds.some((id) => sameId(id, m.id)));
    documents = documents.filter((d) => mesMissionIds.some((id) => sameId(id, d.missionId)));
  }

  app.innerHTML = `
    <section>
      ${pageHeader({
        title: "Liste des documents",
        actionLabel: "Nouveau document",
        actionId: "addDocumentBtn",
      })}

      ${renderFilterBar({
        placeholder: "---Sélectionner par mission---",
        options: missions.map((m) => ({ value: m.id, label: m.titre })),
      })}

      <article id="documentTableWrapper"></article>
    </section>
  `;

  renderDocumentTable(documents, missions, auditeurMode, user);

  document.getElementById("addDocumentBtn").addEventListener("click", () => openDocumentForm(missions));
  document.getElementById("pageFilter").addEventListener("change", (event) => {
    const value = event.target.value;
    const filtered = value ? documents.filter((d) => sameId(d.missionId, value)) : documents;
    renderDocumentTable(filtered, missions, auditeurMode, user);
  });
}

// Génère et affiche le tableau des documents avec téléchargement et suppression (limitée à ses propres documents pour un auditeur)
function renderDocumentTable(documents, missions, auditeurMode, user) {
  const wrapper = document.getElementById("documentTableWrapper");

  wrapper.innerHTML = renderTable({
    rows: documents,
    emptyMessage: "Aucun document enregistré.",
    columns: [
      { label: "Nom", render: (d) => `<strong class="font-bold text-slate-950">${escapeHtml(d.nom_fichier)}</strong>` },
      { label: "Mission", width: "22%", render: (d) => escapeHtml(missions.find((m) => sameId(m.id, d.missionId))?.titre || "-") },
      { label: "Date d'ajout", width: "15%", render: (d) => escapeHtml(d.date_upload) },
      {
        label: "Télécharger",
        width: "128px",
        align: "center",
        render: (d) => /^https?:\/\//i.test(d.chemin || "")
          ? `<a href="${escapeHtml(d.chemin)}" target="_blank" rel="noopener" title="Télécharger" class="af-btn-icon inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><i class="fa-solid fa-download text-xs"></i></a>`
          : `<span title="Fichier indisponible" class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-300"><i class="fa-solid fa-download text-xs"></i></span>`,
      },
      {
        label: "Supprimer",
        width: "128px",
        align: "center",
        render: (d) => (!auditeurMode || sameId(d.utilisateurId, user.id))
          ? actionButton({ icon: "fa-trash", colorClass: "bg-rose-100 text-rose-600", title: "Supprimer", attr: `data-delete="${escapeHtml(d.id)}"` })
          : `<span class="text-xs text-slate-400">-</span>`,
      },
    ],
  });

  wrapper.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.delete;
      openConfirmModal("Voulez-vous vraiment supprimer ce document ?", async () => {
        try {
          await deleteDocument(id, getCurrentUser().id);
          showToast("Document supprimé.");
          await renderDocumentPage();
        } catch (error) {
          showToast(error.message, "error");
        }
      });
    });
  });
}
