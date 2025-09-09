export interface ResponseInterface<T> {
  code: number
  message: string
  data: T | null
  requestId: string
  timestamp: number
}

export interface PaginatedResult<T> {
  items: T[]
  meta: {
    totalItems: number
    itemCount: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}
