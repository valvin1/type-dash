## Why

Les statistiques de progression sont utiles dès le premier run, mais il n'existe alors aucun run antérieur auquel les comparer. Lors des replays, la comparaison doit rester ancrée sur la meilleure performance atteinte sur le même texte, même si des runs ultérieurs sont moins bons.

## What Changes

- Afficher les statistiques et la courbe du run courant dès la première partie, sans comparaison historique.
- Mémoriser par contenu de texte le meilleur run qualifié et sa série de progression.
- Comparer chaque replay au meilleur run antérieur, selon un ordre de priorité explicite; remplacer la référence seulement si le run courant la dépasse.
- Conserver un indicateur « déjà joué » séparé du meilleur record afin que les runs sans saisie ou incomplets comptent comme des runs terminés sans créer un record invalide.

## Capabilities

### New Capabilities
- `initial-progress-statistics`: affichage immédiat des statistiques et comparaison des runs d'un texte avec sa meilleure progression historique.

### Modified Capabilities

## Impact

- Affecte le stockage local du navigateur, les résultats Solo et le graphique de progression.
- Le contenu exact du texte identifie le record. Aucun historique de runs autres que le meilleur run n'est conservé; aucune timeline n'est stockée côté serveur.
