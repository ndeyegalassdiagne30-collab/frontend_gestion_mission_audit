import { pageHeader } from "../components/pageHerder.js";
import { renderTable } from "../components/table.js";
import { escapeHtml } from "../utils/html.js";
import { sameId } from "../utils/id.js";
import { getClients } from "../services/clientService.js";
import { getMissions } from "../services/missionService.js";
import { getDocuments } from "../services/documentService.js";
import { getJournaux } from "../services/journal_activiteService.js";
import { getUsers } from "../services/userService.js";
import { getCurrentUser, isAdmin, isAuditeur } from "../services/authService.js";
import { navigate } from "../router.js";

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

// Génère une carte statistique (icône, valeur, libellé) du tableau de bord
function statCard({ icon, iconClass, value, label, color }) {
  return `
    <article class="af-card af-kpi flex min-h-[9.5rem] flex-col justify-between rounded-[2rem] border border-slate-200 bg-white py-6 pl-8 pr-6 shadow-sm" style="--af-kpi-color: ${color}">
      <div class="flex items-center justify-between">
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl ${iconClass}">
          <i class="fa-solid ${icon} text-lg"></i>
        </div>
      </div>
      <div>
        <p class="text-3xl font-black tracking-tight text-slate-950">${value}</p>
        <p class="mt-1 text-sm font-semibold text-slate-500">${label}</p>
      </div>
    </article>
  `;
}

// Génère le tableau d'aperçu des 5 missions les plus proches de leur échéance
function missionsApercu(missions, clients, utilisateurs, emptyMessage) {
  const rows = [...missions]
    .sort((a, b) => (a.date_fin_prevue > b.date_fin_prevue ? 1 : -1))
    .slice(0, 5);

  return renderTable({
    rows,
    emptyMessage,
    columns: [
      { label: "Titre", render: (m) => `<strong class="font-bold text-slate-950">${escapeHtml(m.titre)}</strong>` },
      { label: "Client", width: "20%", render: (m) => escapeHtml(clients.find((c) => sameId(c.id, m.clientId))?.raison_sociale || "-") },
      {
        label: "Auditeurs",
        width: "18%",
        render: (m) => {
          const auditeurs = utilisateurs.filter((u) => (m.auditeurs || []).some((id) => sameId(id, u.id)));
          return auditeurs.length ? auditeurs.map((a) => escapeHtml(a.prenom)).join(", ") : "-";
        },
      },
      { label: "Échéance", width: "14%", render: (m) => escapeHtml(m.date_fin_prevue) },
      {
        label: "Avancement",
        width: "17%",
        render: (m) => `
          <div class="flex items-center gap-1.5">
            <div class="af-progress-track h-2 w-10 shrink-0 overflow-hidden rounded-full">
              <div class="af-progress-bar h-full rounded-full" style="width: ${Math.min(100, Math.max(0, Number(m.avancement) || 0))}%"></div>
            </div>
            <span class="text-xs font-bold text-slate-600">${escapeHtml(m.avancement)}%</span>
          </div>
        `,
      },
      {
        label: "Statut",
        width: "16%",
        render: (m) => `<span class="af-badge rounded-full px-2.5 py-1 text-xs font-bold ${STATUT_CLASSES[m.statut] || "bg-slate-100 text-slate-600"}">${STATUT_LABELS[m.statut] || m.statut}</span>`,
      },
    ],
  });
}

// Affiche le tableau de bord (statistiques et aperçus adaptés au rôle de l'utilisateur connecté)
export async function renderDashboardPage() {
  const app = document.getElementById("app");
  const user = getCurrentUser();

  const [missions, documents, clients, utilisateurs] = await Promise.all([
    getMissions(),
    getDocuments(),
    getClients(),
    getUsers(),
  ]);

  let cardsHtml = "";
  let missionsAffichees = missions;
  let missionsTitre = "Aperçu des missions";
  let missionsEmpty = "Aucune mission enregistrée.";

  if (isAuditeur()) {
    const mesMissions = missions.filter((m) => (m.auditeurs || []).some((id) => sameId(id, user.id)));
    const mesMissionIds = mesMissions.map((m) => m.id);
    const mesDocuments = documents.filter((d) => mesMissionIds.some((id) => sameId(id, d.missionId)));

    missionsAffichees = mesMissions;
    missionsTitre = "Mes missions à venir";
    missionsEmpty = "Aucune mission ne vous a été affectée.";

    cardsHtml = [
      statCard({ icon: "fa-briefcase", iconClass: "bg-blue-100 text-blue-600", value: mesMissions.length, label: "Missions affectées", color: "#2563eb" }),
      statCard({ icon: "fa-check", iconClass: "bg-emerald-100 text-emerald-600", value: mesMissions.filter((m) => m.statut === "termine").length, label: "Missions clôturées", color: "#059669" }),
      statCard({ icon: "fa-file-lines", iconClass: "bg-amber-100 text-amber-600", value: mesDocuments.length, label: "Documents", color: "#d97706" }),
    ].join("");
  } else {
    cardsHtml = [
      statCard({ icon: "fa-users", iconClass: "bg-emerald-100 text-emerald-600", value: clients.filter((c) => c.statut === "actif").length, label: "Clients actifs", color: "#059669" }),
      statCard({ icon: "fa-briefcase", iconClass: "bg-blue-100 text-blue-600", value: missions.length, label: "Missions", color: "#2563eb" }),
      statCard({ icon: "fa-file-lines", iconClass: "bg-amber-100 text-amber-600", value: documents.length, label: "Documents", color: "#d97706" }),
    ].join("");
  }

  let activitesHtml = "";

  if (isAdmin()) {
    const journaux = await getJournaux();
    const recentes = [...journaux]
      .sort((a, b) => (a.date_action < b.date_action ? 1 : -1))
      .slice(0, 5);

    const items = recentes.map((entree) => {
      const auteur = utilisateurs.find((u) => sameId(u.id, entree.utilisateurId));
      const nomAuteur = auteur ? `${auteur.prenom} ${auteur.nom}` : "Utilisateur inconnu";

      return `
        <li class="flex items-start justify-between gap-3 border-t border-slate-100 py-3 transition first:border-t-0 hover:bg-slate-50/70">
          <div class="flex min-w-0 flex-1 items-start gap-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <i class="fa-solid fa-clock-rotate-left text-xs"></i>
            </div>
            <div class="min-w-0">
              <p class="break-words text-sm font-bold text-slate-950">${escapeHtml(entree.action)}</p>
              <p class="text-xs text-slate-500">${escapeHtml(nomAuteur)}</p>
            </div>
          </div>
          <span class="shrink-0 whitespace-nowrap text-xs font-semibold text-slate-400">${escapeHtml(entree.date_action)}</span>
        </li>
      `;
    }).join("");

    activitesHtml = `
      <article class="af-card rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="mb-2 text-xl font-black text-slate-950">Activités récentes</h2>
        <ul class="divide-y divide-slate-100">
          ${items || `<li class="py-6 text-center text-sm text-slate-500">Aucune activité récente.</li>`}
        </ul>
      </article>
    `;
  }

  app.innerHTML = `
    <section>
      ${pageHeader({ title: "Tableau de bord" })}

      <div class="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        ${cardsHtml}
      </div>

      <div class="grid grid-cols-1 gap-6 ${isAdmin() ? "lg:grid-cols-3" : ""}">
        <article class="af-card ${isAdmin() ? "lg:col-span-2" : ""} rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-black text-slate-950">${missionsTitre}</h2>
            <button id="voirMissionsBtn" class="text-sm font-bold text-brand transition hover:underline">Voir tout →</button>
          </div>
          ${missionsApercu(missionsAffichees, clients, utilisateurs, missionsEmpty)}
        </article>
        ${activitesHtml}
      </div>
    </section>
  `;

  document.getElementById("voirMissionsBtn").addEventListener("click", () => navigate("missions"));
}
