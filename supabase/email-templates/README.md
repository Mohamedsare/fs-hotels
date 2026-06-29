# E‑mails FasoStock Hôtels — Resend + Supabase

Ce dossier contient les **templates HTML** des e‑mails et explique comment faire
en sorte que **Resend** envoie les mails à la place du serveur SMTP par défaut de
Supabase (limité et peu fiable en production).

## Vue d'ensemble : 2 catégories d'e‑mails

| E‑mail | Émis par | Comment | Template |
| --- | --- | --- | --- |
| Confirmation d'inscription | Supabase Auth | SMTP Resend | `confirm-signup.html` |
| Réinitialisation mot de passe | Supabase Auth | SMTP Resend | `reset-password.html` |
| Lien magique (connexion) | Supabase Auth | SMTP Resend | `magic-link.html` |
| Changement d'adresse e‑mail | Supabase Auth | SMTP Resend | `change-email.html` |
| Invitation d'un membre | Supabase Auth | SMTP Resend | `invite-user.html` |
| **Bienvenue** (après activation) | **Votre code** | **API Resend** | `welcome.html` |

> 🔑 Idée clé : Supabase n'envoie **pas** de « mail de bienvenue ». Les 5 premiers
> sont des e‑mails d'**authentification** : Supabase les génère, et on lui dit juste
> de **passer par le SMTP de Resend**. Le mail de bienvenue, lui, est envoyé par
> notre application directement via l'**API Resend**.

---

## 1. Créer et vérifier un domaine sur Resend

1. Crée un compte sur https://resend.com.
2. **Domains → Add Domain** → saisis `fasostock.com` (le domaine d'envoi).
3. Resend affiche des enregistrements DNS à ajouter chez ton registrar :
   - **SPF** (TXT)
   - **DKIM** (CNAME/TXT)
   - **DMARC** (TXT, recommandé)
4. Attends la **vérification** (statut vert). Sans domaine vérifié, tes mails
   partiront en spam ou seront refusés.
5. **API Keys → Create API Key** → copie la clé `re_…` (tu ne la reverras plus).

> Adresse d'expéditeur : utilise une adresse **de ton domaine vérifié**, ex.
> `no-reply@fasostock.com` ou `bienvenue@fasostock.com`.

---

## 2. Brancher Resend en SMTP dans Supabase (e‑mails d'auth)

Dashboard Supabase → **Authentication → Emails → SMTP Settings** (ou
*Project Settings → Authentication → SMTP*) → active **« Use a custom SMTP server »** :

| Champ | Valeur |
| --- | --- |
| Host | `smtp.resend.com` |
| Port | `465` (SSL) — sinon `587` (TLS) |
| Username | `resend` |
| Password | **ta clé API Resend** (`re_…`) |
| Sender email | `no-reply@fasostock.com` (domaine vérifié) |
| Sender name | `FasoStock Hôtels` |

Enregistre. (Optionnel : **Auth → Rate Limits** pour relever la limite d'envoi,
basse par défaut.)

---

## 3. Coller les templates dans Supabase

Dashboard Supabase → **Authentication → Emails → Templates**. Pour chaque onglet,
colle le contenu du fichier correspondant **et** adapte l'objet (« Subject ») :

| Onglet Supabase | Fichier | Objet suggéré |
| --- | --- | --- |
| Confirm signup | `confirm-signup.html` | `Confirmez votre adresse — FasoStock Hôtels` |
| Reset Password | `reset-password.html` | `Réinitialisez votre mot de passe` |
| Magic Link | `magic-link.html` | `Votre lien de connexion` |
| Change Email Address | `change-email.html` | `Confirmez votre nouvelle adresse` |
| Invite user | `invite-user.html` | `Vous êtes invité sur FasoStock Hôtels` |

### Variables Supabase (ne pas modifier)
Les templates utilisent la syntaxe Go de Supabase. **Ils sont déjà câblés pour le
flux serveur** (`@supabase/ssr`) : les boutons pointent vers la route
`/auth/confirm` de l'app avec un `token_hash`, par ex. :

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password
```

- `{{ .SiteURL }}` — URL de base de l'app (définie dans URL Configuration)
- `{{ .TokenHash }}` — jeton vérifié côté serveur par `verifyOtp`
- `{{ .Token }}` — code à 6 chiffres (OTP), affiché en secours (reset / magic link)
- `{{ .Email }}` / `{{ .NewEmail }}` — adresses (signup / changement d'e‑mail)

> ⚠️ Ne remets PAS `{{ .ConfirmationURL }}` : il utilise le flux implicite qui ne
> crée pas de session côté serveur. Le `token_hash` + `/auth/confirm` est le flux
> recommandé pour Next.js App Router.

### URLs à configurer
**Authentication → URL Configuration** :
- **Site URL** : `https://hotels.fasostock.com` (ou `http://localhost:3000` en dev)
  — c'est elle qui remplit `{{ .SiteURL }}` dans les liens.
- **Redirect URLs** : ajoute `https://hotels.fasostock.com/**` (et
  `http://localhost:3000/**` en dev).

### Routes & pages de l'app (déjà implémentées)
| Route | Rôle |
| --- | --- |
| `GET /auth/confirm` | Vérifie le `token_hash` (`verifyOtp`), ouvre la session, redirige vers `next`. |
| `/auth/forgot-password` | Saisie de l'e‑mail → `resetPasswordForEmail`. |
| `/auth/reset-password` | Saisie du nouveau mot de passe → `updateUser`. |
| `/auth/auth-error` | Lien invalide/expiré → propose de renvoyer un lien. |

Le lien « Mot de passe oublié ? » est présent sur `/login`.

---

## 4. Tester

1. Dans l'app, crée un compte (`/signup`).
2. Vérifie l'arrivée du mail (regarde **Resend → Logs** pour le statut de livraison).
3. Pour le reset : déclenche `supabase.auth.resetPasswordForEmail(email)` (à câbler
   avec la brique mot de passe oublié).

> Astuce : pour prévisualiser un template sans envoyer, ouvre simplement le `.html`
> dans un navigateur. Les `{{ … }}` resteront littéraux, c'est normal.

---

## 5. Mail de bienvenue (API Resend, par notre code)

Le code est déjà fourni dans [`lib/email/welcome.ts`](../../lib/email/welcome.ts).
Le HTML y est **inline** (pas de lecture disque) pour rester fiable en serverless
(Vercel). Le fichier `welcome.html` de ce dossier n'est qu'un **aperçu visuel**.

### a) Installer le SDK (optionnel — le helper utilise `fetch`, donc rien d'obligatoire)
Le helper appelle l'API REST Resend via `fetch`, donc **aucune dépendance** n'est
nécessaire. (Si tu préfères le SDK : `npm i resend`.)

### b) Variables d'environnement (`.env.local`)
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM="FasoStock Hôtels <bienvenue@fasostock.com>"
NEXT_PUBLIC_APP_URL=https://hotels.fasostock.com
```

### c) Quand l'envoyer ?
Le bon moment est **après confirmation du compte** / **création de l'hôtel**.
L'endroit le plus simple : à la fin de `createHotel` dans
[`app/onboarding/actions.ts`](../../app/onboarding/actions.ts) :

```ts
import { sendWelcomeEmail } from "@/lib/email/welcome";

// … après l'insertion réussie de l'hôtel et des tax_settings :
if (user.email) {
  // Non bloquant : on n'échoue pas l'onboarding si l'e-mail ne part pas.
  void sendWelcomeEmail({ to: user.email, hotelName: name }).catch(() => {});
}
```

> Le template `welcome.html` contient les marqueurs `{{HOTEL_NAME}}` et `{{APP_URL}}`
> que `sendWelcomeEmail` remplace automatiquement.

### Alternative (avancée) : tout passer par Resend via un *Send Email Hook*
Supabase propose un **Auth Hook → Send Email Hook** qui délègue *tous* les e‑mails
d'auth à une Edge Function. Plus puissant (templates en code, multi‑langue) mais
plus lourd à mettre en place que le SMTP. Le SMTP (étapes 2‑3) suffit pour 99 % des
besoins ; garde le hook en tête pour plus tard.

---

## Récapitulatif checklist

- [ ] Domaine ajouté + vérifié sur Resend (SPF/DKIM/DMARC verts)
- [ ] Clé API Resend créée
- [ ] SMTP custom activé dans Supabase (host `smtp.resend.com`, user `resend`, pass = clé)
- [ ] 5 templates collés dans Authentication → Emails → Templates (+ objets)
- [ ] Site URL & Redirect URLs configurées
- [ ] `.env.local` rempli (`RESEND_API_KEY`, `RESEND_FROM`, `NEXT_PUBLIC_APP_URL`)
- [ ] Appel `sendWelcomeEmail(...)` branché dans l'onboarding
- [ ] Test d'inscription + vérif dans Resend → Logs
