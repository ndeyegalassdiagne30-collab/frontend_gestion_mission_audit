// Vérifie qu'une valeur n'est pas vide, sinon lève une erreur avec le message donné
export function required(value, message) {
  if (!String(value ?? "").trim()) {
    throw new Error(message);
  }
}

// Vérifie qu'une chaîne respecte un format d'email valide
export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}
