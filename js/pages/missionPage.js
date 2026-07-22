import { pageHeader, renderFilterBar } from "../components/pageHerder.js";
import { renderTable, actionButton } from "../components/table.js";
import { openDrawer, closeDrawer } from "../components/drawer.js";
import { renderAuditeurSelect, initAuditeurSelect } from "../components/auditeurSelect.js";
import { openConfirmModal } from "../components/confirmModal.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { sameId } from "../utils/id.js";
import {
  createMission,
  deleteMission,
  getMissions,
  updateMission,
} from "../services/missionService.js";
import { getClients } from "../services/clientService.js";
import { getUsers } from "../services/userService.js";
import { getCurrentUser, isAuditeur, isExpertComptable, isClient } from "../services/authService.js";

const STATUT_LABELS = {
  en_cours: "En cours",
  en_relecture: "En relecture",
  termine: "Clôturée",
};

const STATUT_CLASSES = {
  en_cours: "bg-blue-100 text-blue-700",
  en_relecture: "bg-amber-100 text-amber-700",
  termine: "bg-emerald-100 text-emerald-700",
};

// Indique si une mission non clôturée a dépassé sa date de fin prévue
function estEnRetard(mission) {
  return mission.statut !== "termine" && mission.date_fin_prevue < new Date().toISOString().slice(0, 10);
}

// Génère le formulaire de création/modification d'une mission (infos, dates, statut, auditeurs affectés)
function missionFormBody(mission, clients, experts, auditeurs, errors = {}) {
  const clientOptions = clients.map((c) => `<option value="${c.id}" ${mission?.clientId == c.id ? "selected" : ""}>${escapeHtml(c.raison_sociale)}</option>`).join("");
  const expertOptions = experts.map((e) => `<option value="${e.id}" ${mission?.expertComptableId == e.id ? "selected" : ""}>${escapeHtml(e.prenom)} ${escapeHtml(e.nom)}</option>`).join("");
  const affectes = mission?.auditeurs || [];

  return `
    <div>
      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="missionTitre">Titre *</label>
        <input class="w-full rounded-2xl border ${errors.titre ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="text" id="missionTitre" value="${escapeHtml(mission?.titre || "")}" placeholder="ex: Audit financier 2026" autocomplete="off" />
        ${errors.titre ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.titre}</p>` : ""}
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="missionDescription">Description</label>
        <textarea class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" id="missionDescription" rows="3" placeholder="ex: Audit des états financiers">${escapeHtml(mission?.description || "")}</textarea>
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="missionClient">Client *</label>
        <select class="w-full rounded-2xl border ${errors.clientId ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" id="missionClient">
          <option value="">Sélectionner un client</option>
          ${clientOptions}
        </select>
        ${errors.clientId ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.clientId}</p>` : ""}
      </div>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="missionExpert">Expert-comptable *</label>
        <select class="w-full rounded-2xl border ${errors.expertComptableId ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" id="missionExpert">
          <option value="">Sélectionner un expert-comptable</option>
          ${expertOptions}
        </select>
        ${errors.expertComptableId ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.expertComptableId}</p>` : ""}
      </div>

      <div class="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="missionDateDebut">Date début *</label>
          <input class="w-full rounded-2xl border ${errors.date_debut ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="date" id="missionDateDebut" value="${escapeHtml(mission?.date_debut || "")}" />
          ${errors.date_debut ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.date_debut}</p>` : ""}
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="missionDateFinPrevue">Date prévue *</label>
          <input class="w-full rounded-2xl border ${errors.date_fin_prevue ? "border-rose-500" : "border-slate-200"} bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="date" id="missionDateFinPrevue" value="${escapeHtml(mission?.date_fin_prevue || "")}" />
          ${errors.date_fin_prevue ? `<p class="mt-1 text-xs font-semibold text-rose-500">${errors.date_fin_prevue}</p>` : ""}
        </div>
      </div>

      <div class="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="missionStatut">Statut</label>
          <select class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" id="missionStatut">
            <option value="en_cours" ${(!mission || mission.statut === "en_cours") ? "selected" : ""}>En cours</option>
            <option value="en_relecture" ${mission?.statut === "en_relecture" ? "selected" : ""}>En relecture</option>
          </select>
        </div>
        <div>
          <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="missionAvancement">Avancement (%)</label>
          <input class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="number" min="0" max="100" id="missionAvancement" value="${escapeHtml(mission?.avancement ?? 0)}" />
        </div>
      </div>

      <div class="mb-2">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Auditeurs affectés</label>
        ${renderAuditeurSelect(auditeurs, affectes)}
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

// Ouvre le drawer de création ou modification d'une mission
function openMissionForm(mission, clients, experts, auditeurs) {
  const utilisateurId = getCurrentUser().id;

  openDrawer({
    title: mission ? "Modifier la mission" : "Nouvelle mission",
    subtitle: mission ? mission.titre : "",
    icon: "fa-briefcase",
    body: missionFormBody(mission, clients, experts, auditeurs),
    confirmLabel: mission ? "Enregistrer" : "Créer",
    onConfirm: async (drawerElement) => {
      const data = {
        titre: drawerElement.querySelector("#missionTitre").value.trim(),
        description: drawerElement.querySelector("#missionDescription").value.trim(),
        clientId: drawerElement.querySelector("#missionClient").value,
        expertComptableId: drawerElement.querySelector("#missionExpert").value,
        date_debut: drawerElement.querySelector("#missionDateDebut").value,
        date_fin_prevue: drawerElement.querySelector("#missionDateFinPrevue").value,
        statut: drawerElement.querySelector("#missionStatut").value,
        avancement: drawerElement.querySelector("#missionAvancement").value,
        auditeurs: Array.from(drawerElement.querySelectorAll("[data-auditeur-checkbox]:checked")).map((el) => el.value),
      };

      const errors = {};
      if (!data.titre) errors.titre = "Le titre est requis";
      if (!data.clientId) errors.clientId = "Le client est requis";
      if (!data.expertComptableId) errors.expertComptableId = "L'expert-comptable est requis";
      if (!data.date_debut) errors.date_debut = "La date de début est requise";
      if (!data.date_fin_prevue) errors.date_fin_prevue = "La date prévue est requise";
      if (data.date_debut && data.date_fin_prevue && data.date_fin_prevue <= data.date_debut) {
        errors.date_fin_prevue = "La date prévue doit être supérieure à la date de début";
      }

      if (Object.keys(errors).length > 0) {
        const formEl = drawerElement.querySelector("[data-drawer-form]");
        formEl.innerHTML = missionFormBody(data, clients, experts, auditeurs, errors) + defaultButtons();
        formEl.querySelector("[data-drawer-cancel]").addEventListener("click", closeDrawer);
        initAuditeurSelect(formEl);
        return false;
      }

      try {
        if (mission) {
          await updateMission(mission.id, data, utilisateurId);
          showToast("Mission modifiée avec succès.");
        } else {
          await createMission(data, utilisateurId);
          showToast("Mission créée avec succès.");
        }
        await renderMissionPage();
        return true;
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    },
    onMount: (drawerElement) => {
      initAuditeurSelect(drawerElement);
      drawerElement.querySelector("#missionTitre")?.focus();
    },
  });
}

// Ouvre le drawer affichant le détail complet d'une mission
function openMissionDetails(mission, clients, experts, utilisateurs) {
  const client = clients.find((c) => sameId(c.id, mission.clientId));
  const expert = experts.find((e) => sameId(e.id, mission.expertComptableId));
  const auditeurs = utilisateurs.filter((u) => (mission.auditeurs || []).some((id) => sameId(id, u.id)));

  openDrawer({
    title: "Détails de la mission",
    subtitle: mission.titre,
    icon: "fa-eye",
    confirmLabel: "Fermer",
    confirmIcon: "fa-xmark",
    body: `
      <div class="grid gap-3 text-sm text-slate-700">
        <p><strong class="text-slate-950">Titre :</strong> ${escapeHtml(mission.titre)}</p>
        <p><strong class="text-slate-950">Description :</strong> ${escapeHtml(mission.description || "-")}</p>
        <p><strong class="text-slate-950">Client :</strong> ${escapeHtml(client?.raison_sociale || "-")}</p>
        <p><strong class="text-slate-950">Expert-comptable :</strong> ${expert ? escapeHtml(expert.prenom) + " " + escapeHtml(expert.nom) : "-"}</p>
        <p><strong class="text-slate-950">Auditeurs :</strong> ${auditeurs.map((a) => escapeHtml(a.prenom) + " " + escapeHtml(a.nom)).join(", ") || "Aucun"}</p>
        <p><strong class="text-slate-950">Période :</strong> ${escapeHtml(mission.date_debut)} → ${escapeHtml(mission.date_fin_prevue)}</p>
        <p><strong class="text-slate-950">Avancement :</strong> ${escapeHtml(mission.avancement)}%</p>
        <p><strong class="text-slate-950">Statut :</strong> ${STATUT_LABELS[mission.statut] || mission.statut}</p>
      </div>
    `,
    onConfirm: () => true,
  });
}

// Popup réservée aux auditeurs : ne permet de modifier que l'avancement et le statut de ses missions affectées
function avancementFormBody(mission) {
  return `
    <div>
      <div class="mb-1 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Mission</div>
      <p class="mb-4 text-sm font-bold text-slate-950">${escapeHtml(mission.titre)}</p>

      <div class="mb-4">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="missionAvancementValue">Avancement (%)</label>
        <input class="af-input w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" type="number" min="0" max="100" id="missionAvancementValue" value="${escapeHtml(mission.avancement ?? 0)}" />
      </div>

      <div class="mb-2">
        <label class="mb-2 block text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500" for="missionAvancementStatut">Statut</label>
        <select class="af-input w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" id="missionAvancementStatut">
          <option value="en_cours" ${mission.statut === "en_cours" ? "selected" : ""}>En cours</option>
          <option value="en_relecture" ${mission.statut === "en_relecture" ? "selected" : ""}>En relecture</option>
        </select>
        <p class="mt-1.5 text-xs text-slate-400">Passez en "En relecture" pour envoyer le rapport à l'expert-comptable, qui validera la clôture.</p>
      </div>
    </div>
  `;
}

function openAvancementForm(mission) {
  const utilisateurId = getCurrentUser().id;

  openDrawer({
    title: "Actualiser l'avancement",
    subtitle: mission.titre,
    icon: "fa-gauge-high",
    body: avancementFormBody(mission),
    confirmLabel: "Enregistrer",
    onConfirm: async (drawerElement) => {
      const avancement = drawerElement.querySelector("#missionAvancementValue").value;
      const statut = drawerElement.querySelector("#missionAvancementStatut").value;

      try {
        
        await updateMission(mission.id, { ...mission, avancement, statut }, utilisateurId);
        showToast("Avancement mis à jour avec succès.");
        await renderMissionPage();
        return true;
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    },
  });
}

// Réservé à l'expert-comptable : clôture la mission après relecture du rapport de l'auditeur
function openValidationMission(mission) {
  const utilisateurId = getCurrentUser().id;

  openConfirmModal(
    `Confirmez-vous avoir relu le rapport et validez-vous la clôture de la mission "<strong class="text-slate-950">${escapeHtml(mission.titre)}</strong>" ?`,
    async () => {
      try {
        await updateMission(mission.id, { ...mission, statut: "termine", avancement: 100, date_fin_reelle: new Date().toISOString().slice(0, 10) }, utilisateurId);
        showToast("Mission clôturée avec succès.");
        await renderMissionPage();
      } catch (error) {
        showToast(error.message, "error");
      }
    },
    {
      title: "Valider et clôturer la mission",
      icon: "fa-stamp",
      iconClass: "bg-emerald-100 text-emerald-600",
      confirmLabel: "Valider la clôture",
      confirmIcon: "fa-check",
      confirmClass: "bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700",
    }
  );
}

// Affiche la page de gestion des missions (liste, filtre par statut, actions selon le rôle)
export async function renderMissionPage() {
  const app = document.getElementById("app");
  const user = getCurrentUser();
  const auditeurMode = isAuditeur();
  const clientMode = isClient();

  let missions = [];
  let clients = [];
  let utilisateurs = [];

  try {
    [missions, clients, utilisateurs] = await Promise.all([getMissions(), getClients(), getUsers()]);
  } catch (error) {
    showToast(error.message, "error");
  }

  const experts = utilisateurs.filter((u) => u.role === "expert_comptable");
  const auditeurs = utilisateurs.filter((u) => u.role === "auditeur");

  if (auditeurMode) {
    missions = missions.filter((m) => (m.auditeurs || []).some((id) => sameId(id, user.id)));
  } else if (clientMode) {
    missions = missions.filter((m) => sameId(m.clientId, user.clientId));
  }

  app.innerHTML = `
    <section>
      ${pageHeader({
        title: (auditeurMode || clientMode) ? "Mes missions" : "Liste des missions",
        actionLabel: (auditeurMode || clientMode) ? null : "Nouvelle mission",
        actionId: (auditeurMode || clientMode) ? null : "addMissionBtn",
      })}

      ${renderFilterBar({
        placeholder: "---Sélectionner par statut---",
        options: [
          { value: "en_cours", label: "En cours" },
          { value: "en_relecture", label: "En relecture" },
          { value: "termine", label: "Clôturée" },
        ],
      })}

      <article id="missionTableWrapper"></article>
    </section>
  `;

  renderMissionTable(missions, clients, experts, utilisateurs, auditeurMode, auditeurs, clientMode);

  if (!auditeurMode && !clientMode) {
    document.getElementById("addMissionBtn").addEventListener("click", () => openMissionForm(null, clients, experts, auditeurs));
  }

  document.getElementById("pageFilter").addEventListener("change", (event) => {
    const value = event.target.value;
    const filtered = value ? missions.filter((m) => m.statut === value) : missions;
    renderMissionTable(filtered, clients, experts, utilisateurs, auditeurMode, auditeurs, clientMode);
  });
}

// Génère et affiche le tableau des missions avec les actions disponibles selon le rôle de l'utilisateur
function renderMissionTable(missions, clients, experts, utilisateurs, auditeurMode, auditeurs, clientMode = false) {
  const wrapper = document.getElementById("missionTableWrapper");

  wrapper.innerHTML = renderTable({
    rows: missions,
    emptyMessage: auditeurMode
      ? "Aucune mission ne vous a été affectée."
      : clientMode
        ? "Aucune mission ne concerne votre entreprise pour le moment."
        : "Aucune mission enregistrée.",
    columns: [
      { label: "Titre", render: (m) => `<strong class="font-bold text-slate-950">${escapeHtml(m.titre)}</strong>` },
      { label: "Client", width: "12%", render: (m) => escapeHtml(clients.find((c) => sameId(c.id, m.clientId))?.raison_sociale || "-") },
      {
        label: "Expert-comptable",
        width: "12%",
        render: (m) => {
          const expert = experts.find((e) => sameId(e.id, m.expertComptableId));
          return expert ? `${escapeHtml(expert.prenom)} ${escapeHtml(expert.nom)}` : "-";
        },
      },
      {
        label: "Auditeurs",
        width: "13%",
        render: (m) => {
          const auditeurs = utilisateurs.filter((u) => (m.auditeurs || []).some((id) => sameId(id, u.id)));
          if (auditeurs.length === 0) return `<span class="text-xs text-slate-400">Aucun</span>`;
          return `<div class="flex flex-wrap gap-1">${auditeurs.map((a) => `<span class="af-badge rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">${escapeHtml(a.prenom)}</span>`).join("")}</div>`;
        },
      },
      {
        label: "Période",
        width: "13%",
        render: (m) => `<span class="text-xs leading-tight">${escapeHtml(m.date_debut)} → ${escapeHtml(m.date_fin_prevue)}</span>`,
      },
      {
        label: "Avancement",
        width: "12%",
        render: (m) => `
          <div class="flex items-center gap-1.5">
            <div class="af-progress-track h-2 w-12 shrink-0 overflow-hidden rounded-full">
              <div class="af-progress-bar h-full rounded-full" style="width: ${Math.min(100, Math.max(0, Number(m.avancement) || 0))}%"></div>
            </div>
            <span class="text-xs font-bold text-slate-600">${escapeHtml(m.avancement)}%</span>
          </div>
        `,
      },
      {
        label: "Statut",
        width: "13%",
        render: (m) => `
          <div class="flex flex-col gap-1">
            <span class="af-badge w-fit rounded-full px-2.5 py-1 text-xs font-bold ${STATUT_CLASSES[m.statut] || "bg-slate-100 text-slate-600"}">${STATUT_LABELS[m.statut] || m.statut}</span>
            ${estEnRetard(m) ? `<span class="af-badge w-fit rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">En retard</span>` : ""}
          </div>
        `,
      },
      {
        label: "Actions",
        width: clientMode ? "80px" : "160px",
        align: "center",
        render: (m) => {
          if (clientMode) {
            return `
              <div class="flex items-center justify-center">
                ${actionButton({ icon: "fa-eye", colorClass: "bg-emerald-100 text-emerald-600", title: "Voir l'avancement", attr: `data-view="${escapeHtml(m.id)}"` })}
              </div>
            `;
          }
          return auditeurMode
            ? `
              <div class="flex items-center justify-center gap-2">
                ${actionButton({ icon: "fa-eye", colorClass: "bg-emerald-100 text-emerald-600", title: "Voir", attr: `data-view="${escapeHtml(m.id)}"` })}
                ${m.statut !== "termine" ? actionButton({ icon: "fa-gauge-high", colorClass: "bg-blue-100 text-blue-600", title: "Actualiser l'avancement", attr: `data-progress="${escapeHtml(m.id)}"` }) : ""}
              </div>
            `
            : `
              <div class="flex items-center justify-center gap-2">
                ${actionButton({ icon: "fa-eye", colorClass: "bg-emerald-100 text-emerald-600", title: "Voir", attr: `data-view="${escapeHtml(m.id)}"` })}
                ${isExpertComptable() && m.statut === "en_relecture" ? actionButton({ icon: "fa-stamp", colorClass: "bg-emerald-100 text-emerald-600", title: "Valider et clôturer", attr: `data-validate="${escapeHtml(m.id)}"` }) : ""}
                ${m.statut !== "termine" ? actionButton({ icon: "fa-pen", colorClass: "bg-amber-100 text-amber-600", title: "Modifier", attr: `data-edit="${escapeHtml(m.id)}"` }) : ""}
                ${actionButton({ icon: "fa-trash", colorClass: "bg-rose-100 text-rose-600", title: "Supprimer", attr: `data-delete="${escapeHtml(m.id)}"` })}
              </div>
            `;
        },
      },
    ],
  });

  wrapper.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const mission = missions.find((m) => sameId(m.id, button.dataset.view));
      if (mission) openMissionDetails(mission, clients, experts, utilisateurs);
    });
  });

  wrapper.querySelectorAll("[data-progress]").forEach((button) => {
    button.addEventListener("click", () => {
      const mission = missions.find((m) => sameId(m.id, button.dataset.progress));
      if (mission) openAvancementForm(mission);
    });
  });

  wrapper.querySelectorAll("[data-validate]").forEach((button) => {
    button.addEventListener("click", () => {
      const mission = missions.find((m) => sameId(m.id, button.dataset.validate));
      if (mission) openValidationMission(mission);
    });
  });

  wrapper.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const mission = missions.find((m) => sameId(m.id, button.dataset.edit));
      if (mission) openMissionForm(mission, clients, experts, auditeurs);
    });
  });

  wrapper.querySelectorAll("[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.delete;
      openConfirmModal("Voulez-vous vraiment supprimer cette mission ?", async () => {
        try {
          await deleteMission(id, getCurrentUser().id);
          showToast("Mission supprimée.");
          await renderMissionPage();
        } catch (error) {
          showToast(error.message, "error");
        }
      });
    });
  });
}
