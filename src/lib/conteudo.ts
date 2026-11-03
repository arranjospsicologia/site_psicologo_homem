/**
 * Leitura dos textos em Markdown (conteudo/ e artigos da raiz).
 *
 * Convenções dos arquivos, preservadas aqui:
 * - frontmatter e comentários HTML são internos e nunca aparecem na página;
 * - um parágrafo formado só por **negrito** é o rótulo de um botão/controle;
 * - "{{pendente: descrição}}" vira um placeholder com "Informação pendente".
 */
import matter from 'gray-matter';
import { marked, type Token, type Tokens } from 'marked';
import { prefixarHtml } from './caminhos';

marked.use({ gfm: true, breaks: false });

export type Bloco =
  | { tipo: 'html'; html: string }
  | { tipo: 'acao'; rotulo: string }
  | { tipo: 'comentario'; texto: string }
  | { tipo: 'links'; itens: { rotulo: string; href: string }[] }
  | { tipo: 'faq'; itens: { pergunta: string; html: string }[] };

export interface Secao {
  titulo: string | null;
  tituloHtml: string | null;
  id: string | null;
  blocos: Bloco[];
}

export interface Documento {
  dados: Record<string, unknown>;
  h1: string | null;
  secoes: Secao[];
}

const ROTULO_PENDENTE = 'Informação pendente';

export function htmlPendente(descricao: string): string {
  const d = escapar(descricao);
  return `<span class="pendente" data-pendente="${d}"><span class="pendente__campo">${d}</span><span class="pendente__rotulo">${ROTULO_PENDENTE}</span></span>`;
}

function escapar(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function substituirPendentes(md: string): string {
  return md.replace(/\{\{\s*pendente:\s*([^}]+?)\s*\}\}/g, (_m, d: string) => htmlPendente(d));
}

export function slug(texto: string): string {
  return texto
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function inline(texto: string): string {
  return prefixarHtml(marked.parseInline(texto) as string);
}

function htmlDe(tokens: Token[]): string {
  return prefixarHtml(marked.parser(tokens as Token[] & { links: Record<string, never> }));
}

function textoPuro(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
}

/** Parágrafo composto apenas por um trecho em negrito → rótulo de ação. */
function rotuloDeAcao(p: Tokens.Paragraph): string | null {
  const t = p.tokens?.filter((x) => !(x.type === 'text' && !x.raw.trim())) ?? [];
  if (t.length === 1 && t[0].type === 'strong') return (t[0] as Tokens.Strong).text.trim();
  return null;
}

/** Parágrafo formado só por links separados por "·" → lista de acessos. */
function listaDeLinks(p: Tokens.Paragraph): { rotulo: string; href: string }[] | null {
  const t = p.tokens ?? [];
  const links = t.filter((x) => x.type === 'link') as Tokens.Link[];
  if (links.length < 2) return null;
  const resto = t.filter((x) => x.type !== 'link');
  if (!resto.every((x) => x.type === 'text' && /^[\s·]*$/.test(x.raw))) return null;
  return links.map((l) => ({ rotulo: l.text, href: l.href }));
}

function comentarios(raw: string): string[] {
  return [...raw.matchAll(/<!--([\s\S]*?)-->/g)].map((m) => m[1].trim());
}

export interface OpcoesLeitura {
  /** Títulos (h2) cujas subseções h3 viram perguntas de FAQ. */
  faq?: string[];
}

export function lerDocumento(fonte: string, opcoes: OpcoesLeitura = {}): Documento {
  const { data, content } = matter(fonte);
  const tokens = marked.lexer(substituirPendentes(content));
  const secoes: Secao[] = [{ titulo: null, tituloHtml: null, id: null, blocos: [] }];
  let h1: string | null = null;
  let faqAtual: { pergunta: string; tokens: Token[] }[] | null = null;

  const atual = () => secoes[secoes.length - 1];
  const fecharFaq = () => {
    if (!faqAtual) return;
    atual().blocos.push({
      tipo: 'faq',
      itens: faqAtual.map((i) => ({ pergunta: i.pergunta, html: htmlDe(i.tokens.filter((x) => !(x.type === 'html' && /^\s*<!--/.test(x.raw)))) })),
    });
    faqAtual = null;
  };

  for (const tk of tokens) {
    if (tk.type === 'space') continue;

    if (tk.type === 'heading') {
      const h = tk as Tokens.Heading;
      if (h.depth === 1) { h1 = inline(h.text); continue; }
      if (h.depth === 2) {
        fecharFaq();
        const html = inline(h.text);
        const titulo = textoPuro(html);
        secoes.push({ titulo, tituloHtml: html, id: slug(titulo), blocos: [] });
        if (opcoes.faq?.includes(titulo)) faqAtual = [];
        continue;
      }
      if (h.depth === 3 && faqAtual) {
        faqAtual.push({ pergunta: textoPuro(inline(h.text)), tokens: [] });
        continue;
      }
    }

    if (faqAtual && faqAtual.length) { faqAtual[faqAtual.length - 1].tokens.push(tk); continue; }

    if (tk.type === 'html' && /^\s*<!--/.test(tk.raw)) {
      for (const texto of comentarios(tk.raw)) atual().blocos.push({ tipo: 'comentario', texto });
      continue;
    }

    if (tk.type === 'paragraph') {
      const p = tk as Tokens.Paragraph;
      const rotulo = rotuloDeAcao(p);
      if (rotulo) { atual().blocos.push({ tipo: 'acao', rotulo }); continue; }
      const itens = listaDeLinks(p);
      if (itens) { atual().blocos.push({ tipo: 'links', itens }); continue; }
    }

    atual().blocos.push({ tipo: 'html', html: htmlDe([tk]) });
  }
  fecharFaq();

  return { dados: data, h1, secoes };
}

/** Parágrafos de texto (sem rótulos, comentários ou listas de opções) de uma seção. */
export function paragrafos(secao: Secao): string[] {
  return secao.blocos
    .filter((b): b is { tipo: 'html'; html: string } => b.tipo === 'html' && b.html.startsWith('<p>'))
    .map((b) => b.html);
}

/* ---------- Fontes de texto ---------- */

const textosConteudo = import.meta.glob('../../conteudo/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const textosRaiz = import.meta.glob(
  ['../../*.md', '!../../README.md', '!../../MANUAL-CRIACAO-DO-SITE.md', '!../../DECISOES-ARQUITETURA.md'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>;

/** Lê um arquivo pelo caminho relativo à raiz do projeto (ex.: "conteudo/home.md"). */
export function textoFonte(caminho: string): string {
  const chave = `../../${caminho}`;
  const t = textosConteudo[chave] ?? textosRaiz[chave];
  if (t === undefined) throw new Error(`Texto não encontrado: ${caminho}`);
  return t;
}

/* ---------- Componentes de texto ---------- */

export interface TextosCards {
  descricoes: Record<string, string>;
  microtextos: Record<string, string>;
}

/** conteudo/componentes/cards-profissionais.md → descrições por nome e microtextos. */
export function lerCards(): TextosCards {
  const doc = lerDocumento(textoFonte('conteudo/componentes/cards-profissionais.md'));
  const descricoes: Record<string, string> = {};
  const microtextos: Record<string, string> = {};
  for (const s of doc.secoes) {
    if (!s.titulo) continue;
    if (/estados da listagem/i.test(s.titulo)) {
      const lista = s.blocos.find((b) => b.tipo === 'html' && b.html.startsWith('<ul>'));
      if (lista && lista.tipo === 'html') {
        for (const m of lista.html.matchAll(/<li>([^:<]+):\s*<strong>([\s\S]*?)<\/strong>/g)) {
          microtextos[m[1].trim()] = textoPuro(m[2]);
        }
      }
      continue;
    }
    // Descrição: primeiro parágrafo que não começa por identificação em negrito.
    const desc = paragrafos(s).find((p) => !p.startsWith('<p><strong>'));
    if (desc) descricoes[s.titulo] = desc;
  }
  return { descricoes, microtextos };
}

export interface Artigo { titulo: string; html: string; resumo: string }

export function lerArtigo(caminho: string): Artigo {
  const { content } = matter(textoFonte(caminho));
  const tokens = marked.lexer(substituirPendentes(content));
  const iH1 = tokens.findIndex((t) => t.type === 'heading' && (t as Tokens.Heading).depth === 1);
  const titulo = iH1 >= 0 ? textoPuro(inline((tokens[iH1] as Tokens.Heading).text)) : '';
  const corpo = tokens.filter((t, i) => i !== iH1 && !(t.type === 'html' && /^\s*<!--/.test(t.raw)));
  const primeiro = corpo.find((t) => t.type === 'paragraph') as Tokens.Paragraph | undefined;
  return { titulo, html: htmlDe(corpo), resumo: primeiro ? textoPuro(inline(primeiro.text)) : '' };
}
