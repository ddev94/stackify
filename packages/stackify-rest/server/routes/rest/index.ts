import { eventHandler } from "h3";

// Learn more: https://nitro.build/guide/routing
export default eventHandler((event) => {
  return {
    message: "Hello from /rest!",
    timestamp: new Date().toISOString(),
  };
});
