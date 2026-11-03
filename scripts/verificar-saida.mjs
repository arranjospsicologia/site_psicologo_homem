// Verificação da saída do build (dist/). Roda depois de cada `npm run build`.
// - links e recursos internos existem (considerando a base do ambiente);
// - nada interno vazou (Markdown, comentários de composição, documentos);
// - cada página tem um H1, descrição e canonical; noindex na prévia;
// - lista os placeholders "Informação pendente" e falha no build indexável.
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'PUBLIC_');
const limpo = (env.PUBLIC_BASE_PATH || '/').trim().replace(/^\/+|\/+$/g, '');
const BASE = limpo ? `/${limpo}/` : '/';
const INDEXAVEL = env.PUBLIC_INDEXABLE === 'true';
const DIST = path.resolve('dist');

const problemas = [];
const pendencias = new Map();

async function arquivos(dir) {
  const saida = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) saida.push(...(await arquivos(p)));
    else saida.push(p);
  }
  return saida;
}

async function existe(rel) {
  const alvo = path.join(DIST, decodeURIComponent(rel));
  try {
    const s = await stat(alvo);
    if (s.isDirectory()) { await stat(path.join(alvo, 'index.html')); }
    return true;
  } catch { return false; }
}

const todos = await arquivos(DIST);
for (const f of todos) {
  const rel = path.relative(DIST, f);
  if (/\.(md|zip|ttf)$/i.test(f) || /(^|\/)(docs|briefings|estudos|conteudo|data)\//.test(rel)) {
    problemas.push(`Arquivo interno na saída: ${rel}`);
  }
  if (/\.png$/i.test(f) && (await stat(f)).size > 600_000) problemas.push(`Imagem pesada na saída: ${rel}`);
}

const htmls = todos.filter((f) => f.endsWith('.html'));
for (const f of htmls) {
  const rel = path.relative(DIST, f);
  const html = await readFile(f, 'utf8');
  const h1 = (html.match(/<h1\b/g) || []).length;
  if (h1 !== 1) problemas.push(`${rel}: ${h1} elementos h1`);
  if (!/<meta name="description" content="[^"]{20,}"/.test(html)) problemas.push(`${rel}: sem descrição`);
  if (!rel.startsWith('404') && !/<link rel="canonical" href="https?:\/\//.test(html)) problemas.push(`${rel}: sem canonical absoluto`);
  const temNoindex = /<meta name="robots" content="noindex"/.test(html);
  if (!INDEXAVEL && !temNoindex) problemas.push(`${rel}: prévia sem noindex`);
  if (INDEXAVEL && temNoindex) problemas.push(`${rel}: noindex no build indexável`);
  if (/<!--|data\/contatos\.json|Botão principal:|Inserir antes/.test(html)) problemas.push(`${rel}: comentário interno na página`);
  if (/\{\{\s*pendente/.test(html)) problemas.push(`${rel}: marcador de pendência não convertido`);

  for (const m of html.matchAll(/data-pendente="([^"]+)"/g)) {
    const d = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    if (!pendencias.has(d)) pendencias.set(d, new Set());
    pendencias.get(d).add('/' + rel.replace(/index\.html$/, ''));
  }

  for (const m of html.matchAll(/\s(?:href|src|srcset)="([^"]+)"/g)) {
    for (const valor of m[1].split(',').map((s) => s.trim().split(/\s+/)[0])) {
      if (!valor.startsWith('/') || valor.startsWith('//')) continue;
      const semFragmento = valor.split('#')[0].split('?')[0];
      if (!semFragmento.startsWith(BASE)) { problemas.push(`${rel}: caminho sem a base "${BASE}": ${valor}`); continue; }
      const alvo = semFragmento.slice(BASE.length);
      if (!(await existe(alvo))) problemas.push(`${rel}: destino inexistente ${valor}`);
    }
  }
}

console.log(`\nVerificação da saída — base "${BASE}", ${htmls.length} páginas, ${INDEXAVEL ? 'indexável' : 'prévia (noindex)'}`);
if (pendencias.size) {
  console.log(`\nInformação pendente (${pendencias.size}):`);
  for (const [d, paginas] of pendencias) console.log(`  - ${d}  →  ${[...paginas].join(', ')}`);
} else console.log('\nNenhuma informação pendente.');

const config = [];
if (!/^G-[A-Z0-9]{4,}$/.test(env.PUBLIC_GA_MEASUREMENT_ID ?? '')) config.push('PUBLIC_GA_MEASUREMENT_ID (ID do GA4)');
if (config.length) console.log(`\nConfiguração pendente (não aparece na tela): ${config.join(', ')}`);

if (INDEXAVEL && pendencias.size) problemas.push('Build indexável com "Informação pendente": preencha os dados antes de publicar para indexação.');

if (problemas.length) {
  console.error(`\n${problemas.length} problema(s):`);
  for (const p of problemas) console.error(`  ✗ ${p}`);
  process.exit(1);
}
console.log('\n✓ Saída conferida.\n');
