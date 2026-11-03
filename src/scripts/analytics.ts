/**
 * Google Analytics 4 com Consent Mode básico.
 * - Antes da permissão: nenhuma tag carregada, nenhuma requisição.
 * - Sem estatísticas: navegação e contatos funcionam normalmente.
 * - Eventos controlados pelo projeto; nunca enviam mensagens, números ou URLs do WhatsApp.
 */
type Escolha = 'permitido' | 'recusado';
const CHAVE = 'ph-estatisticas';
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/;

declare global {
  interface Window { dataLayer: unknown[]; gtag?: (...args: unknown[]) => void; [k: `ga-disable-${string}`]: boolean }
}

let idGa: string | null = null;
let carregado = false;

function lerEscolha(): Escolha | null {
  try {
    const v = localStorage.getItem(CHAVE);
    return v === 'permitido' || v === 'recusado' ? v : null;
  } catch { return null; }
}
function gravarEscolha(v: Escolha): void {
  try { localStorage.setItem(CHAVE, v); } catch { /* armazenamento indisponível */ }
}

function urlDaPagina(): string {
  // Sem query nem fragmento: evita transmitir parâmetros com dados pessoais.
  return location.origin + location.pathname;
}

function carregarGa(id: string): void {
  if (carregado || LOCAL.test(location.hostname)) return;
  carregado = true;
  window[`ga-disable-${id}`] = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'granted',
  });
  window.gtag('js', new Date());
  window.gtag('config', id, {
    page_location: urlDaPagina(),
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
}

function apagarCookiesGa(): void {
  const dominios = [location.hostname, `.${location.hostname.split('.').slice(-2).join('.')}`];
  for (const c of document.cookie.split(';')) {
    const nome = c.split('=')[0].trim();
    if (!/^_ga/.test(nome)) continue;
    for (const d of dominios) document.cookie = `${nome}=; Max-Age=0; path=/; domain=${d}`;
    document.cookie = `${nome}=; Max-Age=0; path=/`;
  }
}

function revogar(id: string): void {
  window[`ga-disable-${id}`] = true;
  window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
  apagarCookiesGa();
}

/** Envia um evento do projeto, apenas com estatísticas permitidas. */
export function enviarEvento(nome: string, parametros: Record<string, string | undefined>): void {
  if (!carregado || !idGa || lerEscolha() !== 'permitido' || !window.gtag) return;
  const limpos = Object.fromEntries(Object.entries(parametros).filter(([, v]) => v));
  window.gtag('event', nome, limpos);
}

export function iniciarConsentimento(): void {
  const painel = document.querySelector<HTMLElement>('[data-preferencias]');
  if (!painel) return; // Analytics não configurado neste ambiente
  idGa = painel.dataset.gaId ?? null;
  if (!idGa) return;
  const id = idGa;

  const ajustarEspaco = () => {
    const h = painel.hidden ? 0 : painel.offsetHeight;
    document.documentElement.style.setProperty('--ph-espaco-flutuante', `${h}px`);
  };
  const mostrar = (focar = false) => {
    painel.hidden = false;
    ajustarEspaco();
    if (focar) painel.querySelector<HTMLButtonElement>('[data-consentir]')?.focus();
  };
  const esconder = () => { painel.hidden = true; ajustarEspaco(); };

  const escolha = lerEscolha();
  if (escolha === 'permitido') carregarGa(id);
  else if (escolha === null) mostrar();

  painel.addEventListener('click', (e) => {
    const botao = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-consentir]');
    if (!botao) return;
    const v = botao.dataset.consentir as Escolha;
    gravarEscolha(v);
    if (v === 'permitido') carregarGa(id);
    else revogar(id);
    esconder();
  });

  document.querySelectorAll<HTMLButtonElement>('[data-abrir-preferencias]').forEach((b) =>
    b.addEventListener('click', () => mostrar(true)));
  window.addEventListener('resize', ajustarEspaco);
}

/** Cliques medidos: contatos e redes. Um evento por interação. */
export function iniciarEventos(): void {
  document.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-evento]');
    if (!el) return;
    const d = el.dataset;
    if (d.evento === 'contact_click') {
      enviarEvento('contact_click', {
        page_id: d.pageId, page_type: d.pageType, placement: d.placement,
        professional_id: d.professionalId, recipient_id: d.recipientId,
      });
    } else if (d.evento === 'social_click') {
      enviarEvento('social_click', { page_id: d.pageId, professional_id: d.professionalId, network_id: d.networkId });
    }
  });
}
