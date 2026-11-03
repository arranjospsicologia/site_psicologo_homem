/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_BASE_PATH?: string;
  readonly PUBLIC_DEPLOY_TARGET?: 'local' | 'github-pages' | 'dominio';
  readonly PUBLIC_INDEXABLE?: string;
  readonly PUBLIC_GA_MEASUREMENT_ID?: string;
  readonly PUBLIC_ANALYTICS_ENABLED?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
