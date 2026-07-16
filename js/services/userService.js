import { ENDPOINTS } from "../config/api.js";
import { apiRequest } from "./apiClient.js";
import { createId } from "../utils/id.js";
import { required } from "../utils/validator.js";
import { logActivite } from "./journal_activiteService.js";

// Vérifie que les champs obligatoires d'un utilisateur sont renseignés
function validateUser(data, isCreate) {
  required(data.nom, "Le nom est obligatoire.");
  required(data.prenom, "Le prénom est obligatoire.");
  required(data.email, "L'email est obligatoire.");
  required(data.telephone, "Le téléphone est obligatoire.");
  required(data.role, "Le rôle est obligatoire.");
  if (isCreate) required(data.mot_de_passe, "Le mot de passe est obligatoire.");
}

// Récupère la liste de tous les utilisateurs
export async function getUsers() {
  return apiRequest(ENDPOINTS.utilisateurs, {}, "Impossible de charger les utilisateurs.");
}

// Crée un nouvel utilisateur et journalise l'action
export async function createUser(data, utilisateurId) {
  validateUser(data, true);

  const utilisateur = {
    id: createId("usr"),
    nom: String(data.nom).trim(),
    prenom: String(data.prenom).trim(),
    email: String(data.email).trim(),
    mot_de_passe: data.mot_de_passe,
    telephone: String(data.telephone).trim(),
    photo: data.photo || "",
    date_creation: new Date().toISOString().slice(0, 10),
    role: data.role,
    statut: data.statut || "actif",
  };

  const created = await apiRequest(
    ENDPOINTS.utilisateurs,
    { method: "POST", body: JSON.stringify(utilisateur) },
    "Impossible de créer l'utilisateur."
  );

  await logActivite(`Création de l'utilisateur ${utilisateur.prenom} ${utilisateur.nom}`, utilisateurId);
  return created;
}

// Met à jour un utilisateur existant (mot de passe changé uniquement s'il est renseigné) et journalise l'action
export async function updateUser(id, data, utilisateurId) {
  validateUser(data, false);

  const payload = {
    nom: String(data.nom).trim(),
    prenom: String(data.prenom).trim(),
    email: String(data.email).trim(),
    telephone: String(data.telephone).trim(),
    photo: data.photo || "",
    role: data.role,
    statut: data.statut || "actif",
  };

  if (data.mot_de_passe) {
    payload.mot_de_passe = data.mot_de_passe;
  }

  const updated = await apiRequest(
    `${ENDPOINTS.utilisateurs}/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    "Impossible de modifier l'utilisateur."
  );

  await logActivite(`Modification de l'utilisateur ${payload.prenom} ${payload.nom}`, utilisateurId);
  return updated;
}

// Supprime un utilisateur et journalise l'action
export async function deleteUser(id, utilisateurId) {
  const deleted = await apiRequest(
    `${ENDPOINTS.utilisateurs}/${id}`,
    { method: "DELETE" },
    "Impossible de supprimer l'utilisateur."
  );

  await logActivite("Suppression d'un utilisateur", utilisateurId);
  return deleted;
}
