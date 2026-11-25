// Node.js 18 не всегда предоставляет Web Crypto API как глобальный `crypto`
// (он нужен workbox-build → serialize-javascript при сборке service worker).
// Полифилл подключается первым импортом в vite.config.ts, чтобы глобал
// существовал до загрузки vite-plugin-pwa и @rollup/plugin-terser.
import { webcrypto } from "node:crypto";

const globalScope = globalThis as typeof globalThis & {
  crypto?: unknown;
};

if (!globalScope.crypto) {
  Object.defineProperty(globalScope, "crypto", {
    value: webcrypto,
    configurable: true,
    writable: true,
  });
}
