/** Imagem de compartilhamento (1200×630) recortada da imagem de ambiência da página. */
import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { paginas } from '../../../lib/dados';

export function getStaticPaths() {
  // Páginas locais usam a composição com o retrato (og/[id].jpg).
  return paginas.filter((p) => p.imagem && p.tipo !== 'local').map((p) => ({ params: { id: p.id }, props: { imagem: p.imagem! } }));
}

export const GET: APIRoute = async ({ props }) => {
  // Caminho a partir da raiz do projeto (o build roda nela).
  const arquivo = path.join(process.cwd(), 'public', props.imagem);
  const img = await sharp(await readFile(arquivo))
    .resize(1200, 630, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
  return new Response(new Uint8Array(img), { headers: { 'Content-Type': 'image/jpeg' } });
};
