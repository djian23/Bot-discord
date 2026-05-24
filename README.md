# Discord Manager

Plateforme complète de gestion d'un serveur Discord : bot Discord + dashboard web.

## Fonctionnalités

- Réception de carts via webhooks Discord
- Repost public sans checkout link
- Bouton Claim Cart avec tickets privés par utilisateur
- Logs staff Discord + dashboard
- Event Manager avec création automatique de salons
- Giveaways, Interest Checks, système d'invites
- Annonces classiques et IA-enhanced
- Analytics et statistiques temps réel via WebSocket
- Auth Discord OAuth2

## Stack

| Package | Tech |
|---|---|
| `apps/discord-bot` | TypeScript, Node.js, discord.js v14, Socket.io |
| `apps/dashboard` | Next.js 14, Tailwind CSS, shadcn/ui, React Query |
| `packages/database` | Prisma, PostgreSQL |
| `packages/shared` | Types et constantes partagés |

## Démarrage rapide

### 1. Prérequis

- Node.js 18+
- PostgreSQL
- Un bot Discord (portal.discord.com)
- Un OAuth2 app Discord

### 2. Installation

```bash
cp .env.example .env
# Remplir toutes les variables dans .env

npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 3. Déployer les commandes Discord

```bash
cd apps/discord-bot
npm run deploy:commands
```

### 4. Lancer en développement

```bash
npm run dev
```

- Dashboard : http://localhost:3000
- Bot API : http://localhost:4000

## Structure

```
/
├── apps/
│   ├── discord-bot/        # Bot Discord
│   │   └── src/
│   │       ├── commands/   # Slash commands
│   │       ├── events/     # Event handlers
│   │       ├── buttons/    # Button handlers
│   │       ├── services/   # Logique métier
│   │       ├── handlers/   # Chargement dynamique
│   │       ├── utils/      # Permissions, helpers
│   │       └── api/        # Express API + WebSocket
│   └── dashboard/          # Next.js dashboard
│       └── src/
│           ├── app/        # App Router
│           ├── components/ # Composants React
│           ├── hooks/      # Custom hooks
│           └── lib/        # Auth, utils, botApi
├── packages/
│   ├── database/           # Prisma schema + client
│   ├── shared/             # Types + constantes partagés
│   └── ui/                 # (Composants UI partagés, à étendre)
└── docs/
```

## Variables d'environnement

Voir `.env.example` pour la liste complète.

Variables critiques :
- `DISCORD_TOKEN` — Token du bot
- `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` — OAuth2
- `DISCORD_GUILD_ID` — ID de ton serveur
- `DATABASE_URL` — PostgreSQL
- `NEXTAUTH_SECRET` — Secret NextAuth (32 chars min)
- `BOT_API_SECRET` — Secret API interne bot↔dashboard

## Permissions Discord

Le bot nécessite les permissions :
- `MANAGE_CHANNELS` — Créer des salons
- `MANAGE_WEBHOOKS` — Créer des webhooks
- `MANAGE_ROLES` — Gérer les rôles
- `SEND_MESSAGES`, `EMBED_LINKS`, `ATTACH_FILES`
- `READ_MESSAGE_HISTORY`
- `VIEW_CHANNEL`

## Sécurité

- Le `checkoutLink` n'est **jamais** exposé dans le salon public
- Seuls BOSS/ADMIN voient les checkout links dans le dashboard
- Dashboard protégé par Discord OAuth2 (accès réservé staff)
- API interne bot↔dashboard protégée par secret header

## Développement — Priorité

1. [x] Monorepo & database
2. [x] Bot Discord base
3. [x] Dashboard Next.js + Auth
4. [x] Event Manager + création salons/webhooks
5. [x] Réception carts + parsing
6. [x] Repost public + bouton Claim
7. [x] Système tickets
8. [x] Logs Discord + dashboard
9. [x] Analytics
10. [ ] Giveaways (commandes + dashboard)
11. [ ] Interest Checks
12. [ ] Role panels
13. [ ] Système invites avancé
14. [ ] Annonces IA (OpenAI)
15. [ ] Déploiement Railway/VPS
