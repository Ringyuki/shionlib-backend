export default () => ({
  token: {
    secret: process.env.TOKEN_SECRET,
    expiresIn: process.env.TOKEN_EXPIRES_IN,
  },
  refresh_token: {
    shortWindowSec: process.env.REFRESH_TOKEN_SHORT_WINDOW_SEC,
    longWindowSec: process.env.REFRESH_TOKEN_LONG_WINDOW_SEC,
    pepper: process.env.REFRESH_TOKEN_PEPPER,
  },
})
