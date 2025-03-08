export class RequiredFieldError extends Error {
  constructor(fieldName: string) {
    super(`Required field ${fieldName}`)
    this.name = 'RequiredFieldError'
  }
}
