export class RateLimitError extends Error {
  readonly resetAt: string
  readonly limit: number

  constructor(limit: number, resetAt: string) {
    super("daily limit reached")
    this.name = "RateLimitError"
    this.limit = limit
    this.resetAt = resetAt
    // Required when extending built-in classes in TypeScript
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
