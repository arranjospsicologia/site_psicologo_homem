/**
 * Imagens de compartilhamento (1200×630), geradas no build a partir da marca
 * oficial e dos retratos. Sem texto renderizado por fonte do sistema.
 */
import type { APIRoute } from 'astro';
import sharp from 'sharp';
import marcaReversa from '../../../identidade-visual/logotipo/marca-reversa.svg?raw';

const AZUL = '#223846';
const L = 1200, A = 630;

async function marca(largura: number) {
  return sharp(Buffer.from(marcaReversa), { density: 400 }).resize({ width: largura }).png().toBuffer();
}

export const GET: APIRoute = async () => {
  const fundo = sharp({ create: { width: L, height: A, channels: 3, background: AZUL } });
  const m = await marca(460);
  const meta = await sharp(m).metadata();
  const img = await fundo
    .composite([{ input: m, left: Math.round((L - meta.width!) / 2), top: Math.round((A - meta.height!) / 2) }])
    .png().toBuffer();
  return new Response(new Uint8Array(img), { headers: { 'Content-Type': 'image/png' } });
};
