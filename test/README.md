# Atelier — Gestion (clients, pièces, versements)

Application pour gérer une entreprise de haute couture : clients et
mensurations, pièces uniques (Caftan, Lebsa, Djelaba, Babouche), et
versements. Base de données réelle, accès en ligne, connexion pour 2
administrateurs. Coût : **0 DA / mois** avec les paliers gratuits ci-dessous.

## Ce que tu utilises (tout gratuit)

- **Supabase** — base de données PostgreSQL + authentification + stockage
  des photos. Palier gratuit largement suffisant pour 2 utilisateurs.
- **Vercel** — hébergement du site (déploiement en quelques clics depuis
  GitHub). Palier gratuit suffisant aussi.

Aucune carte bancaire n'est nécessaire pour ces paliers gratuits.

---

## Étape 1 — Créer le projet Supabase

1. Va sur https://supabase.com et crée un compte (gratuit).
2. Clique sur **New project**. Choisis un nom (ex. `atelier-couture`),
   un mot de passe pour la base de données (garde-le de côté), et une
   région proche de vous.
3. Attends 1–2 minutes que le projet soit prêt.

## Étape 2 — Créer les tables (base de données)

1. Dans le menu de gauche du dashboard Supabase, ouvre **SQL Editor**.
2. Clique sur **New query**.
3. Ouvre le fichier `supabase/schema.sql` (fourni avec ce projet), copie
   tout son contenu, colle-le dans l'éditeur SQL, puis clique **Run**.
4. Tu devrais voir "Success. No rows returned." — les tables, les vues
   de calcul (totaux) et les règles de sécurité sont créées.

## Étape 3 — Créer vos 2 comptes administrateurs

Il n'y a pas de page d'inscription publique (volontairement, pour la
sécurité) : vous créez vos deux comptes directement dans Supabase.

1. Dans le menu de gauche, ouvre **Authentication** puis l'onglet **Users**.
2. Clique **Add user** → **Create new user**.
3. Renseigne ton email et un mot de passe. Coche **Auto Confirm User**.
4. Répète l'opération pour le compte de ton père.

## Étape 4 — Récupérer les clés du projet

1. Dans le menu de gauche, ouvre **Project Settings** (icône d'engrenage)
   puis **API**.
2. Note les deux valeurs suivantes, elles serviront à l'étape 6 :
   - **Project URL**
   - **anon public** key

## Étape 5 — Mettre le code sur GitHub

1. Crée un compte gratuit sur https://github.com si tu n'en as pas.
2. Crée un nouveau dépôt (repository), par exemple `atelier-couture`.
3. Mets tout le contenu de ce dossier de projet dans ce dépôt (via
   l'interface GitHub "upload files", ou en ligne de commande avec `git`).

## Étape 6 — Déployer sur Vercel

1. Va sur https://vercel.com et crée un compte gratuit (tu peux te
   connecter directement avec ton compte GitHub).
2. Clique **Add New… → Project**, puis choisis le dépôt GitHub que tu
   viens de créer.
3. Avant de cliquer "Deploy", ouvre la section **Environment Variables**
   et ajoute :
   - `NEXT_PUBLIC_SUPABASE_URL` → l'URL notée à l'étape 4
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → la clé "anon public" notée à
     l'étape 4
4. Clique **Deploy**. Après 1–2 minutes, Vercel te donne une adresse du
   type `https://atelier-couture.vercel.app` — c'est ton site, en ligne,
   accessible par toi et ton père depuis n'importe quel navigateur.

## Utilisation

- Connectez-vous avec les comptes créés à l'étape 3.
- **Clients** : liste, fiche détaillée avec mensurations, historique des
  pièces et totaux.
- **Pièces** : création liée à un client, photo, prix, statut, notes.
- Sur la fiche d'une pièce, ajoutez autant de versements que nécessaire ;
  le total versé et le reste à payer se calculent automatiquement, au
  niveau de la pièce et au niveau du client.

## Développement local (facultatif)

Si tu veux lancer le site sur ton ordinateur avant de le mettre en ligne :

```bash
npm install
cp .env.local.example .env.local
# puis remplis .env.local avec tes propres valeurs (étape 4)
npm run dev
```

Le site sera disponible sur http://localhost:3000

## Notes

- Les prix sont affichés en DA (dinar algérien) ; c'est juste un libellé
  d'affichage, modifiable dans le code si besoin (chercher `'DA'` dans
  les fichiers de `app/`).
- Un client ne peut pas être supprimé tant qu'il a des pièces
  enregistrées (protection contre la perte accidentelle d'historique) —
  supprimez ou réassignez d'abord ses pièces.
- Supprimer une pièce supprime aussi ses versements associés.
