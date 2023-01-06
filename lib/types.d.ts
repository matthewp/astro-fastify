import type { FastifyInstance, FastifyServerOptions } from 'fastify';
import type { AstroIntegration } from 'astro';

export type ServerArgs = {
  clientRelative: string;
  assetsPrefix: string;
  port: number | undefined;
  logger: FastifyServerOptions['logger'] | undefined;
  fastify?: Omit<FastifyServerOptions, 'logger'>;
};

export type DefineFastifyRoutes = (fastify: FastifyInstance) => void;

export type IntegrationOptions = {
  /**
   * The entrypoint to where your fastify routes are defined
   */
  entry: string | URL;
  /**
   * The port to use in __production__. In development mode fastify runs
   * on the Vite server.
   * 
   * By default @matthewp/astro-fastify uses process.env.PORT which most hosts will
   * define, and you don't need to set this. If you do set this option it will override
   * any host variables.
   */
  port?: number;
  /**
   * Specifies logging options. By default logging is enabled. This can be
   * any of the options specified by Fastify: https://www.fastify.io/docs/latest/Reference/Logging/
   */
  logger?: FastifyServerOptions['logger'];
  /**
   * Specifies fastify server options.
   */
  fastify?: Omit<FastifyServerOptions, 'logger'>;
};

export default function(opts: IntegrationOptions): AstroIntegration;
