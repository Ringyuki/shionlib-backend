import type { Request, Response, NextFunction } from 'express'
import { randomUUID as nodeRandomUUID } from 'node:crypto'

export const requestId = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const headerId = req.header('x-request-id')
    req.id = headerId ?? globalThis.crypto?.randomUUID?.() ?? nodeRandomUUID()
    res.setHeader('X-Request-Id', req.id)
    next()
  }
}
