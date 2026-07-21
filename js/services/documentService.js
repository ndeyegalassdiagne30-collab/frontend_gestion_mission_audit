import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";
import { required } from "../utils/validator.js";
import { logActivite } from "./journal_activiteService.js";

// Met en forme les données brutes d'un document avant enregistrement en base
function normalizeDocument(data) {
  return {
    id: data.id,
    titre: String(data.titre || "").trim(),
    nom_fichier: String(data.nom_fichier || "").trim(),
    chemin: data.chemin,
    description: String(data.description || "").trim(),
    date_upload: data.date_upload,
    missionId: data.missionId,
    taille: data.taille,
    utilisateurId: data.utilisateurId,
  };
}

// Récupère la liste de tous les documents
export async function getDocuments() {
  return apiRequest(ENDPOINTS.documents, {}, "Impossible de charger les documents.");
}

// Ajoute un nouveau document (déjà téléversé sur Cloudinary) à une mission et journalise l'action
export async function createDocument(data, utilisateurId) {
  required(data.titre, "Le titre du document est obligatoire.");
  required(data.nom_fichier, "Le nom du fichier est obligatoire.");
  required(data.chemin, "Le fichier doit être téléversé avant l'enregistrement.");
  required(data.missionId, "La mission est obligatoire.");

  const document = normalizeDocument({
    id: createId("doc"),
    date_upload: new Date().toISOString().slice(0, 10),
    ...data,
    utilisateurId,
  });

  const created = await apiRequest(
    ENDPOINTS.documents,
    { method: "POST", body: JSON.stringify(document) },
    "Impossible d'ajouter le document."
  );

  await logActivite(`Ajout du document ${document.titre}`, utilisateurId);
  return created;
}

// Supprime un document et journalise l'action
export async function deleteDocument(id, utilisateurId) {
  const deleted = await apiRequest(
    `${ENDPOINTS.documents}/${id}`,
    { method: "DELETE" },
    "Impossible de supprimer le document."
  );

  await logActivite("Suppression d'un document", utilisateurId);
  return deleted;
}
