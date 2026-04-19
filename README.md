# SmartEstate

Simulateur web de projet immobilier en SCI : analyse détaillée du comparatif
IR vs IS, amortissement du prêt, plus-value et cash-flow sur 10 ans.

La logique de calcul est exécutée exclusivement côté serveur via une API
route Next.js, afin qu'elle ne soit jamais exposée au navigateur.

## Développement local

Prérequis : Node.js ≥ 18.17.

```bash
npm install
npm run dev
```

L'application démarre sur http://localhost:3000.

## Scripts disponibles

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run start` — lance le build de production
- `npm run lint` — ESLint
- `npm run typecheck` — vérification TypeScript

## Structure

- `lib/calc/` — moteur de calcul TypeScript
  - `constants.ts` — barèmes fiscaux (IR, IS, PS, abattements PV). À mettre à
    jour chaque année avec la loi de finances.
  - `notaire.ts`, `loan.ts`, `depreciation.ts`, `ir.ts`, `is.ts`, `sale.ts`,
    `tax.ts` — modules spécialisés
  - `index.ts` — orchestrateur appelé par l'API
- `app/api/calculate/route.ts` — endpoint POST (serveur uniquement)
- `app/page.tsx` — application single-page avec sidebar
- `components/forms/` — formulaires par section
- `components/Results.tsx` — dashboard (KPIs, graphiques Recharts, tables)

## Publier sur GitHub

Depuis ce dossier (`web/`) :

```bash
git init
git add .
git commit -m "Initial commit — SmartEstate MVP"
git branch -M main
git remote add origin git@github.com:<ton-compte>/smartestate.git
git push -u origin main
```

## Déployer sur Vercel

### Option A — via l'interface web (recommandé la première fois)

1. Crée un compte sur https://vercel.com (Sign in with GitHub).
2. Clique **Add New → Project**, sélectionne le repo `smartestate`.
3. Vercel détecte automatiquement Next.js. Laisse les réglages par défaut :
   - **Framework Preset** : Next.js
   - **Build Command** : `next build`
   - **Output Directory** : `.next`
   - **Install Command** : `npm install`
4. Clique **Deploy**. L'URL publique est disponible en ~1 minute.

### Option B — via la CLI

```bash
npm i -g vercel
vercel login
vercel         # déploiement preview
vercel --prod  # déploiement production
```

### Variables d'environnement

Pour le MVP actuel aucune variable n'est requise. Quand l'auth et Stripe
seront branchés, ajoute-les dans **Vercel → Project → Settings → Environment
Variables** en reprenant les clés de `.env.example`.

## Roadmap (hors MVP)

- Authentification + paiement Stripe (abonnement 4,99 €/mois)
- Export PDF des résultats
- Déficit foncier reporté 10 ans
- Distribution de dividendes IS avec choix PFU / barème par associé
- Comparateur de crédit (2 scénarios côte à côte)
- Stockage des simulations (Postgres / Supabase)
- Simulateur gratuit simplifié en landing page

## Notes

- Les textes, libellés et la mise en forme sont originaux.
- Les barèmes et formules fiscales proviennent du Code général des impôts
  et de fonctions financières standard (`PMT`, `IPMT`, `PPMT`).
