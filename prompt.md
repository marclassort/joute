## 0. Contexte du projet

Tu travailles sur **Joute**, une application mobile de quiz (Expo / React Native, TypeScript, expo-router, NativeWind, authentification Clerk), cible Android + iOS.

Objectif de ce chantier : remplacer l'onglet **Insights** par un onglet **Joute** qui contient l'intégralité du mode **duel asynchrone 1 contre 1**.

Contraintes générales, valables pour tous les lots :

- **TypeScript strict**, aucun `any`, aucun `@ts-ignore`.
- Branche `dev`, commits conventionnels (`feat:`, `fix:`, `refactor:`), une pull request en fin de lot.
- **N'installe aucune dépendance sans me demander d'abord** : annonce le paquet, sa taille et pourquoi il est nécessaire.
- Réutilise l'existant : NativeWind, les polices déjà configurées, les composants et la palette déjà en place. Ne réintroduis pas de `StyleSheet.create` si le projet utilise NativeWind.
- Pas de code mort, pas de fichier « au cas où », pas de commentaire qui paraphrase le code.
- Tout le texte affiché est en **français**, en minuscules de phrase, à la voix active, sans jargon technique côté utilisateur.
- **Ne lis pas tout le dépôt.** Ouvre uniquement les fichiers dont tu as besoin, et dis-moi lesquels tu ouvres avant de le faire.

---

## 1. Règles du jeu à implémenter

### 1.1 Structure d'une partie

- Une partie oppose **2 joueurs** et compte **8 manches**.
- Chaque manche = **1 thème** + **3 questions à choix multiples** (4 propositions, 1 seule correcte).
- Soit **24 questions** par partie, les **mêmes pour les deux joueurs**, dans le **même ordre**, avec les propositions dans le **même ordre** (c'est un duel « miroir » : la comparaison doit être lisible à la fin).
- Un **thème déjà utilisé dans la partie ne peut pas être rejoué** : les 8 manches ont 8 thèmes distincts.

### 1.2 Choix des thèmes et alternance des tours

Le choix des thèmes alterne. Le joueur qui ouvre une manche choisit son thème parmi **3 thèmes tirés au sort** dans les thèmes encore disponibles (jamais la liste complète : le tirage crée la tension).

Déroulé exact, avec `P1` = créateur de la partie, `P2` = invité :

| Tour | Joueur | Action |
|---|---|---|
| 1 | P1 | choisit le thème de la manche 1, joue la manche 1 |
| 2 | P2 | joue la manche 1, choisit le thème de la manche 2, joue la manche 2 |
| 3 | P1 | joue la manche 2, choisit le thème de la manche 3, joue la manche 3 |
| … | … | … |
| 8 | P2 | joue la manche 7, choisit le thème de la manche 8, joue la manche 8 |
| 9 | P1 | joue la manche 8 → partie terminée |

P1 choisit donc les thèmes des manches impaires, P2 ceux des manches paires. Un tour = « je rattrape la manche que l'adversaire a ouverte, puis j'en ouvre une nouvelle ».

> Note d'architecture : c'est pour cela que le statut de la partie ne suffit pas ; il faut un champ `currentTurnPlayerId` et un `currentRoundIndex`. Voir le modèle de données.

### 1.3 Questions, temps et score

- **15 secondes** par question, décompte visible. À l'expiration : réponse considérée comme fausse, on enchaîne.
- **1 point par bonne réponse.** Pas de bonus de rapidité (le second joueur ne doit pas être avantagé ou pénalisé par une information qu'il n'a pas), mais le **temps de réponse est enregistré** et affiché dans l'écran de résultats.
- Score final sur 24. **L'égalité est un résultat valide** (« match nul »), ne l'arbitre pas.
- Une fois une réponse validée, **aucun retour en arrière**, et on ne montre **pas** immédiatement si c'est juste ou faux pendant la manche : le verdict tombe à la fin de la manche (récapitulatif des 3 questions), puis à la fin de la partie. Cela évite qu'un joueur devine le niveau de l'adversaire en cours de route.

### 1.4 Expiration

- Un tour non joué **48 h** après son ouverture fait passer la partie en `expired`.
- La partie expirée est perdue par le joueur dont c'était le tour, sauf si aucun des deux n'a joué (alors elle est simplement annulée).
- L'expiration est **calculée à la lecture** (`expiresAt` comparé à `Date.now()`), jamais par un minuteur en mémoire : l'application peut être fermée pendant deux jours.

### 1.5 Adversaire aléatoire — mode « fantôme »

Il n'y a pas encore de serveur d'appariement. Un adversaire aléatoire est donc un **profil fantôme** local :

- pool d'une dizaine de profils (pseudo, avatar, niveau) dans `src/data/ghosts.ts` ;
- chaque fantôme a un **taux de réussite** (entre 0,45 et 0,80) et une **variance par thème** (fort en sport, faible en sciences, etc.) ;
- il « joue » son tour après un **délai simulé aléatoire** (2 à 20 minutes) et des temps de réponse plausibles (3 à 12 s) ;
- ses réponses fausses sont tirées parmi les distracteurs, jamais au hasard uniforme sur les 4 propositions.

**Impératif** : le fantôme doit passer par **exactement la même interface** que le futur adversaire réel (`OpponentDriver`), pour que le basculement vers un vrai backend ne touche pas l'interface utilisateur. Prévois aussi un badge discret (`profil de démonstration`) affichable via un flag `__DEV__` ou une préférence, pour que l'on puisse plus tard décider de l'assumer côté utilisateur.

---

## 2. Modèle de données

À placer dans `src/game/types.ts`. Types purs, sans dépendance à React ni au stockage.

```ts
type Category =
  | 'histoire' | 'geographie' | 'sciences' | 'nature' | 'arts'
  | 'musique' | 'cinema' | 'sport' | 'societe' | 'culture-pop'
  | 'gastronomie' | 'langue' | 'logique' | 'insolite' | 'actualite';

type MatchStatus = 'pending' | 'active' | 'completed' | 'expired';

interface Player {
  id: string;              // Clerk userId, ou id du fantôme
  displayName: string;
  avatarUrl: string | null;
  isGhost: boolean;
}

interface Answer {
  questionId: string;
  playerId: string;
  selectedIndex: number | null;   // null = temps écoulé
  isCorrect: boolean;
  elapsedMs: number;
  answeredAt: number;
}

interface Round {
  index: number;               // 0..7
  category: Category;
  chosenBy: string;            // playerId
  questionIds: [string, string, string];
  answers: Answer[];           // 0 à 6 entrées
}

interface Match {
  id: string;
  status: MatchStatus;
  players: [Player, Player];   // [0] = créateur
  rounds: Round[];
  currentRoundIndex: number;
  currentTurnPlayerId: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;           // updatedAt + 48h
  invitationCode: string | null;
}
```

Statuts : `pending` (invitation envoyée, l'adversaire n'a pas encore rejoint) → `active` (dès que les deux joueurs sont là) → `completed` (24 réponses de chaque côté) ou `expired`.

**Pourquoi ce découpage plutôt que `player1_played`** : avec 8 manches et une alternance des thèmes, il y a 9 tours, pas 2 ; un statut binaire ne peut pas les représenter. `currentTurnPlayerId` porte l'information « à qui la main », le statut porte le cycle de vie. Si tu vois un meilleur découpage, propose-le avant de coder, ne le décide pas seul.

### Questions

```ts
interface Question {
  id: string;
  category: Category;
  difficulty: 1 | 2 | 3;
  statement: string;
  choices: [string, string, string, string];
  correctIndex: number;
  explanation: string;      // 1 à 2 phrases, affichées dans la modale de résultat
  source?: string;          // URL ou référence, obligatoire pour 'actualite'
  perishable: boolean;      // true uniquement pour 'actualite'
  validUntil?: string;      // ISO, obligatoire si perishable
}
```

---

## 3. Architecture

L'objectif est que **la logique de jeu soit testable sans React et que le stockage soit remplaçable par une API sans toucher aux écrans**.

```
src/
  game/
    types.ts
    rules.ts          # fonctions pures : scoring, tour suivant, thèmes disponibles, expiration
    engine.ts         # transitions d'état : createMatch, chooseCategory, submitAnswer, resolveTurn
    rules.test.ts
    engine.test.ts
  data/
    questions/
      histoire.ts ... actualite.ts
      index.ts        # agrège, valide l'unicité des ids au chargement
    ghosts.ts
  services/
    matchRepository.ts        # interface MatchRepository
    localMatchRepository.ts   # implémentation AsyncStorage
    opponentDriver.ts         # interface + GhostOpponentDriver
    notifications.ts          # interface + implémentation locale (expo-notifications)
  features/joute/
    screens/ components/ hooks/
app/(tabs)/joute.tsx
```

Règles :

- `src/game/**` ne doit **rien** importer de React, d'Expo ou d'AsyncStorage. Que des fonctions pures.
- Les écrans n'accèdent jamais directement à AsyncStorage : ils passent par le repository, exposé via un hook (`useMatches`, `useMatch(id)`).
- État global : Zustand **ou** Context + reducer, au choix, mais un seul mécanisme dans tout le projet. Justifie ton choix en une phrase.
- Toute la sélection de questions passe par une seule fonction `pickQuestions(category, count, excludeIds)`, avec une graine (`seed`) stockée dans le match pour être reproductible.

---

## 4. Écrans

### 4.1 Onglet « Joute » (écran d'accueil du mode)

Renomme l'onglet **Insights** en **Joute** : label, icône, route (`app/(tabs)/insights.tsx` → `app/(tabs)/joute.tsx`), et corrige toutes les références. Aucune route morte ne doit subsister.

Contenu, de haut en bas :

1. **En-tête profil** — photo Clerk (`user.imageUrl`), nom ou pseudo, et une ligne de statistiques compacte : victoires / défaites / nuls, et série en cours. Rien de plus : c'est un en-tête, pas un tableau de bord.
2. **Bouton « Nouvelle partie »** — action principale, visuellement dominante. Ouvre une feuille modale à deux choix : *inviter un ami* (génère un lien) ou *adversaire aléatoire* (démarre immédiatement).
3. **À toi de jouer** — parties où `currentTurnPlayerId === moi`. Triées par `expiresAt` croissant. Chaque carte : avatar + pseudo de l'adversaire, manche en cours (« manche 3 sur 8 »), score provisoire, et le temps restant avant expiration (passe en état d'alerte sous 6 h).
4. **En attente** — parties où c'est le tour de l'adversaire, et invitations non encore acceptées.
5. **Terminées** — avatar + pseudo des deux joueurs, résultat, score final. Appui → écran de résultat.

Chaque section a un **état vide utile** : une phrase qui dit quoi faire, pas « aucune donnée ». Exemple : « aucune partie en cours — lance un défi pour commencer ».

### 4.2 Création par lien

- Génère un code court (8 caractères, alphabet sans caractères ambigus) et un lien profond `joute://match/<code>`.
- Partage via `expo-sharing` / `Share` natif, avec un texte prérempli.
- À l'ouverture du lien : si l'utilisateur est connecté, il rejoint ; sinon Clerk le fait passer par la connexion **puis** le renvoie sur la partie (mémorise le code avant l'authentification).
- Un code ne peut être utilisé qu'une fois, et pas par son auteur.

### 4.3 Écran de jeu

- **Choix du thème** : 3 cartes de thème tirées au sort parmi les disponibles, avec l'icône et la couleur du thème. Une fois choisi, transition vers la première question.
- **Question** : numéro de question (« 2 / 3 ») et de manche, barre de temps de 15 s, énoncé, 4 propositions. Un seul appui possible, retour haptique, feedback visuel neutre (sélection confirmée, pas de vert ni de rouge).
- **Fin de manche** : les 3 questions, juste/faux, la bonne réponse et l'explication, et le score de la manche. Si l'adversaire a déjà joué cette manche, montre sa performance en regard.
- **Fin de partie** : bascule vers l'écran de résultat.

Interdits : quitter en cours de manche ne doit ni annuler ni valider en silence — si l'application est tuée en pleine manche, les réponses déjà soumises sont conservées et la manche reprend à la question suivante.

### 4.4 Écran de résultat (partie terminée)

- Verdict en grand : **« tu as gagné »**, **« tu as perdu »**, **« match nul »**.
- Les deux avatars + pseudos face à face, avec le score final (nombre de bonnes réponses sur 24).
- Statistiques du match : meilleur thème de chacun, temps de réponse moyen, plus longue série de bonnes réponses, nombre de manches remportées.
- Bouton **« revanche »** qui crée une nouvelle partie avec le même adversaire, thèmes remis à zéro.
- Appui sur « détail des manches » → écran des 8 manches.

### 4.5 Écran des 8 manches

- Rappel en haut : les deux avatars + pseudos + score.
- Une ligne par manche : thème, qui l'a choisi, et **3 pastilles par joueur** (une par question), juste / faux, avec une icône en plus de la couleur (`✓` / `✕`) pour rester lisible en cas de daltonisme.
- Appui sur une question → **modale**.

### 4.6 Modale de question

- L'énoncé.
- Les 4 propositions, avec :
    - la bonne réponse mise en évidence,
    - **ma** réponse (avatar réduit à gauche de la proposition choisie),
    - la réponse **de l'adversaire** (son avatar, de la même façon) ;
    - si les deux ont choisi la même, les deux avatars côte à côte.
- Le temps de réponse de chacun.
- L'explication de la question.
- Navigation par balayage entre les 24 questions du match, sans repasser par la liste.

---

## 5. Qualité — ce qui fait la différence entre un quiz correct et un jeu qu'on rouvre

Applique ces points, ils font partie du travail attendu :

- **Rythme.** Aucune attente inutile : les 24 questions sont déjà en mémoire, aucune roue de chargement entre deux questions. Transition de 200 à 300 ms maximum entre les questions (`react-native-reanimated`, déjà présent avec Expo).
- **Retour haptique** (`expo-haptics`) : léger à la sélection, succès en fin de manche gagnée, échec sur une manche perdue. Jamais pendant le décompte.
- **Le décompte est une tension, pas un stress.** Barre qui se vide, changement de couleur dans les 4 dernières secondes, pas de son par défaut.
- **Réduction de mouvement** : respecte `useReducedMotion`, coupe les animations non essentielles.
- **États de chargement** : squelettes, jamais de spinner plein écran sur l'onglet Joute.
- **Erreurs** : elles disent ce qui s'est passé et quoi faire (« impossible de rejoindre cette partie : le lien a déjà été utilisé »), elles ne s'excusent pas et ne sont jamais vagues.
- **Accessibilité** : cibles tactiles de 44 pt minimum, `accessibilityLabel` sur chaque proposition, contraste AA, information jamais portée par la seule couleur.
- **Cohérence du vocabulaire** : le bouton dit « lancer un défi », la notification dit « ton défi t'attend », l'écran dit « défi ». Un mot, un sens, partout.

---

## 6. Notifications

- Abstrais tout derrière `services/notifications.ts`. Implémentation actuelle : **notifications locales** `expo-notifications` (il n'y a pas encore de serveur pour du push distant).
- Trois déclencheurs : c'est ton tour, la partie est terminée, il te reste 6 h avant expiration.
- Demande la permission **au moment utile** (après la première partie créée), jamais au premier lancement.
- Prépare, sans l'implémenter, l'enregistrement du token Expo Push et un `RemoteNotificationService` : laisse l'interface prête et un `TODO` explicite.

---

## 7. Contenu des questions

Crée `src/data/questions/<categorie>.ts` avec **au moins 3 questions par catégorie**, en dur, pour les 15 catégories :

`histoire`, `geographie`, `sciences`, `nature`, `arts`, `musique`, `cinema`, `sport`, `societe`, `culture-pop`, `gastronomie`, `langue`, `logique`, `insolite`, `actualite`.

Règles de rédaction, strictes :

1. **Un seul énoncé factuel, une seule réponse correcte, indiscutable.** Pas de « quel est le plus beau », pas de « environ ».
2. **Pas de fait dont tu n'es pas certain.** Si tu hésites sur une date, un chiffre ou un nom, choisis une autre question. Mieux vaut 3 questions sûres que 5 approximatives.
3. **Les distracteurs doivent être plausibles** et de même nature que la bonne réponse (trois pays si la réponse est un pays, trois dates du même siècle si la réponse est une date). Jamais de distracteur absurde.
4. Jamais de « toutes ces réponses », « aucune de ces réponses », ni de négation dans l'énoncé.
5. La bonne réponse est **répartie uniformément** entre les index 0 à 3 sur l'ensemble du corpus.
6. L'énoncé tient sur **deux lignes maximum** sur un écran de téléphone.
7. `explanation` : 1 à 2 phrases, qui apprennent quelque chose au joueur.
8. **`actualite` est isolée** : `perishable: true`, `source` et `validUntil` obligatoires, et cette catégorie **n'entre pas dans le tirage des thèmes** tant qu'un mécanisme de mise à jour n'existe pas. Ajoute un test qui échoue si une question périmée est servie.

Exemple de format attendu :

```ts
{
  id: 'geo-001',
  category: 'geographie',
  difficulty: 1,
  statement: 'Quel fleuve traverse Budapest ?',
  choices: ['Le Danube', 'La Vistule', "L'Elbe", 'Le Rhône'],
  correctIndex: 0,
  explanation: 'Le Danube sépare Buda, sur la rive ouest, de Pest, sur la rive est.',
  perishable: false,
}
```

Un test doit vérifier, pour tout le corpus : unicité des `id`, `correctIndex` entre 0 et 3, exactement 4 propositions non vides et distinctes, `explanation` non vide, et cohérence `perishable` / `validUntil`.

---

## 8. Tests attendus

Tests unitaires (`jest-expo`) sur la logique pure, pas sur l'interface :

- score et verdict, y compris l'égalité ;
- alternance des tours sur les 9 tours d'une partie complète ;
- impossibilité de rejouer un thème déjà utilisé ;
- tirage de 3 thèmes toujours issu des thèmes disponibles, et gestion du cas « moins de 3 thèmes restants » ;
- expiration à 48 h, y compris à la relecture après fermeture de l'application ;
- impossibilité de répondre deux fois à la même question ;
- validation du corpus de questions.

---

## 9. Découpage en lots

Traite **un lot à la fois**, en t'arrêtant à la fin de chacun pour que je valide.

- **Lot 1 — fondations.** Renommage Insights → Joute, types, `rules.ts`, `engine.ts`, tests de la logique. Aucune interface, aucun stockage.
- **Lot 2 — contenu.** Les 15 fichiers de questions + validation du corpus + `ghosts.ts`.
- **Lot 3 — persistance et adversaire.** `MatchRepository` local, `GhostOpponentDriver`, hooks.
- **Lot 4 — écran Joute.** En-tête profil, nouvelle partie, les trois sections, états vides.
- **Lot 5 — boucle de jeu.** Choix du thème, questions, fin de manche.
- **Lot 6 — résultats.** Écran de résultat, écran des manches, modale de question.
- **Lot 7 — invitations et notifications.** Lien profond, code d'invitation, notifications locales.

Avant de commencer le lot 1 : **résume-moi en dix lignes maximum ce que tu vas faire, les fichiers que tu vas créer ou modifier, et les points sur lesquels tu n'es pas sûr.** N'écris pas une ligne de code avant ma validation.