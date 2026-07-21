import { pageHeader } from "../components/pageHerder.js";
import { renderTable, actionButton } from "../components/table.js";
import { openDrawer } from "../components/drawer.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { sameId } from "../utils/id.js";
import { getMissions, updateAuditeursMission } from "../services/missionService.js";
import { getClients } from "../services/clientService.js";
import { getUsers } from "../services/userService.js";
import { getCurrentUser } from "../services/authService.js";

// Génère la liste de cases à cocher pour affecter des auditeurs à une mission
function affectationFormBody(mission, auditeurs) {
  const affectes = mission.auditeurs || [];

  const checkboxes = auditeurs.map((a) => `
    <label class="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
      <input type="checkbox" value="${a.id}" ${affectes.some((id) => sameId(id, a.id)) ? "checked" : ""} class="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand" data-auditeur-checkbox />
      ${escapeHtml(a.prenom)} ${escapeHtml(a.nom)}
    </label>
  `).join("");

  return `
    <div class="grid gap-2">
      <p class="mb-1 text-xs font-extrabold uppercase tracking-[0.14em] text-slate-500">Mission : ${escapeHtml(mission.titre)}</p>
      ${checkboxes || `<p class="text-sm text-slate-500">Aucun auditeur disponible.</p>`}
    </div>
  `;
}

// Ouvre le drawer permettant à l'expert-comptable de gérer les auditeurs affectés à une mission
function openAffectationForm(mission, auditeurs) {
  openDrawer({
    title: "Gérer les auditeurs affectés",
    subtitle: mission.titre,
    icon: "fa-user-check",
    body: affectationFormBody(mission, auditeurs),
    confirmLabel: "Enregistrer",
    onConfirm: async (drawerElement) => {
      const selected = Array.from(drawerElement.querySelectorAll("[data-auditeur-checkbox]:checked")).map((el) => el.value);

      try {
        await updateAuditeursMission(mission.id, selected, getCurrentUser().id);
        showToast("Affectation mise à jour avec succès.");
        await renderAffectationPage();
        return true;
      } catch (error) {
        showToast(error.message, "error");
        return false;
      }
    },
  });
}

// Affiche la page listant les missions et leurs auditeurs affectés
export async function renderAffectationPage() {
  const app = document.getElementById("app");

  let missions = [];
  let clients = [];
  let utilisateurs = [];

  try {
    [missions, clients, utilisateurs] = await Promise.all([getMissions(), getClients(), getUsers()]);
  } catch (error) {
    showToast(error.message, "error");
  }

  const auditeurs = utilisateurs.filter((u) => u.role === "auditeur");

  app.innerHTML = `
    <section>
      ${pageHeader({ title: "Liste des affectations d'audit" })}
      <article>
        ${renderTable({
          rows: missions,
          emptyMessage: "Aucune mission enregistrée.",
          columns: [
            { label: "Titre", render: (m) => `<strong class="font-bold text-slate-950">${escapeHtml(m.titre)}</strong>` },
            { label: "Client", width: "22%", render: (m) => escapeHtml(clients.find((c) => sameId(c.id, m.clientId))?.raison_sociale || "-") },
            {
              label: "Auditeurs affectés",
              width: "30%",
              render: (m) => {
                const affectes = utilisateurs.filter((u) => (m.auditeurs || []).some((id) => sameId(id, u.id)));
                if (affectes.length === 0) return `<span class="text-xs text-slate-400">Aucun</span>`;
                return `<div class="flex flex-wrap gap-1">${affectes.map((a) => `<span class="af-badge rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">${escapeHtml(a.prenom)}</span>`).join("")}</div>`;
              },
            },
            {
              label: "Actions",
              width: "90px",
              align: "center",
              render: (m) => actionButton({ icon: "fa-user-check", colorClass: "bg-brand/10 text-brand", title: "Gérer les auditeurs", attr: `data-manage="${escapeHtml(m.id)}"` }),
            },
          ],
        })}
      </article>
    </section>
  `;

  document.querySelectorAll("[data-manage]").forEach((button) => {
    button.addEventListener("click", () => {
      const mission = missions.find((m) => sameId(m.id, button.dataset.manage));
      if (mission) openAffectationForm(mission, auditeurs);
    });
  });
}
