import { defineStackifyConfig } from "stackify-core";
export default defineStackifyConfig({
  name: "stackify-app-vite-react",
  nodeVersion: "20",
  platform: "vite",
  rest: {
    url: "http://103.82.27.64/rest",
  },
});
