import { makeExecutableSchema } from '@graphql-tools/schema'
import { fromGlobalId, ResolvedGlobalId, toGlobalId } from 'graphql-relay'
import gql from 'graphql-tag'
import { DurableGraphObject, Mutation, Query, Resolver } from '.'
import {
  typeDefs as scalarTypeDefs,
  resolvers as scalarResolvers,
} from '../graphqlUtils/scalars'

export const typeDefs = gql`
  """
  A \`Base\` is a container for a group of similar \`Entity\` instances.
  """
  type Base {
    """
    The \`Base\` instance's identifier.
    """
    id: ID!
    """
    The name of this \`Base\`.
    """
    name: String!
  }

  type Query {
    # Stub
    base: Base
  }

  """
  An object of values to update a \`Base\`.
  """
  input UpdateBaseInput {
    """
    The ID of the \`Base\` to update.
    """
    id: ID!
    """
    The name of the \`Base\`.
    """
    name: String
  }

  input DeleteBaseInput {
    """
    The ID of the \`Base\` to delete.
    """
    id: ID!
  }

  type Mutation {
    # Stubs
    # createBase isn't actually ever used (it just generates an ID and calls updateBase)
    updateBase(input: UpdateBaseInput!): Base
    deleteBase(input: DeleteBaseInput!): Void
  }
`

export const decodeID = (globalID: string): ResolvedGlobalId =>
  fromGlobalId(globalID)
export const encodeID = (hexID: string): string => toGlobalId('Base', hexID)

type GraphQLBase = {
  id(): string
  name(): string
}

type UpdateBaseInput = {
  name?: string
}

export const schema = makeExecutableSchema({
  typeDefs: [typeDefs, ...scalarTypeDefs],
  resolvers: { ...scalarResolvers },
})

export class Base extends DurableGraphObject {
  constructor(state: DurableObjectState, env: Environment) {
    super(state, env, { typeDefs, typeName: 'base' })
  }

  @Query()
  id: Resolver<undefined, string, Base> = async function id() {
    return encodeID(this._id.toString())
  }

  @Query()
  name: Resolver<undefined, string, Base> = async function name() {
    return this._storage
      .get<string>('name')
      .then((name) => name || 'Untitled Base')
  }

  @Mutation()
  updateBase: Resolver<
    { input: UpdateBaseInput },
    GraphQLBase,
    Base
  > = async function updateBase(this, parent, { input }) {
    if (input.name !== undefined) await this._storage.put('name', input.name)

    return this._resolveSelf<GraphQLBase>()
  }

  @Mutation()
  deleteBase: Resolver<undefined, void, Base> = async function deleteBase() {
    // TODO: This could exhaust our memory allocation if there are too many entries stored.
    // A `this._storage.deleteAll()` method is incoming: https://discord.com/channels/595317990191398933/773219443911819284/807787271830896670
    const map = await this._storage.list()
    const keys = [...map.keys()]
    await this._storage.delete(keys)
  }
}
