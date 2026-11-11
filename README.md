# famille-portail

Portail de la famille (PWA installable) : connexion, espace familial, catalogue des
mini-applications, réglages. **Aucune logique métier d'application** n'y figure.

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
npm run build     # génère dist/
```

## Déploiement (Cloudflare Pages)

- Dépôt GitHub connecté, branche de production : `main`
- Build command : `npm run build` — Output directory : `dist`
- Le fichier `.node-version` fixe la version de Node utilisée par Cloudflare.

## Choix techniques

- Le service worker du portail ne répond qu'à `/` (`navigateFallbackAllowlist`) :
  il n'interfère pas avec les mini-apps déployées sous d'autres chemins.
- Mise à jour : une bannière propose « Mettre à jour » quand une nouvelle version est prête.
- `famille-core` est figé sur une version précise (tag Git).
