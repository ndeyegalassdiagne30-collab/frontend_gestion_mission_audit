import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";

// Formate une date JS en chaîne "AAAA-MM-JJ HH:MM" pour le journal d'activité
function formatDateHeure(date) {
  const pad = (n) => String(n).padStart(2, "0");
  const jour = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const heure = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return `${jour} ${heure}`;
}

// Récupère la liste de toutes les entrées du journal d'activité
export async function getJournaux() {
  return apiRequest(ENDPOINTS.journaux, {}, "Impossible de charger le journal d'activité.");
}

// Enregistre une action dans le journal, appelée depuis les autres services après une opération réussie
export async function logActivite(action, utilisateurId) {
  const entree = {
    id: createId("jour"),
    action,
    date_action: formatDateHeure(new Date()),
    utilisateurId,
  };

  try {
    await apiRequest(
      ENDPOINTS.journaux,
      { method: "POST", body: JSON.stringify(entree) },
      "Impossible d'enregistrer l'activité."
    );
  } catch (error) {
    console.error("Journal d'activité :", error.message);
  }
}
