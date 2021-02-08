import { print } from 'graphql'
import { Executor } from '@graphql-tools/delegate'
import { errorResponse } from '../../utils/errorResponse'

export const makeRemoteExecutor = (
  stub: DurableObjectStub,
): Executor => async ({ document, variables }) => {
  try {
    const query = typeof document === 'string' ? document : print(document)
    const response = await stub.fetch('/', {
      method: 'POST',
      body: JSON.stringify({ query, variables }),
    })
    return await response.json()
  } catch (error) {
    return errorResponse(error, 'Remote Executor Error')
  }
}
