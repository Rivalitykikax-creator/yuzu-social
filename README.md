# yuzu-social

Auto-publication **gratuite** des posts YUZU sur **X** et **Instagram**, sans abonnement.
Tourne tout seul dans le cloud via **GitHub Actions** (cron). Tu écris tes posts dans
`queue.json`, ça publie à l'heure prévue.

> **LinkedIn : à poster à la main.** L'API est trop verrouillée (approbation longue) et
> la portée des posts publiés via outil tiers est largement bridée. 2 min/post à la main,
> meilleur reach. Ne l'automatise pas.

---

## Comment ça marche

1. Tu ajoutes un post dans `queue.json` avec une date de publication (`publishAt`).
2. Toutes les 30 min, GitHub Actions lance le script.
3. Le script publie les posts dont la date est passée, puis les passe en `published`.

**Coût : 0 €.** Repo **public** = minutes Actions illimitées **+** hébergement gratuit des
images pour Instagram (via `raw.githubusercontent.com`). Tes clés ne sont **jamais** dans le
repo — elles vivent dans les *Secrets* GitHub (étape 3). Le contenu posté devient public de
toute façon, donc un repo public ne révèle rien de sensible.

---

## Mise en route (≈ 15 min, une seule fois)

### 1. Pousser le projet sur GitHub (repo PUBLIC)

```bash
cd ~/Desktop/yuzu-social
git add -A && git commit -m "init yuzu-social"
gh repo create yuzu-social --public --source=. --push   # ou crée le repo à la main sur github.com
```

### 2. Créer l'accès X (le plus simple — ~10 min)

1. <https://developer.x.com> → crée un compte développeur (offre **Free**).
2. Crée un **Project** puis une **App**.
3. App → **User authentication settings** → mets les permissions sur **Read and write**.
4. Onglet **Keys and tokens** → génère et note :
   - **API Key** + **API Key Secret** → `X_API_KEY` / `X_API_SECRET`
   - **Access Token** + **Access Token Secret** → `X_ACCESS_TOKEN` / `X_ACCESS_SECRET`
   - ⚠️ Régénère l'Access Token **après** avoir passé l'app en *Read and write*, sinon il
     reste en lecture seule.

### 3. Coller les clés dans GitHub Secrets

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
Ajoute : `X_API_KEY`, `X_API_SECRET`, `X_ACCESS_TOKEN`, `X_ACCESS_SECRET`.

➡️ **X est prêt.** Teste : onglet **Actions** → *Publier les posts* → **Run workflow**
(mets d'abord un post avec une `publishAt` déjà passée dans `queue.json`).

### 4. (Plus tard) Activer Instagram

Plus lourd, à faire quand tu veux : compte IG **Business/Creator** + **Page Facebook** liée +
**app Meta validée**.

1. <https://developers.facebook.com> → crée une app → ajoute le produit **Instagram Graph API**.
2. Demande la permission **`instagram_content_publish`** (passe par l'*App Review*).
3. Récupère ton **IG_USER_ID** et un **token longue durée** (`IG_ACCESS_TOKEN`).
4. Ajoute `IG_USER_ID` et `IG_ACCESS_TOKEN` dans les Secrets.
5. Pour les images : mets le fichier dans `media/`, et dans le post mets
   `"imageUrl": "https://raw.githubusercontent.com/<TON_USER>/yuzu-social/main/media/visu.jpg"`.

---

## Écrire un post

`queue.json` est un tableau d'objets :

```json
{
  "id": "2026-06-25-portfolio",
  "text": "Le texte du post…",
  "platforms": ["x"],
  "publishAt": "2026-06-25T08:30:00Z",
  "image": "media/visu.jpg",
  "imageUrl": "https://raw.githubusercontent.com/<TON_USER>/yuzu-social/main/media/visu.jpg",
  "status": "pending"
}
```

| Champ        | Rôle |
|--------------|------|
| `id`         | identifiant unique (libre) |
| `text`       | le texte du post (sauts de ligne avec `\n`) |
| `platforms`  | `["x"]`, `["instagram"]`, ou les deux |
| `publishAt`  | date/heure **UTC** (le `Z`). Paris en été = UTC+2 → `08:30Z` = **10:30** à Paris |
| `image`      | **(X)** fichier image local, optionnel |
| `imageUrl`   | **(Instagram)** URL publique de l'image, **obligatoire** pour IG |
| `status`     | mets `pending` ; le bot le passe en `published` tout seul |

Tester en local sans rien publier :

```bash
npm install
npm run dry-run
```

---

## Bon à savoir

- Le cron GitHub n'est pas à la seconde près (parfois quelques minutes de retard). Normal.
- X — tier gratuit ≈ **500 posts/mois** en écriture. Large pour un studio.
- Si un post échoue, son `lastError` est écrit dans `queue.json` et il sera **réessayé** au run
  suivant (les plateformes déjà publiées ne sont pas re-postées).
- Cron par défaut : toutes les 30 min. Modifiable dans `.github/workflows/publish.yml`.
