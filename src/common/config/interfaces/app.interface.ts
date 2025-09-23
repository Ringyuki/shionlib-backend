export interface AppConfig {
  port: number
  environment: string
  allowRegister: boolean
  cors: {
    origin: string
    methods: string[]
  }
  email: {
    emailProvider: string
    emailApiKey: string
    emailEndPoint: string
    emailSenderAddress: string
    emailSenderName: string
  }
  s3: {
    image: {
      bucket: string
      region: string
      accessKeyId: string
      secretAccessKey: string
    }
    game: {
      bucket: string
      region: string
      accessKeyId: string
      secretAccessKey: string
    }
  }
  bangumi: {
    clientId: string
    clientSecret: string
  }
}
