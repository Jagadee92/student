import { defineConfig } from "vite";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = env.API_PROXY_TARGET || "http://localhost:5017";
  const enableDevHttps =
    mode === "development" && env.ENABLE_DEV_HTTPS === "true";

  return {
    plugins: [react(), ...(enableDevHttps ? [mkcert()] : [])],
    server: {
      host: "0.0.0.0",
      port: 5174,
      strictPort: true,
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
          configure(proxy) {
            proxy.on("proxyReq", (proxyRequest) => {
              proxyRequest.removeHeader("origin");
            });
          },
        },
      },
    },
  };
});
