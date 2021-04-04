import { Context } from './../durableGraphObjects/index'
import { delegateToSchema } from '@graphql-tools/delegate'
import { GraphQLResolveInfo, GraphQLSchema } from 'graphql'
import { makeRemoteSchema } from './makeRemoteSchema'

export const simpleIDDelegationResolver = ({
  schema: namespaceSchema,
  durableObjectNamespace,
  operation,
  fieldName,
}: {
  schema: GraphQLSchema
  durableObjectNamespace: DurableObjectNamespace
  operation: Parameters<typeof delegateToSchema>[0]['operation']
  fieldName: Parameters<typeof delegateToSchema>[0]['fieldName']
}) => async (
  parent: any,
  { id: hexID }: { id: string },
  context: Context,
  info: GraphQLResolveInfo,
): Promise<ReturnType<typeof delegateToSchema> | undefined> => {
  try {
    const id = durableObjectNamespace.idFromString(hexID)
    const schema = await makeRemoteSchema({
      schema: namespaceSchema,
      durableObjectNamespace,
      id,
    })
    return delegateToSchema({ schema, operation, fieldName, context, info })
  } catch (error) {
    if (error instanceof TypeError) {
      // Invalid ID -> ignore
    } else {
      throw error
    }
  }
}
