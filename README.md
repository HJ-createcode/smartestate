# SmartEstate

Application web de simulation et de suivi de projets immobiliers en SCI.
Authentification par email / mot de passe, persistance en base Postgres,
moteur de calcul fiscal (IR / IS) exécuté exclusivement côté serveur.

## Développement local

Prérequis : Node.js ≥ 18.17 et une base Postgres (Vercel Postgres, Neon,
Supabase ou locale).

```bash
npm install
cp .env.example .env.local
# Éditer .env.local : renseigner DATABASE_URL et AUTH_SECRET
npm run db:push   # applique le schéma Prisma à la base
npm run dev
```

L'application démarre sur http://localhost:3000.

### Sans base de données

Le site fonctionne aussi sans `DATABASE_URL` — il se comporte alors en mode
localStorage (les visiteurs peuvent tester les simulations mais pas créer
de compte). C'est pratique pour le développement UI pur.

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build de production (génère le client Prisma)
- `npm run start` — lance le build de production
- `npm run lint` — ESLint
- `npm run typecheck` — vérification TypeScript
- `npm run db:push` — applique le schéma Prisma à la base (sans migration)
- `npm run db:studio` — ouvre Prisma Studio (GUI de la base)

## Architecture

```
app/
  api/
    assets/[id]/route.ts    # CRUD d'une simulation (auth requise)
    assets/route.ts         # Liste + création
    assets/bulk-import/     # Import en masse (migration localStorage → DB)
    auth/[...nextauth]/     # NextAuth v5
    auth/signup/            # Création de compte
    calculate/              # Moteur de calcul (public, pas d'auth)
  login/                    # Page de connexion
  signup/                   # Page de création de compte
  simulation/[id]/          # Éditeur de simulation
  page.tsx                  # Dashboard
auth.ts                     # Config NextAuth avec Credentials provider
middleware.ts               # Middleware NextAuth (edge-compatible)
prisma/schema.prisma        # Modèles User, Asset (+ tables NextAuth)
lib/
  calc/                     # Moteur de calcul fiscal
  store/account.ts          # Store zustand dual (localStorage / API)
  store/inputs.ts           # Éditeur courant
  prisma.ts                 # Singleton Prisma
  auth-config.ts            # Config edge-safe (sans Prisma)
```

## Persistance des données

Deux modes co-existent :

- **Utilisateur non connecté** : le store zustand persiste ses assets dans
  le localStorage du navigateur. Pas de compte, pas de partage entre
  appareils.
- **Utilisateur connecté** : le store appelle l'API `/api/assets/*`. Les
  données sont en base Postgres, liées à son user id.

À la création de compte ou à la connexion, les assets localStorage sont
automatiquement migrés vers la DB (`/api/assets/bulk-import`).

## Déploiement sur Vercel

### 1. Connecter le repo

https://vercel.com → **Add New Project** → importer `smartestate`.

### 2. Créer la base Postgres

Dans le dashboard du projet Vercel : **Storage** → **Create Database** →
**Postgres**. Choisir la région (Paris `cdg1` recommandée). Cliquer
**Connect to Project** : Vercel injecte automatiquement les variables
`DATABASE_URL`, `POSTGRES_URL`, etc.

### 3. Configurer le secret d'authentification

**Settings → Environment Variables** → ajouter :

- `AUTH_SECRET` — généré avec `openssl rand -base64 32`

Redéployer (onglet Deployments → ⋯ → Redeploy) pour que les variables
soient prises en compte.

### 4. Appliquer le schéma à la base

Deux options :

- **Depuis ta machine** : copier `.env.local` depuis Vercel (Storage →
  bouton « .env.local »), puis `npm run db:push`.
- **Via Vercel CLI** : `vercel env pull .env.local && npm run db:push`

Tu n'as à faire ça qu'au premier déploiement et à chaque modification du
`schema.prisma`.

## Roadmap

- [ ] Paiement Stripe (abonnement 4,99 €/mois, middleware de vérification)
- [ ] Email de bienvenue + reset password
- [ ] Export PDF des résultats
- [ ] Déficit foncier reporté 10 ans
- [ ] Distribution dividendes IS (PFU vs barème)
- [ ] Comparateur de crédit
- [ ] Simulateur gratuit simplifié (landing page)
