/**
 * Imagens de compartilhamento (1200×630), geradas no build a partir da marca
 * oficial e dos retratos. Sem texto renderizado por fonte do sistema.
 */
import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import marcaReversa from '../../../identidade-visual/logotipo/marca-reversa.svg?raw';
import { profissionais } from '../../lib/dados';

const AZUL = '#223846';
const L = 1200, A = 630;

async function marca(largura: number) {
  return sharp(Buffer.from(marcaReversa), { density: 400 }).resize({ width: largura }).png().toBuffer();
}

export function getStaticPaths() {
  return profissionais.map((p) => ({ params: { id: p.id } }));
}

export const GET: APIRoute = async ({ params }) => {
  const prof = profissionais.find((p) => p.id === params.id)!;
  const fundo = sharp({ create: { width: L, height: A, channels: 3, background: AZUL } });
  const arquivo = new URL(`../../../public${prof.foto}`, import.meta.url);
  const retrato = await sharp(await readFile(arquivo)).resize(520, A, { fit: 'cover', position: 'top' }).toBuffer();
  const m = await marca(360);
  const meta = await sharp(m).metadata();
  const img = await fundo
    .composite([
      { input: retrato, left: L - 520, top: 0 },
      { input: m, left: Math.round((L - 520 - meta.width!) / 2), top: Math.round((A - meta.height!) / 2) },
    ])
    .jpeg({ quality: 82 }).toBuffer();
  return new Response(new Uint8Array(img), { headers: { 'Content-Type': 'image/jpeg' } });
};
