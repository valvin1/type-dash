# Changelog

Versions published after the hosting migration are documented in
[GitHub Releases](https://github.com/valvin1/type-dash/releases). This file
preserves the historical release notes.

## 1.0.0 (2026-05-18)


### Bug Fixes

* resolve security audit vulnerabilities ([2aa17a5](https://github.com/valvin1/type-dash/commit/2aa17a5c2515b3e7c3c1a1e0b1594699e677bd29))


### Features

* externalize texts to filesystem and expand dataset v0.7 ([1694499](https://github.com/valvin1/type-dash/commit/1694499175aa11dbc04802371e628cb7a2c8e488))
* implement real-time multiplayer typing battle v0.6 ([2eee44b](https://github.com/valvin1/type-dash/commit/2eee44b91880d3d606e2e425a2feb63d24717cf4))
* implement v0.8 solo mode and longer texts ([c6901b8](https://github.com/valvin1/type-dash/commit/c6901b877bf1882f5149ef5d01b9f2c75aff97d7))

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

## [0.8.0] - 2026-05-15
### Ajouté
- Mode "Jouer en solo" (Entraînement) accessible quand un joueur est seul dans un salon.
- Mémorisation locale (LocalStorage) et affichage du meilleur score personnel en mode solo.
### Modifié
- Allongement des textes à environ 110-140 mots pour éviter qu'ils ne soient trop courts.

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
