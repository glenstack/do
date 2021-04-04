import { makeGraphQLHandler } from '@glenstack/cf-workers-graphql'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { DocumentNode, GraphQLResolveInfo } from 'graphql'
import { errorResponse } from '../../utils/errorResponse'
import {
  typeDefs as scalarTypeDefs,
  resolvers as scalarResolvers,
} from '../graphqlUtils/scalars'
import 'reflect-metadata'

type GenericFunction = (...args: any[]) => any

export type Context = Record<string, any> | undefined

export type Resolver<
  Args extends Record<string, unknown> | undefined,
  ReturnType,
  DurableGraphObjectType extends DurableGraphObject = DurableGraphObject
> = (
  this: DurableGraphObjectType,
  parent: any,
  args: Args,
  context: Context,
  info: GraphQLResolveInfo,
) => ReturnType | Promise<ReturnType>

type GraphQLDecorator = (
  graphQLFieldName?: string,
) => (target: DurableGraphObject, key: string | symbol) => void

export const Query: GraphQLDecorator = (graphQLFieldName) => (target, key) => {
  const fieldName = graphQLFieldName || key.toString()
  const queries: Map<string, string | symbol> =
    Reflect.getOwnMetadata('queries', target) || new Map()
  if (!queries.has(fieldName)) {
    queries.set(fieldName, key)
  }
  Reflect.defineMetadata('queries', queries, target)
}

export const Mutation: GraphQLDecorator = (graphQLFieldName) => (
  target,
  key,
): void => {
  const fieldName = graphQLFieldName || key.toString()
  const mutations: Map<string, string | symbol> =
    Reflect.getOwnMetadata('mutations', target) || new Map()
  if (!mutations.has(fieldName)) {
    mutations.set(fieldName, key)
  }
  Reflect.defineMetadata('mutations', mutations, target)
}

const makeResolvers = (
  durableGraphObject: DurableGraphObject,
  typeName: string,
): {
  Query: Record<string, GenericFunction>
  Mutation: Record<string, GenericFunction>
} => {
  const queries: Record<string, GenericFunction> = Object.fromEntries(
    [...durableGraphObject._queries.entries()].map(([key, value]) => [
      key,
      (...args) => (durableGraphObject as any)[value](...args),
    ]),
  )
  const mutations: Record<string, GenericFunction> = Object.fromEntries(
    [...durableGraphObject._mutations.entries()].map(([key, value]) => [
      key,
      (...args) => (durableGraphObject as any)[value](...args),
    ]),
  )

  return {
    Query: {
      [typeName]: () => ({
        ...queries,
      }),
    },
    Mutation: { ...mutations },
  }
}

export abstract class DurableGraphObject implements DurableObject {
  protected _id: DurableObjectId
  protected _storage: DurableObjectStorage
  protected _env: Environment

  fetch: (request: Request) => Promise<Response>
  _resolveSelf: <T extends Record<string, GenericFunction>>() => T

  get _queries(): Map<string, string | symbol> {
    const queries = new Map<string, string | symbol>()
    let target = Object.getPrototypeOf(this)
    while (target !== Object.prototype) {
      const childQueries: Map<string, string | symbol> =
        Reflect.getOwnMetadata('queries', target) || new Map()
      for (const [key, value] of childQueries.entries()) {
        queries.set(key, value)
      }
      target = Object.getPrototypeOf(target)
    }

    return queries
  }

  get _mutations(): Map<string, string | symbol> {
    const mutations = new Map<string, string | symbol>()
    let target = Object.getPrototypeOf(this)
    while (target !== Object.prototype) {
      const childMutations: Map<string, string | symbol> =
        Reflect.getOwnMetadata('mutations', target) || new Map()
      for (const [key, value] of childMutations.entries()) {
        mutations.set(key, value)
      }
      target = Object.getPrototypeOf(target)
    }

    return mutations
  }

  constructor(
    { id, storage }: DurableObjectState,
    env: Environment,
    { typeName, typeDefs }: { typeName: string; typeDefs: DocumentNode },
  ) {
    this._id = id
    this._storage = storage
    this._env = env

    const resolvers = makeResolvers(this, typeName)

    const schema = makeExecutableSchema({
      typeDefs: [typeDefs, ...scalarTypeDefs],
      resolvers: {
        ...resolvers,
        ...scalarResolvers,
      },
    })

    this._resolveSelf = resolvers.Query[typeName]

    this.fetch = makeGraphQLHandler(schema, {
      makeErrorResponse: async (request, error) =>
        errorResponse(
          error,
          `DurableGraphObject (${this.constructor.name}) Error`,
        ),
    })
  }
}
