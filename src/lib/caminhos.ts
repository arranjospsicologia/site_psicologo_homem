/**
 * Helpers de caminho. A base ("/" ou "/repositorio/") é aplicada uma única vez,
 * aqui. Links externos, mailto:, tel:, fragmentos e wa.me ficam intactos.
 */
const BASE = import.meta.env.BASE_URL.endsWith('/')
  ? import.meta.env.BASE_URL
  : `${import.meta.env.BASE_URL}/`;

const externo = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

/** Rota lógica ("/sobre/") → caminho publicado ("/repo/sobre/"). */
export function url(caminho: string): string {
  if (!caminho || externo.test(caminho)) return caminho;
  if (!caminho.startsWith('/')) return caminho; // relativo: não mexer
  if (BASE !== '/' && caminho.startsWith(BASE)) return caminho; // já prefixado
  return BASE + caminho.replace(/^\/+/, '');
}

/** URL absoluta para canonical, compartilhamento e dados estruturados. */
export function urlAbsoluta(caminho: string, site: URL | undefined): string {
  const origem = (site?.origin ?? 'http://localhost:4321');
  return origem + url(caminho);
}

/** Prefixa href="/..." e src="/..." em HTML gerado a partir de Markdown. */
export function prefixarHtml(html: string): string {
  return html.replace(/\b(href|src)="(\/(?!\/)[^"]*)"/g, (_m, attr, valor) => `${attr}="${url(valor)}"`);
}

/** Remove a base de um pathname, para comparar com rotas lógicas. */
export function rotaLogica(pathname: string): string {
  if (BASE !== '/' && pathname.startsWith(BASE)) return '/' + pathname.slice(BASE.length);
  return pathname;
}
