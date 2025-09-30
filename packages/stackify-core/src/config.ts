export type StackifyConfig = {
  name: string;
  server: {
    url: string;
  };
};

export function defineStackifyConfig(config: StackifyConfig) {
  return config;
}
