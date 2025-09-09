export interface AuthConfig {
  jwt: {
    secret: string
    refreshSecret: string
    expiresIn: string
    refreshExpiresIn: string
  }
}
