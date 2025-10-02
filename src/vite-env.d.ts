interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_DEFAULT_SGG?: string;
  readonly VITE_RTMS_SERVICE_KEY: string;
  readonly VITE_SEOUL_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
