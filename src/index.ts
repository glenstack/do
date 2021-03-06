import { makeHandler } from './data/graphql'
import { errorResponse } from './utils/errorResponse'

const handleFetch = async (
  request: Request,
  env: Environment,
): Promise<Response> => {
  try {
    const handler = await makeHandler(env)
    return handler(request)
  } catch (error) {
    return errorResponse(error, 'Critical error')
  }
}

// Worker
export default {
  fetch: handleFetch,
} as CFWorker<Environment>

// Durable Objects
export { Base } from './data/durableObjects/base'
