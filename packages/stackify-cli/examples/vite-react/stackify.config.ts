import { defineStackifyConfig } from "@stackify/core";
export default defineStackifyConfig({
  name: "stackify-app-vite-react",
  server: {
    url: "http://localhost:3333/platform",
  }
});
