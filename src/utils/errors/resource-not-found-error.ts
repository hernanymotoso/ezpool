export class ResourceNotFoundError extends Error {
  constructor(resourceName?: string) {
    super(`Resource not found ${resourceName ?? ''}`)
    this.name = 'ResourceNotFoundError'
  }
}
