import { TwitterApi } from 'twitter-api-v2';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  mp4: 'video/mp4',
};

function mimeFromPath(p) {
  const ext = p.toLowerCase().split('.').pop();
  return MIME[ext] || 'application/octet-stream';
}

export async function postToX(post, root) {
  const { X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET } = process.env;

  if (!X_API_KEY || !X_API_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_SECRET) {
    throw new Error(
      'Clés X manquantes (X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_SECRET).',
    );
  }

  const client = new TwitterApi({
    appKey: X_API_KEY,
    appSecret: X_API_SECRET,
    accessToken: X_ACCESS_TOKEN,
    accessSecret: X_ACCESS_SECRET,
  });

  let mediaIds;
  if (post.image) {
    const buf = await readFile(path.join(root, post.image));
    const mediaId = await client.v1.uploadMedia(buf, { mimeType: mimeFromPath(post.image) });
    mediaIds = [mediaId];
  }

  const { data } = await client.v2.tweet({
    text: post.text,
    ...(mediaIds ? { media: { media_ids: mediaIds } } : {}),
  });

  return `https://x.com/i/web/status/${data.id}`;
}
