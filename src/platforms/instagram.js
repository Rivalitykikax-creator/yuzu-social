// Instagram Content Publishing API (Meta Graph API).
// Pré-requis : compte IG Business/Creator lié à une Page Facebook,
// app Meta validée pour la permission `instagram_content_publish`.
// L'image DOIT être accessible via une URL publique (champ post.imageUrl) —
// le plus simple et gratuit : raw.githubusercontent.com de ce repo (s'il est public).

const GRAPH = 'https://graph.facebook.com/v21.0';

export async function postToInstagram(post) {
  const { IG_USER_ID, IG_ACCESS_TOKEN } = process.env;

  if (!IG_USER_ID || !IG_ACCESS_TOKEN) {
    throw new Error('IG_USER_ID / IG_ACCESS_TOKEN manquants.');
  }
  if (!post.imageUrl) {
    throw new Error("Instagram exige une URL d'image publique (champ `imageUrl`).");
  }

  // 1) Créer le conteneur média
  const create = await fetch(`${GRAPH}/${IG_USER_ID}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: post.imageUrl,
      caption: post.text,
      access_token: IG_ACCESS_TOKEN,
    }),
  });
  const created = await create.json();
  if (!create.ok) {
    throw new Error(`conteneur IG : ${JSON.stringify(created.error || created)}`);
  }

  // 2) Publier le conteneur
  const publish = await fetch(`${GRAPH}/${IG_USER_ID}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: created.id,
      access_token: IG_ACCESS_TOKEN,
    }),
  });
  const published = await publish.json();
  if (!publish.ok) {
    throw new Error(`publication IG : ${JSON.stringify(published.error || published)}`);
  }

  return `IG media ${published.id}`;
}
