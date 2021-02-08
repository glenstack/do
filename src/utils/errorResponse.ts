type ErrorWithDetails = Error & { details?: string }

export const errorResponse = (
  error: ErrorWithDetails,
  additionalMessage?: string,
): Response =>
  new Response(
    JSON.stringify({
      name: error.constructor.name,
      message: error.message,
      stack: error.stack,
      details: error.details,
      additionalMessage,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
    },
  )
