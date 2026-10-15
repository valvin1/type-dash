## Why

Les résultats de fin de partie résument la performance par un score global, sans montrer comment la vitesse a évolué pendant la frappe. Une courbe temporelle et des repères d'erreur rendent les hésitations et les progrès visibles, en solo comme en course multijoueur.

## What Changes

- Ajouter aux résultats de fin de partie un graphique agréable et lisible du WPM au fil du temps.
- Afficher une série distincte pour chaque joueur en multijoueur, des marqueurs rouges lorsqu'un mot est validé avec une erreur et des marqueurs orange lorsqu'une suppression de caractère signale une hésitation.
- Produire des mesures régulières à un intervalle adapté à la durée, sans laisser plus d'une seconde entre deux mesures, et transmettre les données avec les résultats de la manche.
- Garder ces données limitées à la manche en mémoire; aucun historique permanent n'est ajouté.

## Capabilities

### New Capabilities
- `typing-speed-chart`: Mesure temporaire et visualisation des évolutions de WPM, des erreurs de mot et des hésitations après une partie.

### Modified Capabilities

## Impact

- Affecte `public/client.js`, `public/index.html`, les styles de `public/`, et le flux socket de résultat dans `server.js`.
- Les résultats de fin de manche transporteront les séries temporelles, erreurs de mot et hésitations pour chaque joueur; la logique existante de score, podium et fantôme reste applicable.
- Aucun service externe, stockage durable ou dépendance graphique n'est requis.
