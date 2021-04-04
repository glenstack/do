# Durable Graph Objects

Durable Objects are only accessible over the Fetch API, and although it's not
actually HTTP, it does mean that we can't directly access a Durable Object's
properties or methods from outside of itself. Wrapping this HTTP layer with
GraphQL then is a very elegant solution, since it lets us specify exactly what
we need from a Durable Object.

Durable Graph Objects are enhanced
[Durable Objects](https://developers.cloudflare.com/workers/runtime-apis/durable-objects)
which contain a little bit of magic which helps you expose their methods as
[GraphQL resolvers](https://www.apollographql.com/docs/apollo-server/data/resolvers/).

Have a look at the existing classes defined in the
[`durableGraphObjects` folder](./durableGraphObjects) for examples.

## GraphQL Schema

Each of the registered Durable Graph Objects have their GraphQL types merged and
schemas all stitched together. This creates a single entrypoint from which you
can access all of the Durable Graph Objects.

To register a Durable Graph Object, you must create a service. Predictably,
these live in the [`services` folder](./services), and are responsible for
delegating that branch of the graph to the respective Durable Graph Object
instance. They create the resolvers on the root Query and Mutation type, but
should stub out the Durable Graph Object type itself. These Durable Graph Object
types are defined beside the class definition itself (and equally, those
definitions stub out the Query and Mutation resolvers). Everything comes
together upon stitching.
