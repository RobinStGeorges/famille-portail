# famille-portail

Portail de la famille (PWA installable) : connexion, espace familial, catalogue des
mini-applications, réglages. **Aucune logique métier d'application** n'y figure.

## Familles multiples

Une personne peut appartenir à **plusieurs familles** (ex. famille A avec son épouse, famille B avec sa mère et sa
sœur). Les données de chaque famille sont totalement séparées (`families/{id}/apps/…`).

- **Mes familles** (`#/familles`) : une tuile par famille (clic = choisir cette famille), tuiles « Créer une
  famille » et « Rejoindre avec un code ». Accessible depuis l'accueil (pastille avec le nom de la famille, à côté
  du titre) et depuis les réglages.
- **Rond rouge avec croix blanche**, en haut à droite de chaque tuile, avec fenêtre de confirmation :
  - *propriétaire* → **supprime** la famille pour tous ses membres (définitif) ;
  - *simple membre* → **quitte** la famille (elle reste intacte pour les autres).
- La **famille active** est le champ `familyId` du profil, que toutes les applications lisent déjà : changer de
  famille ne demande **aucune modification des applications**.
- Les comptes existants sont migrés automatiquement : la famille actuelle est ajoutée à leur liste au premier chargement.
- Supprimer une famille la rend inaccessible ; ses données restent stockées jusqu'à une purge d'administration
  (voir `famille-infra`).

## Principe

- Le portail lit le catalogue dans Firestore (`catalog/{appId}`) et affiche une tuile par app.
- Ajouter, masquer ou mettre en maintenance une app = modifier sa fiche dans le catalogue.
  Le code du portail ne change jamais.
- Chaque app vit dans son propre dépôt, son propre déploiement, sous `/<appId>/`.

## Fiche catalogue (document `catalog/{appId}`)

| Champ | Type | Exemple |
|---|---|---|
| `name` | texte | `Courses` |
| `description` | texte | `Nos listes de courses` |
| `icon` | emoji | `🛒` |
| `color` | `#rrggbb` | `#e07a2f` |
| `path` | texte | `/courses/` |
| `status` | `active` / `maintenance` / `hidden` | `active` |
| `order` | nombre | `10` |

## Environnements

| Commande | Fichier utilisé | Projet Firebase |
|---|---|---|
| `npm run dev` | `.env.development` | `famille-dev` |
| `npm run build` | `.env.production` | `famille-prod` |

Les valeurs Firebase (clés « web ») ne sont **pas secrètes** : la sécurité repose sur les
règles Firestore (dépôt `famille-infra`), pas sur le secret de ces clés.

## Commandes

```
npm install
npm run dev       # http://localhost:5173
npm run check     # vérification des types
npm test          # écran « Mes familles » : tuiles, choix, suppression / départ avec confirmation, création, jonction
npm run build     # génère dist/
```

## Déploiement (Cloudflare Workers, fichiers statiques)

- Dépôt GitHub connecté, branche de production : `main`
- Build command : `npm run build` — Deploy command : `npx wrangler deploy` (config : `wrangler.jsonc`)
- Le fichier `.node-version` fixe la version de Node utilisée par Cloudflare.

## Choix techniques

- Le service worker du portail ne répond qu'à `/` (`navigateFallbackAllowlist`) :
  il n'interfère pas avec les mini-apps déployées sous d'autres chemins.
- Mise à jour : une bannière propose « Mettre à jour » quand une nouvelle version est prête.
- `famille-core` est figé sur une version précise (tag Git).
