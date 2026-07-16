import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";
import { required } from "../utils/validator.js";
import { logActivite } from "./journal_activiteService.js";

// Met en forme les données brutes d'une mission avant enregistrement en base
function normalizeMission(data) {
  return {
    id: data.id,
    titre: String(data.titre || "").trim(),
    description: String(data.description || "").trim(),
    date_debut: data.date_debut,
    date_fin_prevue: data.date_fin_prevue,
    date_fin_reelle: data.date_fin_reelle || null,
    avancement: Number(data.avancement) || 0,
    statut: data.statut || "en_cours",
    date_creation: data.date_creation,
    clientId: data.clientId,
    expertComptableId: data.expertComptableId,
    auditeurs: data.auditeurs || [],
  };
}

// Vérifie que les champs obligatoires d'une mission sont renseignés
function validateMission(data) {
  required(data.titre, "Le titre de la mission est obligatoire.");
  required(data.date_debut, "La date de début est obligatoire.");
  required(data.date_fin_prevue, "La date de fin prévue est obligatoire.");
  required(data.clientId, "Le client est obligatoire.");
  required(data.expertComptableId, "L'expert-comptable est obligatoire.");
}

// Récupère la liste de toutes les missions
export async function getMissions() {
  return apiRequest(ENDPOINTS.missions, {}, "Impossible de charger les missions.");
}

// Crée une nouvelle mission et journalise l'action
export async function createMission(data, utilisateurId) {
  validateMission(data);

  const mission = normalizeMission({
    id: createId("mis"),
    date_creation: new Date().toISOString().slice(0, 10),
    ...data,
  });

  const created = await apiRequest(
    ENDPOINTS.missions,
    { method: "POST", body: JSON.stringify(mission) },
    "Impossible de créer la mission."
  );

  await logActivite(`Création de la mission ${mission.titre}`, utilisateurId);
  return created;
}

// Met à jour une mission existante (titre, statut, avancement, auditeurs affectés...) et journalise l'action
export async function updateMission(id, data, utilisateurId) {
  validateMission(data);

  const mission = normalizeMission({ id, ...data });

  const updated = await apiRequest(
    `${ENDPOINTS.missions}/${id}`,
    { method: "PATCH", body: JSON.stringify(mission) },
    "Impossible de modifier la mission."
  );

  await logActivite(`Modification de la mission ${mission.titre}`, utilisateurId);
  return updated;
}

// Supprime une mission et journalise l'action
export async function deleteMission(id, utilisateurId) {
  const deleted = await apiRequest(
    `${ENDPOINTS.missions}/${id}`,
    { method: "DELETE" },
    "Impossible de supprimer la mission."
  );

  await logActivite("Suppression d'une mission", utilisateurId);
  return deleted;
}

// Met à jour uniquement la liste des auditeurs affectés à une mission
export async function updateAuditeursMission(id, auditeurs, utilisateurId) {
  const updated = await apiRequest(
    `${ENDPOINTS.missions}/${id}`,
    { method: "PATCH", body: JSON.stringify({ auditeurs }) },
    "Impossible de mettre à jour les auditeurs affectés."
  );

  await logActivite("Affectation d'auditeurs à une mission", utilisateurId);
  return updated;
}
