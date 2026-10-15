## Context

Le client calcule actuellement un WPM moyen cumulatif lors de la validation des mots et envoie la progression à intervalle limité. Le serveur conserve déjà des snapshots pour le fantôme Solo, mais seulement lors de mises à jour et avec une limite liée au nombre de mots. Les résultats multijoueurs renvoient directement les joueurs, et aucune faute n'est conservée en tant qu'événement. Le résultat est affiché dans l'écran existant de fin de partie.

## Goals / Non-Goals

**Goals:**
- Fournir une série de points `{ elapsedMs, wpm }` par joueur, mesurée sur la durée de la partie et incluse dans l'événement final.
- Montrer toutes les séries simultanément en multijoueur, avec identité et couleurs distinctes; identifier les mots terminés incorrectement en rouge et les suppressions de caractères en orange.
- Garder les séries et erreurs en mémoire le temps de la manche seulement, sans effet sur les règles de score, les records fantômes ou le classement.
- Rendre la visualisation lisible sur écran étroit, avec axes/repères, légende et détails accessibles au survol ou au focus.

**Non-Goals:**
- Historique entre plusieurs parties, comptes, export, analyse par touche ou changement des règles de calcul du score.
- Enregistrer chaque frappe partielle comme une erreur; une erreur désigne un mot finalisé qui ne correspond pas au mot cible. Une hésitation désigne une action de suppression qui retire effectivement au moins un caractère de la saisie.
- Tracer le fantôme comme un participant connecté dans le graphique. La série du joueur de la partie est le sujet de l'analyse.

## Decisions

1. **Échantillonnage côté serveur par joueur.** À partir de l'heure de départ monotone de la manche, capturer une mesure par joueur à intervalles réguliers plafonnés à 1000 ms; choisir un pas plus fin pour les durées courtes si utile, et inclure un point final à la fin de la manche. Calculer le WPM cumulatif selon la même définition que le WPM affiché (mots corrects / temps écoulé), y compris les périodes de pause. Cela fournit une ligne temporelle comparable et évite de dépendre uniquement des keystrokes ou de nombreux messages socket. Les mises à jour de progression fournissent l'état courant; les mesures régulières sont bornées par durée et nombre de joueurs.

2. **Deux événements de frappe distincts.** Une erreur est enregistrée quand un mot est soumis et ne correspond pas à la cible, avec index du mot et temps écoulé. Une hésitation est enregistrée quand Backspace ou Delete retire effectivement un ou plusieurs caractères de la saisie, avec index du mot courant, nombre de caractères supprimés si disponible, et temps écoulé. Le client émet l'événement uniquement après une modification réelle de la valeur saisie; un appui sans effet, une frappe ordinaire ou une suppression hors saisie ne compte pas. Les suppressions répétées sont des événements distincts puisqu'elles correspondent à du temps et du travail de correction observables. Le serveur valide les bornes et associe chaque événement au joueur émetteur.

3. **Résultat final structuré et non persistant.** Chaque résultat de joueur inclut sa série, ses erreurs de mot et ses hésitations. Le serveur conserve la forme globale attendue par les résultats en Solo (dont les métadonnées ghost) et adapte la réponse multijoueur pour transporter les données par joueur. Aucune donnée n'est stockée après la fermeture ou la remise à zéro de la salle. Les snapshots nécessaires au ghost restent compatibles et indépendants de la série du graphique.

4. **Graphique natif SVG/CSS ou canvas sans dépendance.** Le graphique adapte son échelle temporelle aux points reçus, affiche les séries avec couleurs coordonnées, les erreurs de mot en repères rouges et les hésitations en repères orange au temps correspondant. Une légende identifie les joueurs et les deux types de marqueurs; le survol/focus d'un point peut exposer temps, joueur et type d'événement. Une implémentation locale évite une dépendance externe pour une visualisation simple.

## Risks / Trade-offs

- [Le WPM cumulatif masque les variations de rafales] → Le libeller clairement comme vitesse moyenne cumulée au temps du point; conserver une cadence d'échantillonnage régulière pour rendre les changements visibles.
- [La télémétrie client d'erreur ou d'hésitation peut être falsifiée] → Valider les index, quantité supprimée et temps côté serveur et accepter uniquement les signaux du joueur dans la salle en cours; cette visualisation n'affecte pas le score.
- [Les messages de progression peuvent être perdus ou irréguliers] → Échantillonner l'état courant côté serveur et inclure un point terminal; ne pas laisser un intervalle supérieur à une seconde.
- [Le graphique devient chargé avec plusieurs joueurs] → Utiliser une palette contrastée, une légende et des marqueurs d'erreur discrets; respecter les dimensions mobiles et les préférences de mouvement.

## Migration Plan

Aucune migration de données n'est nécessaire. Déployer le serveur et le client ensemble, car le format de `gameFinished` évolue. Les salles en cours ne survivent pas à un redémarrage; les anciens clients ne sont donc pas concernés au-delà de leur connexion active.

## Open Questions

Aucune question bloquante. Le pas d'échantillonnage exact peut être choisi dans l'implémentation, sous la contrainte normative d'un intervalle maximal d'une seconde.
