export type StackifyConfig = {
  name?: string;
  rest?: {
    url: string;
  };
  platform?: "next" | "vite" | "express" | "nest";
  nodeVersion?: string;
};

export function defineStackifyConfig(config: StackifyConfig) {
  return config;
}
