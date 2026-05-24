# Suivi du Projet — Discord Manager

> Dernière mise à jour : 2026-05-24 (session 3)

---

## État Global

| Module | Statut | Notes |
|---|---|---|
| Monorepo / Config | ✅ Complet | turbo, tsconfig, .env.example |
| Database / Prisma | ✅ Complet | 22 modèles, seed |
| Bot — Base | ✅ Complet | client, handlers, deploy-commands |
| Bot — Cart Parser | ✅ Complet | parse embeds webhooks |
| Bot — Repost Public | ✅ Complet | embed sans checkout + bouton Claim |
| Bot — Claim Cart | ✅ Complet | checks BL/cooldown/rôle/limite |
| Bot — Tickets | ✅ Complet | création unique, transcript, auto-close |
| Bot — Logs | ✅ Complet | tous les LogAction |
| Bot — Events | ✅ Complet | création salons + webhooks Discord |
| Bot — Giveaways | ✅ Complet | create/end/reroll/tirage auto cron |
| Bot — Interest Checks | ✅ Complet | votes, résultats, close |
| Bot — Role Panels | ✅ Complet | boutons, conditions, publish |
| Bot — Invites | ✅ Complet | tracking, cache, leaderboard |
| Bot — Annonces IA | ✅ Complet | OpenAI, 4 styles |
| Bot — Stats (/stats) | ✅ Complet | embed user |
| Bot — Cron Jobs | ✅ Complet | expire carts, close tickets, daily stats, giveaways |
| Dashboard — Auth | ✅ Complet | Discord OAuth2, middleware, rôles |
| Dashboard — Overview | ✅ Complet | stats temps réel |
| Dashboard — Events | ✅ Complet | grille + bouton créer |
| Dashboard — Carts | ✅ Complet | table + filtres + checkout masqué |
| Dashboard — Claims | ✅ Complet | table + stats |
| Dashboard — Tickets | ✅ Complet | table + statuts |
| Dashboard — Users | ✅ Complet | table + actions BL/note/limite |
| Dashboard — Roles | ✅ Complet | panels + options |
| Dashboard — Giveaways | ✅ Complet | cards + bouton créer |
| Dashboard — Interest Checks | ✅ Complet | barres de progression |
| Dashboard — Invites | ✅ Complet | leaderboard + historique |
| Dashboard — Announcements | ✅ Complet | préview IA + création |
| Dashboard — Analytics | ✅ Complet | charts recharts, top users/events |
| Dashboard — Logs | ✅ Complet | historique 200 logs |
| Dashboard — Settings | ✅ Complet | form complet |
| API Interne Bot ↔ Dashboard | ✅ Complet | Express + WebSocket |
| Bot — /myclaims | ✅ Complet | embed claims récents + stats |
| Bot — /setup | ✅ Complet | rôles, salons, limites, info |
| Dashboard — Detail pages | ✅ Complet | /users/[id], /tickets/[id], /events/[id] |
| Dashboard — Temps réel | ✅ Complet | LiveOverview, LiveActivity, Socket.io |
| Dashboard — Exports CSV | ✅ Complet | claims + analytics 90j |
| Tests unitaires | ✅ Complet | cartParser + claimValidation (Jest) |
| Déploiement Railway / VPS | ✅ Complet | Dockerfile, docker-compose, railway.toml |

---

## Commandes Discord disponibles

| Commande | Accès | Description |
|---|---|---|
| `/event create` | Admin | Crée event + salons + webhook Discord |
| `/event list` | Admin | Liste les events |
| `/event toggle` | Admin | Active/désactive un event |
| `/cart list` | Staff | Liste les carts |
| `/cart repost` | Staff | Repost un cart |
| `/cart expire` | Staff | Expire un cart |
| `/cart info` | Staff | Infos + checkout (spoiler) |
| `/ticket close` | Staff | Ferme un ticket |
| `/user blacklist` | Staff | Blackliste un user |
| `/user unblacklist` | Staff | Unblackliste un user |
| `/user history` | Staff | Historique d'un user |
| `/announce` | Staff | Envoie une annonce (+ option IA) |
| `/giveaway create` | Staff | Crée un giveaway |
| `/giveaway end` | Staff | Termine un giveaway |
| `/giveaway reroll` | Staff | Reroll les gagnants |
| `/interest create` | Staff | Crée un interest check |
| `/interest results` | Staff | Voir les résultats |
| `/interest close` | Staff | Ferme l'interest check |
| `/role panel` | Admin | Crée un panel de rôles |
| `/role add` | Admin | Ajoute un rôle à un panel |
| `/role publish` | Admin | Publie le panel dans Discord |
| `/role list` | Admin | Liste les panels |
| `/stats` | Everyone | Ses propres statistiques |
| `/myclaims` | Everyone | Claims récents avec statuts et stats |
| `/setup roles` | Boss | Configure les rôles de permission |
| `/setup channels` | Boss | Configure les salons de logs |
| `/setup limits` | Boss | Configure limites de claims/cooldown |
| `/setup info` | Boss | Voir la configuration actuelle |

---

## Boutons Discord

| Bouton | Description |
|---|---|
| `claim_cart:<cartId>` | Claim un cart |
| `cart_paid:<cartId>` | Marque comme payé |
| `cart_cancel:<cartId>` | Annule un cart |
| `ticket_close:<ticketId>` | Ferme le ticket |
| `ticket_call_staff:<ticketId>` | Appelle le staff |
| `ticket_add_note:<cartId>` | Ouvre modal note |
| `giveaway_enter:<giveawayId>` | Participe à un giveaway |
| `interest_vote:<checkId>:<buttonId>` | Vote interest check |
| `role_toggle:<optionId>` | Donne/retire un rôle |

---

## Pages Dashboard

| URL | Accès | Description |
|---|---|---|
| `/login` | Public | Connexion Discord OAuth2 |
| `/overview` | Staff+ | Stats du jour + activité + statut bot |
| `/events` | Staff+ | Liste events + créer |
| `/carts` | Staff+ | Table carts + filtres (checkout masqué) |
| `/claims` | Staff+ | Table claims + stats |
| `/tickets` | Staff+ | Tickets ouverts/fermés |
| `/users` | Staff+ | Users + blacklist + notes |
| `/roles` | Staff+ | Panels de rôles |
| `/giveaways` | Staff+ | Giveaways actifs/terminés + créer |
| `/interest-checks` | Staff+ | Interest checks + résultats |
| `/invites` | Staff+ | Leaderboard invites |
| `/announcements` | Staff+ | Annonces + création IA |
| `/analytics` | Staff+ | Charts 30 jours + top users/events |
| `/logs` | Staff+ | 200 derniers logs |
| `/settings` | Admin+ | Configuration serveur |

---

## Modèles Prisma

`User` · `Session` · `Guild` · `GuildSettings` · `Event` · `Cart` · `Claim` · `Ticket` · `TicketLog` · `StaffNote` · `RolePanel` · `RoleOption` · `Giveaway` · `GiveawayEntry` · `GiveawayWinner` · `InterestCheck` · `InterestButton` · `InterestVote` · `Invite` · `Announcement` · `Log` · `DailyStats`

---

## À faire / Prochaines étapes

### Court terme (optionnel)
- [ ] E2E tests (Playwright pour le dashboard)
- [ ] Migration Prisma `db:migrate deploy` en CI/CD
- [ ] Rate limiting sur les routes API Express
- [ ] Monitoring (Sentry ou logs structurés)

### Déploiement Railway
1. Créer deux services : `discord-bot` et `dashboard`
2. Ajouter un service PostgreSQL Railway
3. Configurer les variables d'environnement (voir `.env.example`)
4. Le `railway.toml` de chaque app configure le build automatiquement
5. Le `docker-compose.yml` à la racine sert au dev local

### Variables Railway à configurer
Toutes les variables du `.env.example` + :
- `BOT_API_URL=http://discord-bot.railway.internal:4000`
- `NEXT_PUBLIC_WS_URL=https://discord-bot.up.railway.app`

### Dev local avec Docker
```bash
docker-compose up -d          # lance postgres + bot + dashboard
npm run db:migrate             # depuis le host (si besoin)
```

---

## Architecture des flux

```
Webhook externe
      ↓
#event-source (Discord)
      ↓
bot messageCreate
      ↓
parseCartFromEmbed
      ↓
prisma.cart.create
      ↓
repostCart → #event-carts (embed public sans checkout)
             + bouton [Claim Cart]
      ↓
User clique Claim
      ↓
claimService
  ├─ checks (BL, rôle, limite, cooldown)
  ├─ getOrCreateTicket → #ticket-username
  ├─ sendCartToTicket (checkout visible)
  ├─ prisma.claim.create
  └─ logService → #success-logs
                + WS emit → dashboard temps réel
```
