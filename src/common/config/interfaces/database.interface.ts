export interface DatabaseConfig {
  database: {
    url: string
  }
  redis: {
    host: string
    port: number
    password: string
    keyPrefix: string
    database: number
  }
}
