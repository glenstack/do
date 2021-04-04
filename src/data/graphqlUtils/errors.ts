export class NotFoundError extends ReferenceError {
  constructor(className: string, id: string) {
    super(`${className} with ID ${id} could not be found.`)
    this.name = 'NotFoundError'
  }
}
