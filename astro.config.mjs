// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import sitemap from '@astrojs/sitemap';
import { removerMestres } from './scripts/integracao-saida.mjs';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'PUBLIC_');

/** Origem pública, sem a subpasta do repositório. */
const site = (env.PUBLIC_SITE_URL || 'http://localhost:4321').replace(/\/+$/, '');

/** Base normalizada: "/" ou "/repositorio/". */
function normalizarBase(valor) {
  const limpo = (valor || '/').trim().replace(/^\/+|\/+$/g, '');
  return limpo ? `/${limpo}/` : '/';
}
const base = normalizarBase(env.PUBLIC_BASE_PATH);

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: { format: 'directory' },
  compressHTML: true,
  integrations: [
    sitemap({
      filter: (pagina) => !/\/404\/?$/.test(pagina),
    }),
    removerMestres(),
  ],
  vite: {
    server: { fs: { allow: ['.'] } },
  },
});
