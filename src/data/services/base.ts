import { delegateToSchema } from '@graphql-tools/delegate'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { GraphQLResolveInfo, GraphQLSchema } from 'graphql'
import gql from 'graphql-tag'
import { mergeSchemas } from '@graphql-tools/merge'
import { makeRemoteSchema } from '../graphql/makeRemoteSchema'
import { schema as baseSchema } from '../durableObjects/base'

const typeDefs = gql`
  type Base {
    id: ID!
  }

  type Query {
    base(id: ID): Base
  }

  type BaseMutations {
    hi: String!
  }

  type Mutation {
    base(id: ID): BaseMutations!
  }
`

const makeResolvers = async (env: Environment) => {
  const { Base } = env
  return {
    Query: {
      base: async (
        parent: any,
        { id: hexId }: { id: string },
        context: undefined,
        info: GraphQLResolveInfo,
      ) => {
        const schema = await makeRemoteSchema({
          schema: baseSchema,
          durableObjectNamespace: Base,
          hexId,
        })
        if (schema)
          return delegateToSchema({
            schema,
            operation: 'query',
            fieldName: 'base',
            context,
            info,
          })
      },
    },
    Mutation: {
      base: async (
        parent: any,
        { id: hexId }: { id: string },
        context: undefined,
        info: GraphQLResolveInfo,
      ) => {
        const schema = await makeRemoteSchema({
          schema: baseSchema,
          durableObjectNamespace: Base,
          hexId,
        })
        if (schema)
          return delegateToSchema({
            schema,
            operation: 'mutation',
            fieldName: 'base',
            context,
            info,
          })
      },
    },
  }
}

export const makeSchema = async (env: Environment): Promise<GraphQLSchema> =>
  mergeSchemas({
    schemas: [makeExecutableSchema({ typeDefs }), baseSchema],
    resolvers: await makeResolvers(env),
  })
