import { defineStackifyConfig } from "stackify-core";
export default defineStackifyConfig({
  name: "my-app-y",
  nodeVersion: "22",
  platform: "vite",
  subDomain: "vite-app-2",
  // pathPrefix: "/vite",
  server: {
    domain: "https://ninety4.tech/",
    restUrl: "https://ninety4.tech/rest",
  },
});
