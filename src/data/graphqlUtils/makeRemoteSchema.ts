import { wrapSchema } from '@graphql-tools/wrap'
import { GraphQLSchema } from 'graphql'
import { makeRemoteExecutor } from './makeRemoteExecutor'

export const makeRemoteSchema = async ({
  schema,
  durableObjectNamespace,
  id,
}: {
  schema: GraphQLSchema
  durableObjectNamespace: DurableObjectNamespace
  id: DurableObjectId
}): Promise<GraphQLSchema> => {
  const stub = durableObjectNamespace.get(id)
  const executor = makeRemoteExecutor(stub)
  return wrapSchema({
    schema,
    executor,
  })
}
