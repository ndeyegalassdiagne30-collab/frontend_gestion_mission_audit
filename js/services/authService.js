import { ENDPOINTS } from "../config/api.js";
import { logActivite } from "./journal_activiteService.js";

const AUTH_KEY = "auditflow_user";

// Récupère l'utilisateur actuellement connecté depuis le stockage local
export function getCurrentUser() {
  const stored = localStorage.getItem(AUTH_KEY);
  return stored ? JSON.parse(stored) : null;
}

// Indique si un utilisateur est actuellement connecté
export function isAuthenticated() {
  return getCurrentUser() !== null;
}

// Indique si l'utilisateur connecté a le rôle administrateur
export function isAdmin() {
  return getCurrentUser()?.role === "administrateur";
}

// Indique si l'utilisateur connecté a le rôle expert-comptable
export function isExpertComptable() {
  return getCurrentUser()?.role === "expert_comptable";
}

// Indique si l'utilisateur connecté a le rôle auditeur
export function isAuditeur() {
  return getCurrentUser()?.role === "auditeur";
}

// Indique si l'utilisateur connecté a le rôle client (compte créé depuis la fiche client)
export function isClient() {
  return getCurrentUser()?.role === "client";
}

// Authentifie l'utilisateur via email/mot de passe et ouvre sa session locale
export async function login(email, motDePasse) {
  const response = await fetch(`${ENDPOINTS.utilisateurs}?email=${encodeURIComponent(email)}`);
  if (!response.ok) throw new Error("Erreur de connexion au serveur.");

  const utilisateurs = await response.json();
  const utilisateur = utilisateurs.find((u) => u.email === email && u.mot_de_passe === motDePasse);

  if (!utilisateur) throw new Error("Email ou mot de passe incorrect.");

  const { mot_de_passe: _, ...safeUser } = utilisateur;
  localStorage.setItem(AUTH_KEY, JSON.stringify(safeUser));

  await logActivite("Connexion", safeUser.id);

  return safeUser;
}

// Rafraîchit la session locale après la modification du profil de l'utilisateur connecté
export function updateCurrentUser(utilisateur) {
  const { mot_de_passe: _, ...safeUser } = utilisateur;
  localStorage.setItem(AUTH_KEY, JSON.stringify(safeUser));
}

// Déconnecte l'utilisateur (vide la session locale) et recharge l'application
export function logout() {
  localStorage.removeItem(AUTH_KEY);
  window.location.reload();
}
