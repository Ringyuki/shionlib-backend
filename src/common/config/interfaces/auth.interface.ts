export interface AuthConfig {
  token: {
    secret: string
    expiresIn: string
  }
  refresh_token: {
    shortWindowSec: string
    longWindowSec: string
    pepper: string
    rotationGraceSec: string
    algorithmVersion: string
  }
}
