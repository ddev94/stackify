export type StackifyConfig = {
  name?: string;
  platform?: "next" | "vite" | "express" | "nest";
  nodeVersion?: string;
  subDomain?: string;
  pathPrefix?: string;
  server?: {
    domain?: string;
    restUrl?: string;
  };
};

export function defineStackifyConfig(config: StackifyConfig) {
  return config;
}
