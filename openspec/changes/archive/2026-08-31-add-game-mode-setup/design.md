## Context

Le client TypeDash utilise actuellement un seul événement `joinRoom` qui crée implicitement un salon inexistant ou rejoint un salon existant. Cette ambiguïté empêche de fournir des paramètres de création fiables : un invité ouvrant un lien pourrait créer le salon à la place de l’hôte et imposer une configuration par défaut. Tous les modes utilisent par ailleurs le même écran d’attente, et la capacité de 10 est codée en dur côté serveur et côté client.

Le changement traverse l’interface, le protocole Socket.IO, l’état en mémoire des salons et les tests d’intégration. Il doit conserver l’architecture sans base de données ni compte utilisateur.

## Goals / Non-Goals

**Goals:**

- Séparer explicitement la création d’une partie de la connexion à un salon existant.
- Conserver côté serveur une configuration de salon autoritaire contenant le mode et la capacité maximale.
- Fournir un parcours solo court et un parcours multijoueur configurable de 2 à 6 places.
- Garantir que le lancement multijoueur exige au moins deux joueurs et l’état prêt de tous les joueurs connectés.
- Donner à l’hôte un moyen sûr de libérer une place occupée par un joueur non prêt avant le lancement.
- Conserver le mode et la capacité lors d’une revanche dans le même salon.

**Non-Goals:**

- Ajouter des comptes, une identité persistante, du matchmaking ou un bannissement durable.
- Permettre de modifier la capacité après la création du salon.
- Ajouter un mode spectateur ou inclure des joueurs non prêts dans une course.
- Persister la configuration ou les résultats après le redémarrage du serveur.

## Decisions

### Decision 1: séparer `createRoom` et `joinRoom`

Le créateur enverra un événement `createRoom` avec un identifiant, un mode (`solo` ou `multiplayer`) et, pour le multijoueur, une capacité entière comprise entre 2 et 6. Le serveur validera le message, refusera une collision d’identifiant et créera l’état autoritaire avant d’ajouter l’hôte. `joinRoom` ne pourra rejoindre qu’un salon multijoueur existant et encore en attente.

Cette séparation est préférée à l’enrichissement du seul événement `joinRoom`, car elle évite qu’un invité utilisant un lien périmé crée accidentellement un nouveau salon avec une configuration indéterminée.

### Decision 2: conserver le moteur de salon pour le solo, mais masquer son infrastructure sociale

Une partie solo utilisera en interne un salon d’une place afin de réutiliser la sélection de texte, le compte à rebours, le minuteur, la progression et la revanche. Le client passera directement de la sélection Solo au choix de thématique et ne montrera ni lien de partage, ni grille de participants, ni commandes multijoueurs.

Un moteur solo entièrement séparé réduirait quelques états d’interface, mais dupliquerait le cycle de partie et augmenterait les risques d’écart fonctionnel.

### Decision 3: capacité immuable et autoritaire côté serveur

Chaque salon stockera `mode` et `maxPlayers`. Pour le multijoueur, `maxPlayers` sera validé dans l’intervalle 2–6 et utilisé à la fois pour les admissions et pour les données envoyées aux clients. Le client dessinera exactement `maxPlayers` cartes au lieu d’utiliser une constante globale. La valeur par défaut visible dans le sélecteur sera 2, mais le serveur ne remplacera jamais silencieusement une valeur absente ou invalide.

Une capacité modifiable dans le salon a été écartée afin d’éviter les cas où la nouvelle limite devient inférieure au nombre de joueurs déjà présents.

### Decision 4: unanimité des joueurs connectés au moment du lancement

Le serveur autorisera `startGame` uniquement si l’émetteur est l’hôte, si le salon multijoueur contient au moins deux joueurs et si `players.every(player => player.ready)` est vrai. Le client reflétera cette règle pour l’état du bouton, mais la décision serveur restera autoritaire. Toute arrivée avant le lancement ajoute un joueur non prêt et désactive donc immédiatement le lancement.

Cette règle est préférée au seuil actuel de deux joueurs prêts, qui permettrait d’embarquer dans la course des joueurs connectés mais non prêts.

### Decision 5: retrait ciblé et limité à l’état d’attente

L’hôte pourra envoyer `removePlayer` avec l’identifiant Socket.IO de la cible. Le serveur vérifiera que la partie est en attente, que l’émetteur est l’hôte, que la cible est un autre membre du même salon et que le salon est multijoueur. Il retirera alors la cible de l’état du salon et du canal Socket.IO, effacera son association locale au salon, lui émettra `removedFromRoom`, puis diffusera la nouvelle liste des joueurs.

Le client retiré retournera à l’accueil avec le message « L’hôte vous a retiré de la partie ». La place libérée redevient immédiatement disponible. Aucun identifiant persistant n’existant, ce retrait n’est pas un bannissement : la même personne peut tenter de rouvrir le lien.

### Decision 6: verrouiller les admissions dès le compte à rebours

Le passage de `waiting` à `countdown` aura lieu de façon synchrone avant le premier événement de compte à rebours. `joinRoom` n’acceptera que l’état `waiting`. Cela ferme la course entre un dernier participant et le démarrage ; l’ordre séquentiel des événements Node.js détermine lequel est accepté en premier.

### Decision 7: préserver la configuration lors d’une revanche

`playAgain` remettra à zéro le texte, le thème, les statistiques et les états prêts sans modifier `mode` ni `maxPlayers`. Les joueurs multijoueurs encore connectés restent dans le salon ; une partie solo revient directement au choix de thématique.

## Risks / Trade-offs

- **[Risk] Un joueur retiré rejoint immédiatement avec le même lien** → Le retrait est volontairement limité à la connexion courante ; l’hôte peut retirer à nouveau le joueur. Un bannissement robuste attendra une future identité persistante ou des jetons d’invitation.
- **[Risk] Le client affiche momentanément un bouton de lancement obsolète pendant une arrivée ou un départ** → Le serveur applique toujours les conditions à l’instant du traitement et rediffuse la liste autoritaire après chaque changement.
- **[Risk] Les anciens liens pointent vers un salon absent** → `joinRoom` affiche une erreur claire et renvoie à l’accueil au lieu de recréer implicitement un salon.
- **[Trade-off] Le solo conserve un salon serveur interne** → Cette abstraction est invisible pour le joueur et permet de partager le moteur de jeu sans duplication.

## Migration Plan

1. Introduire les nouveaux champs de salon et les nouveaux événements serveur avec leurs validations.
2. Adapter le client pour créer explicitement les salons et comprendre les données enrichies.
3. Remplacer les constantes et scénarios de 10 joueurs par la limite globale de 6 et la capacité propre à chaque salon.
4. Déployer client et serveur ensemble, puisque l’ancien client ne fournit pas les paramètres requis par `createRoom`.
5. En cas de retour arrière, redéployer ensemble l’ancienne version du client et du serveur ; les salons étant en mémoire, aucun schéma persistant ne doit être migré.

## Open Questions

Aucune question bloquante. Un mécanisme de bannissement durable pourra être étudié séparément si les reconnexions abusives deviennent un problème réel.
