# @matthewp/astro-fastify

An [fastify](https://www.fastify.io/) adapter to use in [Astro](https://astro.build/) projects. __@matthewp/astro-fastify__ allows you to use fastify and Astro side-by-side, and deploy your apps to Node.js powered by a battle-tested HTTP server.

Unlike most adapters, __@matthewp/astro-fastify__ also works in *dev mode*.

## install

__@matthewp/astro-fastify__ is neededd in production so use `--save`.

```shell
npm install @matthewp/astro-fastify --save
```

## Usage

__@matthewp/astro-fastify__ is used like any other adapter for Astro. Import and use it in your __astro.config.mjs__ file:

```js
import fastify from '@matthewp/astro-fastify';

/** @type {import('astro').AstroUserConfig} */
export default {
	output: 'server',
	adapter: fastify({
		entry: new URL('./api/index.js', import.meta.url)
	})
};
```

### Options

#### entry

Specifies the entry point to define fastify routes and plugins. This module must export a default function that takes in the Fastify instance, where you can define routes and registry plugins.

__api/index.ts__

```js
import type { DefineFastifyRoutes } from '@matthewp/astro-fastify';

export default function(fastify) {
  fastify.get('/api/todos', function(request, reply) {
    reply.send({
      todos: [
        { label: 'eat lunch' },
        { label: 'exercise' },
        { label: 'walk the dog' }
      ]
    });
  })
}
```

### Note on route priority

Fastify runs in front of Astro's own routing, which means that any routes you define in fastify take priority over routes defined in Astro. So if, for example, you have conflicting routes the Astro route will never be hit.

### Production usage

__@matthewp/astro-fastify__ automatically configures Astro to build your fastify routes into your production build. Run your build as normal:

```shell
astro build
```

Or if you have an npm script:

```shell
npm run build
```

Which will create an entrypoint for your server, by default `dist/server/entry.mjs`. Running this file in Node.js automatically starts the fastify server:

```shell
node dist/server/entry.mjs
```

Configure your host to run this script. Assets and JavaScript are output to `dist/client/assets/`. You can configure your CDN to serve these files more efficiently and with long-lived cache headers.

## License

BSD-2-Clause