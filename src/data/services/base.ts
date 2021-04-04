import { delegateToSchema } from '@graphql-tools/delegate'
import { simpleIDDelegationResolver } from '../graphqlUtils/simpleIDDelegationResolver'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { GraphQLResolveInfo, GraphQLSchema } from 'graphql'
import gql from 'graphql-tag'
import { mergeSchemas } from '@graphql-tools/merge'
import { schema as baseSchema } from '../durableGraphObjects/base'
import {
  typeDefs as scalarTypeDefs,
  resolvers as scalarResolvers,
} from '../graphqlUtils/scalars'
import { makeRemoteSchema } from '../graphqlUtils/makeRemoteSchema'
import { NotFoundError } from '../graphqlUtils/errors'
import { Context } from '../durableGraphObjects'

const typeDefs = gql`
  type Base {
    # Stub
    id: ID!
  }

  type Query {
    """
    Gets a \`Base\`. Returns \`null\` if no \`Base\` was found with that ID.
    """
    base(
      """
      The ID of the \`Base\`.
      """
      id: ID
    ): Base
  }

  """
  An object of values to create a \`Base\`.
  """
  input CreateBaseInput {
    """
    The name of the \`Base\`.
    """
    name: String!
  }

  input UpdateBaseInput {
    # Stub
    id: ID!
  }

  input DeleteBaseInput {
    # Stub
    id: ID!
  }

  type Mutation {
    """
    Creates a new \`Base\`.
    """
    createBase(
      """
      An object of values to create a \`Base\`.
      """
      input: CreateBaseInput!
    ): Base

    """
    Updates an existing \`Base\`. Returns the newly updated \`Base\`.
    """
    updateBase(
      """
      An object of values to update a \`Base\`.
      """
      input: UpdateBaseInput!
    ): Base

    """
    Deletes an existing \`Base\`.
    """
    deleteBase(
      """
      An object of values to delete a \`Base\`.
      """
      input: DeleteBaseInput!
    ): Void
  }
`

// const paginateResolver = ({
//   schema: namespaceSchema,
//   durableObjectNamespace,
//   operation,
//   fieldName,
// }: {
//   schema: GraphQLSchema
//   durableObjectNamespace: DurableObjectNamespace
//   operation: Parameters<typeof delegateToSchema>[0]['operation']
//   fieldName: Parameters<typeof delegateToSchema>[0]['fieldName']
// }) => async (
//   parent: any,
//   {}: ConnectionParameters,
//   context: Context,
//   info: GraphQLResolveInfo,
// ) => {}

type CreateBaseInput = {
  name: string
}

const createBaseResolver = (env: Environment) => {
  const { Base, DO_INSTANCES } = env

  return async (
    parent: any,
    { input }: { input: CreateBaseInput },
    context: Context,
    info: GraphQLResolveInfo,
  ) => {
    const id = Base.newUniqueId()
    const hexID = id.toString()

    await DO_INSTANCES.put(`Base:${hexID}`, hexID)

    await updateBaseResolver(env)(
      parent,
      { input: { ...input, id: hexID } },
      context,
      info,
    )
  }
}

type UpdateBaseInput = {
  id: string
  name?: string
}

const updateBaseResolver = (env: Environment) => {
  const { Base } = env

  return async (
    parent: any,
    { input }: { input: UpdateBaseInput },
    context: Context,
    info: GraphQLResolveInfo,
  ) => {
    const hexID = input.id
    try {
      const id = Base.idFromString(hexID)
      const schema = await makeRemoteSchema({
        schema: baseSchema,
        durableObjectNamespace: Base,
        id,
      })

      const response = await delegateToSchema({
        schema,
        operation: 'mutation',
        fieldName: 'updateBase',
        args: { input },
        context,
        info,
      })

      return response
    } catch (error) {
      if (error instanceof TypeError) {
        throw new NotFoundError('Base', hexID)
      } else {
        throw error
      }
    }
  }
}

type DeleteBaseInput = {
  id: string
}

const deleteBaseResolver = (env: Environment) => {
  const { Base, DO_INSTANCES } = env

  return async (
    parent: any,
    { input }: { input: DeleteBaseInput },
    context: Context,
    info: GraphQLResolveInfo,
  ) => {
    const hexID = input.id
    try {
      const id = Base.idFromString(hexID)
      const schema = await makeRemoteSchema({
        schema: baseSchema,
        durableObjectNamespace: Base,
        id,
      })

      const response = await delegateToSchema({
        schema,
        operation: 'mutation',
        fieldName: 'deleteBase',
        args: { input },
        context,
        info,
      })

      await DO_INSTANCES.delete(`Base:${hexID}`)

      return response
    } catch (error) {
      if (error instanceof TypeError) {
        throw new NotFoundError('Base', hexID)
      } else {
        throw error
      }
    }
  }
}

const makeResolvers = async (env: Environment) => {
  const { Base } = env

  return {
    Query: {
      base: simpleIDDelegationResolver({
        schema: baseSchema,
        durableObjectNamespace: Base,
        operation: 'query',
        fieldName: 'base',
      }),
      // bases: paginateResolver({
      //   schema: baseSchema,
      //   durableObjectNamespace: Base,
      //   operation: 'query',
      //   fieldName: 'base',
      // }),
    },
    Mutation: {
      createBase: createBaseResolver(env),
      updateBase: updateBaseResolver(env),
      deleteBase: deleteBaseResolver(env),
    },
  }
}

export const makeSchema = async (env: Environment): Promise<GraphQLSchema> =>
  mergeSchemas({
    schemas: [
      makeExecutableSchema({
        typeDefs: [typeDefs, ...scalarTypeDefs],
        resolvers: { ...scalarResolvers },
      }),
      baseSchema,
    ],
    resolvers: await makeResolvers(env),
  })
