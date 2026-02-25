import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/**
 * Security headers required for:
 *  - COOP/COEP: SharedArrayBuffer (FFmpeg WASM)
 *  - CSP: restrict resource loading to same-origin + known blob/data exceptions
 *  - X-Content-Type-Options: prevent MIME sniffing
 *  - X-Frame-Options: prevent clickjacking (belt-and-suspenders alongside frame-ancestors)
 */
const securityHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Content-Security-Policy": [
    "default-src 'self'",
    // 'wasm-unsafe-eval' is required for FFmpeg/OpenCV WASM modules
    // 'unsafe-eval' is required for SceneryStack query parameter parsing
    "script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval'",
    // FFmpeg and OpenCV spin up blob: workers
    "worker-src blob: 'self'",
    // Inline styles are set via element.style / cssText throughout the UI layer
    "style-src 'self' 'unsafe-inline'",
    // data: for icons
    "img-src 'self' data:",
    "media-src 'self' blob:",
    // blob: for fetch inside workers
    // data: required for @techstark/opencv-js which loads its WASM as a base64 data URI
    "connect-src 'self' blob: data:",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

// https://vitejs.dev/config/
export default defineConfig({
  // So the build can be served from an arbitrary path
  base: "./",
  server: {
    headers: securityHeaders,
  },
  preview: {
    headers: securityHeaders,
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "opticsLab",
        // biome-ignore lint/style/useNamingConvention: Web App Manifest spec requires snake_case keys
        short_name: "opticsLab",
        description: "opticsLab simulation",
        // biome-ignore lint/style/useNamingConvention: Web App Manifest spec requires snake_case keys
        theme_color: "#1a1a2e",
        // biome-ignore lint/style/useNamingConvention: Web App Manifest spec requires snake_case keys
        background_color: "#000000",
        display: "standalone",
        orientation: "landscape",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /\.(?:js|css)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "assets",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
});
