import type { FastifyInstance } from 'fastify';

export type ServerArgs = {
  clientRelative: string;
  assetsPrefix: string;
};

export type DefineFastifyRoutes = (fastify: FastifyInstance) => void;

export type IntegrationOptions = {
  /**
   * The entrypoint to where your fastify routes are defined
   */
  entry: string | URL
};