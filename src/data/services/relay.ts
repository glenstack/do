import { makeExecutableSchema } from '@graphql-tools/schema'
import { GraphQLResolveInfo, GraphQLSchema } from 'graphql'
import { fromGlobalId } from 'graphql-relay'
import gql from 'graphql-tag'
import { delegateToSchema } from '@graphql-tools/delegate'
import { Context } from './../durableGraphObjects/index'
import { makeRemoteSchema } from '../graphqlUtils/makeRemoteSchema'
import { schema as baseSchema } from '../durableGraphObjects/base'

const typeDefs = gql`
  interface Node {
    id: ID!
  }

  type Base implements Node {
    id: ID!
  }

  type Query {
    node(id: ID!): Node
  }
`

const simpleIDDelegator = (env: Environment) => {}

export const makeSchema = async (env: Environment): Promise<GraphQLSchema> => {
  const resolvers = {
    Query: {
      node: async (
        parent: any,
        { id: globalID }: { id: string },
        context: Context,
        info: GraphQLResolveInfo,
      ) => {
        const { id: hexID, type } = fromGlobalId(globalID)
        if (type === 'Base') {
          const id = env.Base.idFromString(hexID)
          const schema = await makeRemoteSchema({
            schema: baseSchema,
            durableObjectNamespace: env.Base,
            id,
          })
          console.log(JSON.stringify(info))
          return delegateToSchema({
            schema,
            operation: 'query',
            fieldName: 'base',
            context,
            info,
          })
        }
      },
    },
    Node: {
      __resolveType: (obj: any) => fromGlobalId(obj.id).type,
    },
  }

  return makeExecutableSchema({ typeDefs, resolvers })
}
