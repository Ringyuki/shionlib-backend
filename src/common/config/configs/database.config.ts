import { DatabaseConfig } from '../interfaces/database.interface'

export default (): DatabaseConfig => ({
  database: {
    url: process.env.DATABASE_URL!,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD!,
    keyPrefix: process.env.REDIS_KEY_PREFIX || 'shionlib',
    database: parseInt(process.env.REDIS_DB || '0'),
  },
})
