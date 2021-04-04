declare type Environment = {
  Base: DurableObjectNamespace
  DO_INSTANCES: KVNamespace
}

declare interface CFWorker<Environment = Record<string, unknown>> {
  fetch(request: Request, env: Environment): Promise<Response>
}
