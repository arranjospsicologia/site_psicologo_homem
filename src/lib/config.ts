/** Configuração pública por ambiente, centralizada. */
const env = import.meta.env;

export const ambiente = {
  alvo: (env.PUBLIC_DEPLOY_TARGET ?? 'local') as 'local' | 'github-pages' | 'dominio',
  indexavel: env.PUBLIC_INDEXABLE === 'true',
};

const idGa = (env.PUBLIC_GA_MEASUREMENT_ID ?? '').trim();
const idValido = /^G-[A-Z0-9]{4,}$/.test(idGa);

export const analytics = {
  id: idValido ? idGa : null,
  /** Só ativa com ID real e habilitação explícita no ambiente. */
  ativo: env.PUBLIC_ANALYTICS_ENABLED === 'true' && idValido,
};
