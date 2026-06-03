# Déploiement Railway — 4 étapes

## Étape 1 — Créer le projet Railway

1. Va sur [railway.app](https://railway.app) → **New Project**
2. **Deploy from GitHub repo** → sélectionne `djian23/Bot-discord`
3. Branche : `claude/salut-k8msb`

## Étape 2 — Ajouter PostgreSQL

Dans ton projet Railway → **+ New** → **Database** → **PostgreSQL**  
Railway génère automatiquement `DATABASE_URL` dans les variables partagées.

## Étape 3 — Créer 2 services

### Service "bot"
- **+ New** → **GitHub Repo** → même repo, branche `claude/salut-k8msb`
- Settings → **Custom Start Command** : *(laisser vide, le Dockerfile gère)*
- Settings → **Dockerfile Path** : `Dockerfile.bot`
- Settings → **Service Name** : `bot`

### Service "dashboard"
- **+ New** → **GitHub Repo** → même repo, branche `claude/salut-k8msb`
- Settings → **Dockerfile Path** : `Dockerfile.dashboard`
- Settings → **Service Name** : `dashboard`

## Étape 4 — Variables d'environnement

Colle ces variables sur **les 2 services** (Settings → Variables) :

```
DISCORD_TOKEN=<ton token — Discord Developer Portal → Bot → Reset Token>
DISCORD_GUILD_ID=<ID de ton serveur Discord>
DISCORD_CLIENT_ID=<depuis Discord Developer Portal → OAuth2>
DISCORD_CLIENT_SECRET=<depuis Discord Developer Portal → OAuth2>
NEXTAUTH_SECRET=<génère avec: openssl rand -base64 32>
BOT_API_SECRET=<génère avec: openssl rand -hex 32>
NODE_ENV=production
```

**Sur le service "dashboard" seulement :**
```
BOT_API_URL=https://<url-du-service-bot>.railway.app
NEXT_PUBLIC_APP_URL=https://<url-du-dashboard>.railway.app
NEXTAUTH_URL=https://<url-du-dashboard>.railway.app
NEXT_PUBLIC_WS_URL=https://<url-du-service-bot>.railway.app
NEXT_PUBLIC_BOT_WS_URL=https://<url-du-service-bot>.railway.app
```

> Les URLs Railway sont disponibles dans Settings → Networking → Public URL

## Étape 5 — Setup Discord OAuth2

Sur [Discord Developer Portal](https://discord.com/developers/applications) :
1. Ton application → **OAuth2**
2. Redirects → Add : `https://<url-dashboard>.railway.app/api/auth/callback/discord`
3. Copie **Client ID** et **Client Secret** dans les variables Railway

## Étape 6 — Setup serveur Discord

Une fois le bot déployé et en ligne, ouvre le Shell du service bot sur Railway :
```bash
node scripts/setup-server.mjs
```

Cela crée les 40 salons et synchronise le dashboard automatiquement.
