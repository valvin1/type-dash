# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [0.7.0] - 2026-05-15
### Ajouté
- Externalisation des textes de jeu vers le système de fichiers (`data/`).
- Création d'un dataset de 60 fichiers (10 par catégorie).
- Chargement dynamique des thématiques basé sur la structure des dossiers.
- Sélection aléatoire du fichier texte lors du choix d'une thématique.

## [0.6.0] - 2026-05-15
### Ajouté
- Calcul du score en temps réel.
- Indicateur de leader (badge dynamique "Vous menez" / "Adversaire mène").
- Alerte sonore (bip) lorsqu'un joueur est dépassé par son adversaire.
- Initialisation de l'AudioContext sur interaction utilisateur.

## [0.5.0] - 2026-05-15
### Ajouté
- Système de thématiques (Histoire, Culture, Sport, Gastronomie, Cinéma, Répliques).
- Textes longs en français sans noms propres (environ 100 mots).
- Pouvoir de sélection de la thématique réservé au joueur P1.
- Gestion dynamique des rôles (P1/P2) avec réattribution si P1 quitte.

## [0.4.0] - 2026-05-15
### Modifié
- Suppression de la pénalité sur la touche Backspace.
- La validation des erreurs ne se fait désormais qu'à la soumission du mot (barre d'espace).
- Ajout d'un retour visuel rouge temporaire pendant la frappe en cas d'erreur.

## [0.3.0] - 2026-05-15
### Ajouté
- Système de rejouabilité synchronisé.
- Réinitialisation complète de l'état du jeu (mots, scores, progression) pour les deux joueurs.
- Obligation pour les deux joueurs d'indiquer "Prêt" pour relancer une manche.

## [0.2.0] - 2026-05-15
### Ajouté
- Affichage limité à 4 lignes de texte.
- Défilement automatique pour maintenir la ligne courante en haut de la zone d'affichage.
- Transitions CSS fluides pour le défilement.

## [0.1.0] - 2026-05-15
### Ajouté
- Localisation française des textes de jeu.
- Textes suffisamment longs pour les dactylos rapides (> 70 WPM).
- Pénalité initiale sur Backspace (obsolète depuis v0.4).
- Affichage du curseur de l'adversaire en temps réel.

## [0.0.1] - 2026-05-15
### Ajouté
- Initialisation du projet (Node.js, Socket.io, Express).
- Architecture multijoueur temps réel de base.
- Système de salon via URL paramétrée.
- Compte à rebours et chronomètre de 60 secondes.
- Calcul de base WPM et précision.
