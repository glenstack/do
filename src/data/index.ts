import { makeGraphQLHandler } from '@glenstack/cf-workers-graphql'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { stitchSchemas } from '@graphql-tools/stitch'
import gql from 'graphql-tag'
import {
  typeDefs as scalarTypeDefs,
  resolvers as scalarResolvers,
} from './graphqlUtils/scalars'
import { errorResponse } from '../utils/errorResponse'
import { makeSchema as makeRelayServiceSchema } from './services/relay'
import { makeSchema as makeBaseServiceSchema } from './services/base'

const rootTypeDefs = gql`
  type Query {
    hello: String!
  }

  type Mutation {
    hello: String!
  }
`

const rootSchema = makeExecutableSchema({
  typeDefs: [rootTypeDefs, ...scalarTypeDefs],
  resolvers: {
    Query: {
      hello: () => 'Hello, world!',
    },
    Mutation: {
      hello: () => 'Hello, world!',
    },
    ...scalarResolvers,
  },
})

const makeSchema = async (env: Environment) => {
  const relayServiceSchema = await makeRelayServiceSchema(env)
  const baseServiceSchema = await makeBaseServiceSchema(env)
  const schema = stitchSchemas({
    subschemas: [
      { schema: rootSchema },
      { schema: relayServiceSchema },
      { schema: baseServiceSchema },
    ],
  })
  return schema
}

export const makeHandler = async (
  env: Environment,
): Promise<(request: Request) => Promise<Response>> => {
  const schema = await makeSchema(env)
  return makeGraphQLHandler(schema, {
    makeErrorResponse: async (request, error) =>
      errorResponse(error, 'Gateway Error'),
  })
}
