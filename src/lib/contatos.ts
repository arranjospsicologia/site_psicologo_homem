/**
 * Geração dos links de WhatsApp a partir de data/contatos.json.
 * A lógica fica separada da aparência dos botões.
 */
import { dadosContatos, pagina as paginaDe } from './dados';

type Controle = 'principal' | 'flutuante';
interface Regra { destinatario: string; mensagem: string }

const destinatarios = dadosContatos.destinatarios as Record<string,
  { nome_saudacao: string; numero_internacional: string | null }>;
const mensagens = dadosContatos.mensagens as Record<string, string>;
const regrasPaginas = dadosContatos.paginas as Record<string, {
  principal: Regra | null;
  flutuante: Regra | null;
  cards?: Record<string, Regra>;
}>;

export interface Contato {
  /** null quando o número ainda não foi informado: o botão fica desativado. */
  href: string | null;
  destinatarioId: string;
  nomeSaudacao: string;
}

/** Destinatário cujo número falta: usado para o aviso "Informação pendente". */
export function pendenciaContato(c: Contato): string | null {
  return c.href ? null : `WhatsApp de ${c.nomeSaudacao}`;
}

function montar(regra: Regra, substituicoes: Record<string, string> = {}): Contato {
  const dest = destinatarios[regra.destinatario];
  if (!dest) throw new Error(`Destinatário sem cadastro: ${regra.destinatario}`);
  let texto = mensagens[regra.mensagem];
  if (!texto) throw new Error(`Mensagem sem cadastro: ${regra.mensagem}`);
  for (const [chave, valor] of Object.entries(substituicoes)) {
    texto = texto.replaceAll(`{${chave}}`, valor);
  }
  const numero = dest.numero_internacional;
  return {
    href: numero ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}` : null,
    destinatarioId: regra.destinatario,
    nomeSaudacao: dest.nome_saudacao,
  };
}

/** Contato principal ou flutuante de uma página; null quando não existe. */
export function contatoDaPagina(paginaId: string, controle: Controle): Contato | null {
  const regras = regrasPaginas[paginaId] ?? regrasPaginas.home;
  const regra = regras?.[controle];
  return regra ? montar(regra) : null;
}

/** Contato do card de um profissional na listagem. */
export function contatoDoCard(profissionalId: string): Contato {
  const regra = regrasPaginas.remoto?.cards?.[profissionalId];
  if (!regra) throw new Error(`Card sem regra de contato: ${profissionalId}`);
  return montar(regra);
}

/** Contato textual do rodapé, com a página de origem na mensagem. */
export function contatoDoRodape(nomeDaPagina: string): Contato {
  return montar(dadosContatos.rodape as Regra, { nome_da_pagina: nomeDaPagina });
}

export function tituloPagina(paginaId: string): string {
  try { return paginaDe(paginaId).titulo; } catch { return 'Psicólogo Homem'; }
}
