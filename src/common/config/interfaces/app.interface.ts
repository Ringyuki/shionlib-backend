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
      endpoint: string
      accessKeyId: string
      secretAccessKey: string
    }
    game: {
      bucket: string
      region: string
      endpoint: string
      accessKeyId: string
      secretAccessKey: string
    }
  }
  bangumi: {
    clientId: string
    clientSecret: string
  }
  file_upload: {
    upload_large_file_transfer_limit: string
    upload_large_file_max_size: number
    upload_large_file_max_chunks: number
    upload_root_dir: string
    chunk_size: number
    upload_session_expires_in: number
  }
  file_scan: {
    clamscan_binary_path: string
    clamscan_db_path: string
  }
}
