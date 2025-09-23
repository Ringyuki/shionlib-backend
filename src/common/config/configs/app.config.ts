export default () => ({
  port: process.env.PORT || 5000,
  environment: process.env.ENVIRONMENT || 'production',

  allowRegister: process.env.ALLOW_REGISTER === 'true',

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: process.env.CORS_METHODS || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  },

  email: {
    emailProvider: process.env.EMAIL_PROVIDER || 'elastic',
    emailApiKey: process.env.EMAIL_PROVIDER_API_KEY,
    emailEndPoint: process.env.EMAIL_PROVIDER_ENDPOINT,
    emailSenderAddress: process.env.EMAIL_SENDER_ADDRESS,
    emailSenderName: process.env.EMAIL_SENDER_NAME,
  },

  s3: {
    image: {
      bucket: process.env.S3_IMAGE_BUCKET,
      region: process.env.S3_IMAGE_REGION,
      accessKeyId: process.env.S3_IMAGE_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_IMAGE_SECRET_ACCESS_KEY,
    },
    game: {
      bucket: process.env.S3_FILE_BUCKET,
      region: process.env.S3_FILE_REGION,
      accessKeyId: process.env.S3_FILE_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_FILE_SECRET_ACCESS_KEY,
    },
  },

  bangumi: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  },
})
