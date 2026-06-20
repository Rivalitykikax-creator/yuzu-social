import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { postToX } from './platforms/x.js';
import { postToInstagram } from './platforms/instagram.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUEUE = path.join(ROOT, 'queue.json');

const PUBLISHERS = {
  x: postToX,
  instagram: postToInstagram,
};

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const now = Date.now();
  const queue = JSON.parse(await readFile(QUEUE, 'utf8'));

  const due = queue.filter(
    (p) => p.status === 'pending' && new Date(p.publishAt).getTime() <= now,
  );

  if (due.length === 0) {
    console.log('Rien à publier pour le moment.');
    return;
  }

  if (dryRun) {
    for (const post of due) {
      console.log(`[dry-run] ${post.id} → ${post.platforms.join(', ')}`);
    }
    return;
  }

  let changed = false;

  for (const post of due) {
    post.publishedOn = post.publishedOn || [];

    for (const platform of post.platforms) {
      if (post.publishedOn.includes(platform)) continue; // déjà publié, on saute

      const publisher = PUBLISHERS[platform];
      if (!publisher) {
        console.warn(`Plateforme inconnue, ignorée : ${platform}`);
        continue;
      }

      try {
        const url = await publisher(post, ROOT);
        post.publishedOn.push(platform);
        changed = true;
        console.log(`✓ ${platform} ← ${post.id} ${url ? `(${url})` : ''}`);
      } catch (err) {
        post.lastError = `${platform}: ${err.message}`;
        changed = true;
        console.error(`✗ ${platform} ← ${post.id} : ${err.message}`);
      }
    }

    // post terminé seulement si toutes les plateformes visées ont réussi
    if (post.platforms.every((p) => post.publishedOn.includes(p))) {
      post.status = 'published';
      post.publishedAt = new Date().toISOString();
      delete post.lastError;
    }
  }

  if (changed) {
    await writeFile(QUEUE, JSON.stringify(queue, null, 2) + '\n');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
