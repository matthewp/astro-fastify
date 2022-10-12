// @ts-check

import { relative } from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';

/**
 * @typedef {import('astro').AstroUserConfig} AstroUserConfig
 * @typedef {import('vite').Plugin} VitePlugin
 * 
 * @typedef {import('./types').IntegrationOptions} IntegrationOptions
 * 
 */

/**
 * @param {IntegrationOptions} [options]
 * @returns {VitePlugin}
 */
function vitePlugin(options) {
  return {
    name: '@matthewp/astro-fastify:vite',
    async configureServer(server) {
      const nextSymbol = Symbol('next');

      /** @type {import('fastify').FastifyServerFactory} */
      const serverFactory = (handler, opts) => {
        server.middlewares.use((req, res, next) => {
          req[nextSymbol] = next;
          handler(req, res);
        });
        return /** @type {import('http').Server} */(server.httpServer);
      }
      
      const fastify = Fastify({
        logger: options?.logger ?? true,
        serverFactory
      });

      if(options?.entry) {
        const setupRoutes = (await import(options.entry.toString())).default;
        if(typeof setupRoutes !== 'function') {
          throw new Error(`@matthewp/astro-fastify: ${options.entry.toString()} should export a default function.`);
        }
        setupRoutes(fastify);
      }

      // Final catch-all route forwards back to the Vite server
      fastify.get('/*', function (request) {
        /** @type {import('connect').NextFunction} */
        const next = request.raw[nextSymbol];
        next();
      });

      await fastify.ready();
    },
    transform(code, id) {
      if(options?.entry && id.includes('@matthewp/astro-fastify/lib/server.js')) {
        let entry = options.entry;
        if(typeof entry !== 'string') {
          entry = fileURLToPath(entry);
        }
        let outCode = `import _astroFastifyRoutes from "${entry}";\n${code}`;
        return outCode;
      }
    }
  }
}

/**
 * @param {IntegrationOptions} options
 * @returns {import('astro').AstroIntegration}
 */
export default function(options) {
  /** @type {import('./types').ServerArgs} */
  let args = /** @type {any} */({});
  args.port = options.port;
  args.logger = options.logger ?? true;
  return {
    name: '@matthewp/astro-fastify',
    hooks: {
      'astro:config:setup'({ updateConfig }) {
        /** @type {AstroUserConfig} */
        const config = {
          vite: {
            plugins: [vitePlugin(options)]
          }
        }
        updateConfig(config)
      },
      'astro:config:done'({ setAdapter }) {
        setAdapter({
          name: '@matthewp/astro-fastify:adapter',
          serverEntrypoint: fileURLToPath(new URL('./server.js', import.meta.url)),
          exports: ['start'],
          args: args
        });
      },
      'astro:build:setup'({ vite, target }) {
        args.assetsPrefix = '/assets/';
        if(target === 'client') {
          const outputOptions = vite?.build?.rollupOptions?.output;
          if(outputOptions && !Array.isArray(outputOptions)) {
            Object.assign(outputOptions, {
              entryFileNames: 'assets/[name].[hash].js',
              chunkFileNames: 'assets/chunks/[name].[hash].js',
              assetFileNames: 'assets/[name].[hash][extname]'
            });
          }
        }
      },
      'astro:build:start'({ buildConfig }) {
        args.clientRelative = relative(fileURLToPath(buildConfig.server), fileURLToPath(buildConfig.client));
      }
    }
  };
}
