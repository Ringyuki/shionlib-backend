export interface ResponseInterface<T> {
  code: number
  message: string
  data: T | null
  requestId: string
  timestamp: string
}

export interface PaginatedResult<T> {
  items: T[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
    content_limit?: number
  }
}

export interface FieldError {
  field: string
  messages: string[]
}
