/** Acesso tipado aos dados do projeto (fontes de verdade em /data). */
import site from '../../data/site.json';
import contatos from '../../data/contatos.json';
import servicosCatalogo from '../../data/servicos.json';
import paginasJson from '../../data/paginas.json';
import seo from '../../data/seo.json';

export type Modalidade = 'online' | 'presencial';
export interface Oferta { servico_id: string; modalidades: Modalidade[] }
export interface Rede { rede: string; usuario?: string; url: string }
export interface Profissional {
  id: string;
  nome_exibicao: string;
  cidade: string;
  uf: string;
  pagina_local: string;
  contato: string;
  abordagem: string;
  crp?: string;
  formacao?: string[];
  endereco_presencial?: string | null;
  redes?: Rede[];
  foto: string;
  foto_alt: string;
  servicos: Oferta[];
}
export interface Pagina {
  id: string;
  titulo: string;
  url: string;
  tipo: string;
  fonte?: string;
  profissional?: string;
  conteudo_status: string;
}

export const dadosSite = site;
export const dadosContatos = contatos;
export const servicos = servicosCatalogo.servicos as { id: string; rotulo: string }[];
export const paginas = paginasJson.paginas as Pagina[];

const colator = new Intl.Collator('pt-BR', { sensitivity: 'base' });

/** Profissionais em ordem alfabética (ordem do HTML; a visita sorteia via JS). */
export const profissionais = (site.profissionais as unknown as Profissional[])
  .slice()
  .sort((a, b) => colator.compare(a.nome_exibicao, b.nome_exibicao));

export function profissional(id: string): Profissional {
  const p = profissionais.find((x) => x.id === id);
  if (!p) throw new Error(`Profissional não cadastrado: ${id}`);
  return p;
}

export function pagina(id: string): Pagina {
  const p = paginas.find((x) => x.id === id);
  if (!p) throw new Error(`Página não cadastrada: ${id}`);
  return p;
}

export function rotuloServico(id: string): string {
  return servicos.find((s) => s.id === id)?.rotulo ?? id;
}

export function seoDe(id: string): { titulo: string; descricao: string } {
  const s = (seo.paginas as Record<string, { titulo: string; descricao: string }>)[id];
  if (!s) throw new Error(`SEO não definido para: ${id}`);
  return s;
}
export const sufixoTitulo = seo.sufixo_titulo;

/** Rótulo de cidade no padrão do projeto: "Vitória–ES". */
export const cidadeUf = (p: Profissional) => `${p.cidade}–${p.uf}`;
export const idLocalizacao = (p: Profissional) =>
  `${p.cidade}-${p.uf}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, '-');

export function textoModalidades(m: Modalidade[]): string {
  const tem = (x: Modalidade) => m.includes(x);
  if (tem('online') && tem('presencial')) return 'Online e presencial';
  if (tem('online')) return 'Online';
  if (tem('presencial')) return 'Presencial';
  return '';
}
