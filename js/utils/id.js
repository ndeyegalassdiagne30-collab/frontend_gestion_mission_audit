// Génère un identifiant unique préfixé (ex: "mis-xxxx") pour les entités créées côté client
export function createId(prefix) {
  if (crypto && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

// Compare deux ids en ignorant leur type : les ids du jeu de données de départ
// sont des nombres (1, 2...) alors que les <select>/<input> HTML renvoient toujours
// des chaînes de caractères ("1", "2"...). Sans ça, les nouvelles missions/documents
// créés depuis un formulaire ne retrouveraient plus leur client/expert/auditeur.
export function sameId(a, b) {
  return String(a) === String(b);
}
