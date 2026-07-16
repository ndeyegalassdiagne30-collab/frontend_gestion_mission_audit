import { CLOUDINARY_CONFIG, CLOUDINARY_UPLOAD_URL } from "../config/cloudinary.js";

// Envoie un fichier (image ou document) vers Cloudinary et retourne son URL sécurisée
export async function uploadToCloudinary(file) {
  if (!file) return null;

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("Le fichier ne doit pas dépasser 10 Mo.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_CONFIG.uploadPreset);

  const response = await fetch(CLOUDINARY_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Erreur lors de l'envoi du fichier vers Cloudinary.");
  }

  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}

// Formate la taille d'un fichier en Ko/Mo pour l'affichage dans les tableaux
export function formatTaille(bytes) {
  if (!bytes) return "-";
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} Ko`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
