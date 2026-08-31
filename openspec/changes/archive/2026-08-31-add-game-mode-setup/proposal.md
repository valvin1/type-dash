## Why

TypeDash crée actuellement un salon multijoueur avant que le joueur ait choisi entre une partie solo et une partie en groupe, puis propose tardivement un bouton solo dans le salon. Le parcours doit annoncer ce choix dès l’accueil et donner à l’hôte un contrôle clair sur la taille et la préparation de son groupe.

## What Changes

- Ajouter sur l’écran d’accueil un choix explicite entre les modes Solo et Multijoueur.
- En mode Solo, démarrer un parcours individuel sans afficher les fonctions de partage et de gestion d’un salon multijoueur.
- En mode Multijoueur, demander à l’hôte une capacité maximale comprise entre 2 et 6 joueurs, avec 2 présélectionné, avant de créer le salon.
- Enregistrer la capacité choisie dans l’état serveur du salon, afficher exactement ce nombre d’emplacements et refuser les connexions qui dépassent cette limite.
- Réduire la limite globale du produit de 10 à 6 joueurs par salon.
- Autoriser l’hôte à lancer la partie à partir de 2 joueurs uniquement lorsque tous les joueurs actuellement connectés, y compris l’hôte, sont prêts.
- Permettre à l’hôte de retirer, avant le lancement, un autre joueur qui empêche l’unanimité des états prêts ; le joueur retiré reçoit une explication et la place est libérée.
- Fermer les nouvelles admissions dès le début du compte à rebours.
- Adapter le tableau de résultats à un maximum de 6 participants.

## Capabilities

### New Capabilities

- `game-mode-setup`: Définit le choix initial Solo ou Multijoueur, la sélection de capacité de 2 à 6 et le parcours propre à chaque mode.

### Modified Capabilities

- `lobby-management`: Remplace la capacité fixe de 10 par une capacité choisie de 2 à 6, exige que tous les joueurs connectés soient prêts et permet à l’hôte de retirer un joueur avant le lancement.
- `scoreboard-podium`: Limite la présentation des positions hors podium aux rangs 4 à 6.

## Impact

- **Interface (`public/index.html`, `public/style.css`)** : nouveau sélecteur de mode et de capacité, salon dimensionné selon sa capacité, action de retrait réservée à l’hôte et états de lancement explicites.
- **Client (`public/client.js`)** : création de partie avec mode et capacité, parcours solo direct, affichage dynamique des emplacements, traitement du retrait et calcul du bouton de lancement selon l’unanimité.
- **Serveur (`server.js`)** : validation du mode et de la capacité, état de salon enrichi, admission limitée par salon, autorisation de lancement renforcée et événement de retrait contrôlé par l’hôte.
- **Tests (`test/server.integration.test.js`)** : couverture des capacités 2 à 6, du parcours solo, de l’unanimité des joueurs prêts, du retrait et du verrouillage des admissions.
- Aucun nouveau service externe ni aucune dépendance applicative n’est requis.
