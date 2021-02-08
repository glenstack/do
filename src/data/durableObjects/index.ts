import { makeGraphQLHandler } from '@glenstack/cf-workers-graphql'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { DocumentNode, GraphQLResolveInfo } from 'graphql'
import { errorResponse } from '../../utils/errorResponse'

export type Context = Record<string, unknown> | undefined

export type Resolver<
  Args extends Record<string, unknown> | undefined,
  Type,
  DurableObjectType extends AwesomeObject = AwesomeObject
> = (
  this: DurableObjectType,
  args: Args,
  context: Context,
  info: GraphQLResolveInfo,
) => Type | Promise<Type>

const makeResolvers = (awesomeObject: AwesomeObject, typeName: string) => {
  // TODO: Let you specify custom mappings of GraphQL fields -> resolver functions on the DO
  return {
    Query: {
      [typeName]: () => awesomeObject,
    },
    Mutation: {
      [typeName]: () => awesomeObject,
    },
  }
}

export abstract class AwesomeObject implements DurableObject {
  protected _id: DurableObjectId
  protected _storage: DurableObjectStorage
  protected _env: Environment

  fetch: (request: Request) => Promise<Response>

  constructor(
    { typeName, typeDefs }: { typeName: string; typeDefs: DocumentNode },
    { id, storage }: DurableObjectState,
    env: Environment,
  ) {
    this._id = id
    this._storage = storage
    this._env = env

    const schema = makeExecutableSchema({
      typeDefs,
      resolvers: makeResolvers(this, typeName),
    })

    this.fetch = makeGraphQLHandler(schema, {
      makeErrorResponse: async (request, error) =>
        errorResponse(error, `Durable Object (${this.constructor.name}) Error`),
    })
  }
}
