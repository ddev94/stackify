import { defineStackifyFunction, FunctionHandlerType } from "./function";

export type StackifyConfig = {
  name: string;
};

export function defineStackifyConfig(config: StackifyConfig) {
  return config;
}
