## Context

Le serveur sélectionne aléatoirement un texte par catégorie et ne transmet que son contenu et sa thématique, sans identifiant stable de fichier. Le graphique actuel présente les mesures WPM du run achevé; il ne compare pas à une précédente timeline. Le fantôme Solo est le système de référence existant : il conserve un meilleur résultat dans la salle, compare avec `isBetterRun` (score, puis progression, puis précision), et conserve des snapshots rejoués comme adversaire. Il ne devient toutefois un candidat qu'après au moins trois mots corrects. Le fantôme et les résultats sont en mémoire dans un salon Solo; ils sont perdus quand le salon est supprimé, notamment au rafraîchissement.

Il n'y a ni compte utilisateur, ni identifiant de joueur Solo durable. Le stockage local du navigateur est donc la seule portée persistante disponible sans introduire un système d'identité. Le contenu exact sert de clé stable au texte après une resélection ou un rafraîchissement.

## Goals / Non-Goals

**Goals:**
- Afficher le WPM courant, la précision, la progression en direct et la courbe du run terminé dès le premier run.
- Ne pas afficher de comparaison historique tant qu'aucun meilleur run qualifié n'existe pour le texte.
- Comparer chaque run ultérieur au meilleur résultat historique de ce texte, jamais au run immédiatement précédent.
- N'enregistrer comme meilleur run qu'une performance qui dépasse la référence selon la règle lexicographique existante : score, puis progression, puis précision.
- Persister le meilleur résumé et la timeline de référence par contenu exact du texte dans le profil de navigateur; garder les données du run courant distinctes.
- Compter comme joué chaque run terminé, même sans saisie, indépendamment de l'existence d'un record.

**Non-Goals:**
- Masquer les statistiques du premier run ou les indicateurs en direct.
- Modifier le calcul du score, de la progression ou de la précision.
- Synchroniser les records entre profils/navigateurs/appareils ou persister des comptes côté serveur.
- Comparer les parties multijoueurs à une meilleure performance personnelle; le contrat de comparaison vise le mode Solo où le système fantôme existe.

## Decisions

1. **Réutiliser la règle de record Solo.** Comparer le score courant au meilleur score stocké; à égalité comparer la progression; à nouvelle égalité comparer la précision. La même règle est utilisée par `isBetterRun` pour les records fantômes, évitant deux notions contradictoires de « meilleur ». Le score est `round(wpm * accuracy / 100)` comme dans le système actuel.
2. **Réutiliser le seuil de candidat du fantôme.** Un run devient une référence qualifiée à partir de trois mots correctement terminés (`MIN_GHOST_CORRECT_WORDS`). Cette limite évite qu'un run vide ou très court remplace la référence. Un run terminé reste comptabilisé comme joué même s'il est non qualifié. Si aucune référence qualifiée n'existe, montrer les statistiques du run et aucune comparaison historique; un premier run qualifié établit la référence sans être comparé à une ancienne valeur.
3. **Comparer avec la meilleure référence préexistante au début du run.** Le snapshot de comparaison est chargé au lancement et reste la référence de ce run. À la fin, si le run est qualifié et bat cette référence, remplacer le meilleur résumé et sa timeline. Les runs plus faibles ou à égalité ne remplacent rien. Cela garantit que le run 4 se compare au meilleur des runs 1–3.
4. **Conserver deux états distincts par empreinte du texte.** `played` indique qu'au moins un run s'est terminé; `best` contient le meilleur run qualifié (résumé et timeline) ou `null`. Les mesures du run courant restent temporaires. L'empreinte est calculée à partir du contenu exact plutôt que de la catégorie, car plusieurs textes appartiennent à une catégorie et aucun identifiant de fichier n'est exposé. Des fichiers au contenu identique partagent donc une clé.
5. **Limiter le contrat à Solo.** Le fantôme existant, `retrySoloText` et son critère best-run ne concernent que Solo. Les résultats multijoueurs gardent les statistiques par run sans comparaison persistante. Étendre la référence à des joueurs multijoueurs exigerait une identité stable et dépasse l'architecture actuelle.
6. **Gérer le stockage indisponible sans interrompre le jeu.** Si lecture/écriture locale échoue, garder l'état best/played en mémoire pour la page courante; après refresh, aucune continuité n'est garantie. Ne pas afficher de comparaison si aucune référence fiable n'a pu être chargée.

## Risks / Trade-offs

- [Le stockage local est propre au profil, effaçable et modifiable] → Valider la forme et les nombres du record au chargement; fallback en mémoire sans bloquer. Les records ne sont pas anti-triche ni synchronisés.
- [Les records en mémoire du fantôme et les records locaux pourraient diverger] → Utiliser le même comparator et le même seuil pour l'éligibilité; choisir le record local par contenu comme source de comparaison du graphe, sans changer le comportement fantôme de course.
- [Le contenu exact n'est pas une identité éditoriale] → Deux fichiers identiques partagent un record; le même texte après resélection retrouve son record, indépendamment du thème.
- [Un run sans saisie n'a pas de statistique exploitable] → Le marquer comme joué, afficher sa courbe courante selon les données disponibles, mais ne pas le qualifier comme référence tant qu'il n'a pas trois mots corrects.
- [Comparaison limitée à Solo] → Documenter que les courses multijoueurs ne reçoivent pas de référence personnelle persistante faute d'identité de joueur durable.

## Migration Plan

Aucune migration serveur. Les profils locaux sans record commencent sans comparaison; la première performance Solo qualifiée devient leur référence. Les données persistées ne contiennent que le meilleur résumé et sa timeline par empreinte de texte.

## Open Questions

Le ticket ne définit pas l'identité d'un joueur entre navigateurs. La proposition utilise donc le profil local comme propriétaire du record; une future synchronisation multi-appareils nécessiterait des comptes. La règle fantôme est réutilisée avec son seuil de trois mots corrects, tandis que les runs incomplets comptent seulement dans l'état `played`.
