# v0.0
ton objectif est de réaliser un site web qui est un jeu multijoueur en temps réel. le jeu est d'affronter deux utilisateurs pour qu'ils tapent des mots le plus rapidement possible.

un utilisateur démarre une partie, il envoi un lien à son adversaire.
chaque utilisateur a un champ de texte pour taper les mots. 
le jeu choisi un texte à taper pour les deux joueurs.
après que les joueurs aient indiqué être prêts, un compte à rebours de 3 secondes est lancé. à la fin du compte à rebours, le texte apparait pour les deux joueurs.

Les deux joueurs tappent le texte en même temps. Ils ont 60 secondes pour taper le plus de mots possible.

Le jeu mesure le nombre de mots par minute mais également le pourcentage de mots correctement tapés.

à la fin de la partie, on affiche un récapitulatif avec le nombre de mots par minute et le pourcentage de mots correctement tapés pour chaque joueur.

Le score d'une partie est calculé de la manière suivante:
score = (mots/minute) * (pourcentage de mots correctement tapés / 100)

le joueur avec le score le plus élevé gagne.

# v0.1
le texte doit être en français et doit être suffisament grand pour qu'un utilisateur faisant plus de 70 mots/minute ait de quoi faire pendant les 60s.
dès qu'un utilisateur utilise la touche backspace pour supprimer une lettre, le jeu compte le mot en erreur et l'indique en rouge.
un curseur indique le mot en cours de frappe pour soi-même mais aussi celui de l'adversaire.

# v0.2
la zone de texte ne doit afficher que 4 lignes de texte à la fois. la ligne courante doit être tout en haut.

# v0.3
lorsqu'un utilisateur indique "rejouer", on s'assure à nouveau que les deux joueurs sont prêts. si c'est le cas, on relance un compte à rebours et on relance le jeu.

# v0.4
lorsque l'utilisateur modifie le mot avec la touche retour arrière, il ne faut pas compter le mot en erreur. une erreur n'est comptée que lorsque l'utilisateur propose un mot qui n'est pas correct.

# v0.5
On dispose de différents textes en français sans nom propre d'une centaine de mots chacun dans des thématiques variées:
- histoire
- culture générale
- sport
- gastronomie
- cinéma
- répliques de films célèbres

attention, le premier utilisateur à rejoindre est P1, le second est P2. C'est P1 qui choisit la thématique.

# v0.6

Le score est calculé en temps réel et le joueur avec le meilleur score est affiché en haut. Quand le joueur adverse nous dépasse, un son est joué pour le signaler.

# v0.7

le texte à taper est actuellement dans le fichier server.js. il doit être mis dans un répertoire data/<catégorie>/<nom_du_fichier>
il faut créé une dizaine de fichiers par catégorie.
les fichiers sont sélectionnés de manière aléatoire une fois la catégorie choisie.

# v0.8

si un utilisateur se trouve seul dans une salle, il peut choisir de jouer seul. dans ce cas, on lance le compte à rebours et le jeu comme en duel. A la fin des 60 secondes, on calcule le score et on affiche les résultats.
si l'utilisateur rejoue tout seul, on mémorise son meilleur score. si à la fin de la partie, le joueur a battu son record, on affiche un message pour le signaler.