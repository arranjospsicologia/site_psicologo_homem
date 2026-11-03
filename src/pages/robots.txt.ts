import type { APIRoute } from 'astro';
import { ambiente } from '../lib/config';

// O rastreamento não é bloqueado: a prévia usa noindex nas páginas, e o robô
// precisa poder lê-lo. O sitemap só é anunciado na versão indexável.
export const GET: APIRoute = ({ site }) => {
  const linhas = ['User-agent: *', 'Allow: /'];
  if (ambiente.indexavel && site) linhas.push('', `Sitemap: ${new URL(`${import.meta.env.BASE_URL}sitemap-index.xml`, site).href}`);
  return new Response(linhas.join('\n') + '\n', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
