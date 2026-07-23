// Composant réutilisable "glisser pour confirmer" (inspiré du Slide to Unlock), à activer au pointeur/tactile ou au clavier
export function createSlideToConfirm(container, {
  label = "Glisser pour confirmer",       // texte affiché avant confirmation
  confirmedLabel = "Confirmé",            // texte affiché une fois confirmé
  ariaLabel = label,                      // texte lu par les lecteurs d'écran (par défaut, identique au label visible)
  resetLabel = "Retirer",                 // texte du bouton qui annule la confirmation
  confirmed = false,                      // état initial (confirmé ou non) à l'ouverture du composant
  onConfirm = null,                       // fonction appelée quand l'utilisateur confirme
  onReset = null,                         // fonction appelée quand l'utilisateur annule la confirmation
} = {}) {
  const CONFIRM_THRESHOLD = 0.65; // au-delà de 65% du parcours, le relâchement valide (effet magnétique)

  // Injecte le HTML du composant à l'intérieur du conteneur fourni par la page appelante
  container.innerHTML = `
    <div class="af-slide-wrap">
      <!-- Piste du slider : role="switch" et aria-checked permettent aux lecteurs d'écran de le comprendre comme un interrupteur -->
      <div data-slide-track class="af-slide-track relative h-14 w-full select-none overflow-hidden rounded-2xl border border-slate-200 bg-slate-50" role="switch" tabindex="0" aria-label="${ariaLabel}" aria-checked="false">
        <!-- Remplissage coloré qui grandit au fur et à mesure du glissement -->
        <div data-slide-fill class="af-slide-fill pointer-events-none absolute inset-y-0 left-0 bg-brand/15" style="width:0%"></div>
        <!-- Texte centré affiché par-dessus la piste (change et s'estompe selon l'état) -->
        <p data-slide-label class="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-500">${label}</p>
        <!-- Curseur (thumb) que l'utilisateur fait glisser ; sa position est pilotée en JS via style.transform -->
        <div data-slide-thumb class="af-slide-thumb absolute left-1 top-1 flex h-11 w-11 cursor-grab items-center justify-center rounded-xl bg-brand text-white shadow-lg active:cursor-grabbing" style="transform:translateX(0px)">
          <i class="fa-solid fa-arrow-right text-sm"></i>
        </div>
      </div>
      <!-- Bouton de réinitialisation, masqué tant que le slider n'est pas confirmé -->
      <button type="button" data-slide-reset class="af-btn-ghost mt-2 hidden items-center gap-2 text-xs font-bold text-slate-500 hover:text-rose-600">
        <i class="fa-solid fa-rotate-left"></i>
        <span>${resetLabel}</span>
      </button>
    </div>
  `;

  // Récupère les références DOM des éléments qu'on vient d'injecter, pour pouvoir les manipuler ensuite
  const track = container.querySelector("[data-slide-track]");     // la piste (fond du slider)
  const fill = container.querySelector("[data-slide-fill]");       // le remplissage coloré
  const labelEl = container.querySelector("[data-slide-label]");   // le texte affiché sur la piste
  const thumb = container.querySelector("[data-slide-thumb]");     // le curseur qu'on fait glisser
  const resetBtn = container.querySelector("[data-slide-reset]");  // le bouton "Retirer"

  let dragging = false;    // vrai pendant qu'un glissement est en cours
  let startX = 0;          // position X de la souris/du doigt au moment où le glissement a commencé
  let maxDistance = 0;     // distance maximale que le curseur peut parcourir dans la piste
  let isConfirmed = false; // état courant du composant (confirmé ou non)

  // Calcule la largeur actuelle de la piste (utile si la fenêtre/le drawer change de taille)
  function trackWidth() {
    return track.getBoundingClientRect().width;
  }

  // Met à jour visuellement la position du curseur, le remplissage et l'opacité du texte selon la distance parcourue
  function applyProgress(distance, withTransition) {
    thumb.style.transition = withTransition ? "" : "none"; // désactive la transition CSS pendant un glissement manuel (pour suivre la souris sans latence)
    thumb.style.transform = `translateX(${distance}px) scale(${dragging ? 1.06 : 1})`; // déplace le curseur et l'agrandit légèrement pendant le glissement
    const ratio = maxDistance > 0 ? distance / maxDistance : 0; // proportion du parcours déjà effectuée (entre 0 et 1)
    fill.style.width = `${Math.max(11, ratio * 100)}%`; // le remplissage grandit avec la progression (11% minimum pour rester visible sous le curseur)
    labelEl.style.opacity = String(1 - ratio * 0.9); // le texte s'estompe progressivement à mesure qu'on glisse
  }

  // Bascule l'état visuel confirmé/non-confirmé (utilisé après un glissement complet, un raccourci clavier, ou une réinitialisation)
  function setConfirmed(next, { silent = false } = {}) {
    isConfirmed = next; // mémorise le nouvel état
    maxDistance = trackWidth() - thumb.offsetWidth - 8; // recalcule la distance maximale (au cas où la taille aurait changé)

    track.setAttribute("aria-checked", String(next)); // met à jour l'attribut ARIA pour les lecteurs d'écran
    resetBtn.classList.toggle("hidden", !next); // cache le bouton "Retirer" si non confirmé
    resetBtn.classList.toggle("flex", next);    // l'affiche (en flex, pour l'alignement icône+texte) si confirmé

    if (next) {
      // Cas "confirmé" : curseur poussé à fond, texte et icône mis à jour, style de la piste changé
      applyProgress(maxDistance, true);
      labelEl.textContent = confirmedLabel;
      labelEl.style.color = "#fff";
      track.classList.add("af-slide-track-confirmed");
      thumb.querySelector("i").className = "fa-solid fa-check text-sm";
    } else {
      // Cas "non confirmé" : curseur remis à zéro, texte et icône d'origine restaurés
      applyProgress(0, true);
      labelEl.textContent = label;
      labelEl.style.color = "";
      track.classList.remove("af-slide-track-confirmed");
      thumb.querySelector("i").className = "fa-solid fa-arrow-right text-sm";
    }

    // Prévient la page appelante du changement d'état, sauf si l'appel demande explicitement le silence
    // (utilisé à l'initialisation pour ne pas déclencher onConfirm/onReset avant toute action de l'utilisateur)
    if (!silent) {
      if (next && typeof onConfirm === "function") onConfirm();
      if (!next && typeof onReset === "function") onReset();
    }
  }

  // Démarre un glissement quand l'utilisateur appuie sur le curseur
  function pointerDown(event) {
    if (isConfirmed) return; // rien à glisser si déjà confirmé (il faut passer par le bouton "Retirer")
    dragging = true; // active le mode glissement
    startX = event.clientX; // mémorise la position de départ du pointeur
    maxDistance = trackWidth() - thumb.offsetWidth - 8; // recalcule la distance maximale de parcours
    thumb.setPointerCapture?.(event.pointerId); // garde les événements du pointeur même s'il sort du curseur
  }

  // Suit le déplacement du pointeur pendant le glissement
  function pointerMove(event) {
    if (!dragging) return; // ignore les mouvements si aucun glissement n'est en cours
    const delta = Math.min(Math.max(event.clientX - startX, 0), maxDistance); // distance parcourue, bornée entre 0 et le maximum
    applyProgress(delta, false); // met à jour l'affichage sans transition (suivi en temps réel)
  }

  // Termine le glissement quand l'utilisateur relâche le pointeur
  function pointerUp(event) {
    if (!dragging) return; // ignore si aucun glissement n'était en cours
    dragging = false; // désactive le mode glissement
    const delta = Math.min(Math.max(event.clientX - startX, 0), maxDistance); // distance finale parcourue
    const ratio = maxDistance > 0 ? delta / maxDistance : 0; // proportion du parcours effectuée
    setConfirmed(ratio >= CONFIRM_THRESHOLD); // valide si le seuil de 65% est atteint, sinon revient à l'état initial (effet magnétique)
  }

  // Branche les écouteurs d'événements du glissement à la souris/au tactile (Pointer Events unifie les deux)
  thumb.addEventListener("pointerdown", pointerDown);   // le glissement démarre uniquement depuis le curseur
  window.addEventListener("pointermove", pointerMove);  // écouté sur window pour continuer à suivre même hors du curseur
  window.addEventListener("pointerup", pointerUp);      // écouté sur window pour capter le relâchement même hors du curseur

  // Gère l'activation au clavier (accessibilité), en plus du glissement à la souris/au tactile
  track.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault(); // empêche le comportement par défaut (ex: défilement de la page avec Espace)
      setConfirmed(!isConfirmed); // Entrée/Espace bascule l'état (confirme ou annule)
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setConfirmed(true); // flèche droite = confirmer directement
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      setConfirmed(false); // flèche gauche = annuler directement
    }
  });

  // Clic sur "Retirer le compte" (ou équivalent) : revient à l'état non confirmé
  resetBtn.addEventListener("click", () => setConfirmed(false));

  // Recalcule le parcours si le drawer/la fenêtre change de taille pendant que le composant est monté
  const resizeObserver = new ResizeObserver(() => {
    maxDistance = trackWidth() - thumb.offsetWidth - 8; // nouvelle distance maximale selon la nouvelle largeur
    applyProgress(isConfirmed ? maxDistance : 0, false); // replace le curseur à la bonne position sans à-coup
  });
  resizeObserver.observe(track); // surveille les changements de taille de la piste

  // Applique l'état initial une fois que le navigateur a eu le temps de calculer les dimensions réelles du composant
  requestAnimationFrame(() => setConfirmed(confirmed, { silent: true }));

  // API renvoyée à la page appelante pour interagir avec le composant après sa création
  return {
    isConfirmed: () => isConfirmed, // permet de lire l'état actuel à tout moment
    setConfirmed: (next) => setConfirmed(next, { silent: true }), // permet de forcer l'état sans déclencher onConfirm/onReset (ex: réaffichage après erreur de formulaire)
    destroy: () => {
      // Nettoie les écouteurs globaux et l'observateur de redimensionnement pour éviter les fuites mémoire si le composant est retiré du DOM
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", pointerUp);
      resizeObserver.disconnect();
    },
  };
}
