import { AuthConfig } from '../interfaces/auth.interface'

export default (): AuthConfig => ({
  token: {
    secret: process.env.TOKEN_SECRET!,
    expiresIn: process.env.TOKEN_EXPIRES_IN_SEC!,
  },
  refresh_token: {
    shortWindowSec: process.env.REFRESH_TOKEN_SHORT_WINDOW_SEC!,
    longWindowSec: process.env.REFRESH_TOKEN_LONG_WINDOW_SEC!,
    pepper: process.env.REFRESH_TOKEN_PEPPER!,
    rotationGraceSec: parseInt(process.env.REFRESH_TOKEN_ROTATION_GRACE_SEC || '100'),
    algorithmVersion: process.env.REFRESH_TOKEN_ALOGRITHM_VERSION || 'slrt1',
  },
})
