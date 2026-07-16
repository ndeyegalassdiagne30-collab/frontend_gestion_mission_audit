import { pageHeader, renderFilterBar } from "../components/pageHerder.js";
import { renderTable } from "../components/table.js";
import { showToast } from "../components/toast.js";
import { escapeHtml } from "../utils/html.js";
import { sameId } from "../utils/id.js";
import { getJournaux } from "../services/journal_activiteService.js";
import { getUsers } from "../services/userService.js";

// Sépare le champ "date_action" (format "AAAA-MM-JJ HH:MM") en date et heure distinctes
function splitDateHeure(dateAction) {
  const [date, heure] = String(dateAction || "").split(" ");
  return { date: date || "-", heure: heure || "-" };
}

// Affiche la page du journal d'activité (réservée à l'administrateur), filtrable par date
export async function renderJournalActivitePage() {
  const app = document.getElementById("app");

  let journaux = [];
  let utilisateurs = [];

  try {
    [journaux, utilisateurs] = await Promise.all([getJournaux(), getUsers()]);
  } catch (error) {
    showToast(error.message, "error");
  }

  journaux = [...journaux].sort((a, b) => (a.date_action < b.date_action ? 1 : -1));

  const datesDisponibles = [...new Set(journaux.map((j) => splitDateHeure(j.date_action).date))];

  app.innerHTML = `
    <section>
      ${pageHeader({ title: "Journal d'activité" })}

      ${renderFilterBar({
        placeholder: "---Sélectionner par date---",
        options: datesDisponibles.map((d) => ({ value: d, label: d })),
      })}

      <article id="journalTableWrapper"></article>
    </section>
  `;

  renderJournalTable(journaux, utilisateurs);

  document.getElementById("pageFilter").addEventListener("change", (event) => {
    const value = event.target.value;
    const filtered = value ? journaux.filter((j) => splitDateHeure(j.date_action).date === value) : journaux;
    renderJournalTable(filtered, utilisateurs);
  });
}

// Génère et affiche le tableau des entrées du journal d'activité
function renderJournalTable(journaux, utilisateurs) {
  const wrapper = document.getElementById("journalTableWrapper");

  wrapper.innerHTML = renderTable({
    rows: journaux,
    emptyMessage: "Aucune activité enregistrée.",
    columns: [
      {
        label: "Utilisateur",
        render: (j) => {
          const utilisateur = utilisateurs.find((u) => sameId(u.id, j.utilisateurId));
          return utilisateur ? `<strong class="font-bold text-slate-950">${escapeHtml(utilisateur.prenom)} ${escapeHtml(utilisateur.nom)}</strong>` : "Utilisateur inconnu";
        },
      },
      { label: "Action", width: "40%", render: (j) => escapeHtml(j.action) },
      { label: "Date", width: "15%", render: (j) => escapeHtml(splitDateHeure(j.date_action).date) },
    ],
  });
}
