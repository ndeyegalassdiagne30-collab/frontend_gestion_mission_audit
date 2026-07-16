import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";
import { required } from "../utils/validator.js";
import { logActivite } from "./journal_activiteService.js";

// Met en forme les données brutes d'un client avant enregistrement en base
function normalizeClient(data) {
  return {
    id: data.id,
    raison_sociale: String(data.raison_sociale || "").trim(),
    ninea: String(data.ninea || "").trim(),
    adresse: String(data.adresse || "").trim(),
    telephone: String(data.telephone || "").trim(),
    email: String(data.email || "").trim(),
    date_creation: data.date_creation,
    statut: data.statut || "actif",
  };
}

// Vérifie que les champs obligatoires d'un client sont renseignés
function validateClient(data) {
  required(data.raison_sociale, "La raison sociale est obligatoire.");
  required(data.ninea, "Le NINEA est obligatoire.");
  required(data.adresse, "L'adresse est obligatoire.");
  required(data.telephone, "Le téléphone est obligatoire.");
  required(data.email, "L'email est obligatoire.");
  required(data.date_creation, "La date de création est obligatoire.");
}

// Récupère la liste de tous les clients
export async function getClients() {
  return apiRequest(ENDPOINTS.clients, {}, "Impossible de charger les clients.");
}

// Crée un nouveau client et journalise l'action
export async function createClient(data, utilisateurId) {
  validateClient(data);

  const client = normalizeClient({ id: createId("cli"), ...data });

  const created = await apiRequest(
    ENDPOINTS.clients,
    { method: "POST", body: JSON.stringify(client) },
    "Impossible de créer le client."
  );

  await logActivite(`Création du client ${client.raison_sociale}`, utilisateurId);
  return created;
}

// Met à jour un client existant et journalise l'action
export async function updateClient(id, data, utilisateurId) {
  validateClient(data);

  const client = normalizeClient({ id, ...data });

  const updated = await apiRequest(
    `${ENDPOINTS.clients}/${id}`,
    { method: "PATCH", body: JSON.stringify(client) },
    "Impossible de modifier le client."
  );

  await logActivite(`Modification du client ${client.raison_sociale}`, utilisateurId);
  return updated;
}

// Supprime un client et journalise l'action
export async function deleteClient(id, utilisateurId) {
  const deleted = await apiRequest(
    `${ENDPOINTS.clients}/${id}`,
    { method: "DELETE" },
    "Impossible de supprimer le client."
  );

  await logActivite(`Suppression d'un client`, utilisateurId);
  return deleted;
}
