/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Native bzw. node-only Module dürfen nicht gebündelt werden.
  serverExternalPackages: ['better-sqlite3', 'node-cron'],
  webpack: (config, { isServer }) => {
    // Der Instrumentation-Hook wird (auch im Dev-Modus) für mehrere Runtimes kompiliert.
    // serverExternalPackages greift dort nicht zuverlässig, daher markieren wir die
    // node-only-Pakete und alle `node:`-Builtins explizit als Server-Externals, damit
    // webpack sie nicht zu bündeln versucht (sonst: "Can't resolve 'fs'" / "Unhandled scheme node:fs").
    if (isServer && Array.isArray(config.externals)) {
      config.externals.push('better-sqlite3', 'bindings', 'node-cron');
      config.externals.push(({ request }, cb) =>
        request && request.startsWith('node:') ? cb(null, `commonjs ${request}`) : cb(),
      );
    }
    return config;
  },
};

export default nextConfig;
