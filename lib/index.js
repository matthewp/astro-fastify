// @ts-check

import { relative } from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify';
import http from 'http';

/**
* @typedef {import('astro').AstroUserConfig} AstroUserConfig
@typedef {import('astro').AstroConfig} AstroConfig
* @typedef {import('vite').Plugin} VitePlugin
* 
* @typedef {import('./types').IntegrationOptions} IntegrationOptions
* 
*/

/**
 * @param {string | URL} entry
 */
function entryToPath(entry) {
  if(typeof entry !== 'string') {
    return fileURLToPath(entry);
  }
  return entry;
}

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
        return /** @type {import('http').Server} */(server.httpServer ?? new http.Server());
      }
      
      const fastify = Fastify({
        logger: options?.logger ?? true,
        serverFactory
      });
      
      if(options?.entry) {
        const entry = entryToPath(options.entry);
        const entryModule = await server.ssrLoadModule(entry);
        const setupRoutes = entryModule.default;
        if(typeof setupRoutes !== 'function') {
          throw new Error(`@matthewp/astro-fastify: ${entry} should export a default function.`);
        }
        setupRoutes(fastify);
      }
      
      // Final catch-all route forwards back to the Vite server
      fastify.all('/*', function (request) {
        /** @type {import('connect').NextFunction} */
        const next = request.raw[nextSymbol];
        next();
      });
      
      await fastify.ready();
    },
    transform(code, id) {
      if(options?.entry && id.includes('@matthewp/astro-fastify/lib/server.js')) {
        let entry = entryToPath(options.entry);
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
  /** @type {AstroConfig | undefined} */
  let config;
  return {
    name: '@matthewp/astro-fastify',
    hooks: {
      'astro:config:setup'({ updateConfig }) {
        /** @type {AstroUserConfig} */
        const config = {
          build: {
            assets: 'assets'
          },
          vite: {
            plugins: [vitePlugin(options)]
          }
        }
        updateConfig(config)
      },
      'astro:config:done'({ config: _config, setAdapter }) {
        config = _config;
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
              chunkFileNames: 'assets/chunks/[name].[hash].js'
            });
          }
        }
      },
      'astro:build:start'(...buildStartArgs) {
        /** @type {import('astro').AstroConfig['build'] | undefined} */
        let bc;
        if(buildStartArgs.length > 0 && /** @type {any} */(buildStartArgs)[0].buildConfig) {
          bc = /** @type {any} */(buildStartArgs)[0].buildConfig;
        } else {
          bc = config?.build;
        }
        if(bc) {
          args.clientRelative = relative(fileURLToPath(bc.server), fileURLToPath(bc.client));
        }
      }
    }
  };
}
