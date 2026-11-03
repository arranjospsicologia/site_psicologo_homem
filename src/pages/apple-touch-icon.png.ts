import type { APIRoute } from 'astro';
import sharp from 'sharp';
import favicon from '../../identidade-visual/logotipo/favicon.svg?raw';

export const GET: APIRoute = async () => {
  const png = await sharp(Buffer.from(favicon), { density: 600 }).resize(180, 180).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
