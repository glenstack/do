declare type Environment = {
  Base: DurableObjectNamespace
}

declare interface CFWorker<Environment = Record<string, unknown>> {
  fetch(request: Request, env: Environment): Promise<Response>
}
