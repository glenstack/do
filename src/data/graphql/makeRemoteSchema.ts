import { wrapSchema } from '@graphql-tools/wrap'
import { GraphQLSchema } from 'graphql'
import { makeRemoteExecutor } from './makeRemoteExecutor'

export const makeRemoteSchema = async ({
  schema,
  durableObjectNamespace,
  hexId,
}: {
  schema: GraphQLSchema
  durableObjectNamespace: DurableObjectNamespace
  hexId: string
}): Promise<GraphQLSchema | undefined> => {
  try {
    const id = durableObjectNamespace.idFromString(hexId)
    const stub = durableObjectNamespace.get(id)
    const executor = makeRemoteExecutor(stub)
    return wrapSchema({
      schema,
      executor,
    })
  } catch (error) {
    if (error instanceof TypeError) {
      // Invalid ID -> Ignore
    } else {
      throw error
    }
  }
}
