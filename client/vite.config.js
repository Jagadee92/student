import { defineConfig } from "vite";
import { loadEnv } from "vite";
import { copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = env.API_PROXY_TARGET || "http://localhost:5017";
  const enableDevHttps =
    mode === "development" && env.ENABLE_DEV_HTTPS === "true";
  let outputDirectory;
  const spaFallbackPlugin = {
    name: "spa-404-fallback",
    apply: "build",
    configResolved(config) {
      outputDirectory = resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      await copyFile(
        resolve(outputDirectory, "index.html"),
        resolve(outputDirectory, "404.html"),
      );
    },
  };

  return {
    plugins: [react(), spaFallbackPlugin, ...(enableDevHttps ? [mkcert()] : [])],
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
