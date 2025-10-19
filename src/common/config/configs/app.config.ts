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
      endpoint: process.env.S3_IMAGE_ENDPOINT,
      accessKeyId: process.env.S3_IMAGE_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_IMAGE_SECRET_ACCESS_KEY,
    },
    game: {
      bucket: process.env.S3_FILE_BUCKET,
      region: process.env.S3_FILE_REGION,
      endpoint: process.env.S3_FILE_ENDPOINT,
      accessKeyId: process.env.S3_FILE_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_FILE_SECRET_ACCESS_KEY,
    },
  },

  b2: {
    applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
    applicationKey: process.env.B2_APPLICATION_KEY,
  },

  bangumi: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  },

  file_upload: {
    upload_large_file_transfer_limit: process.env.UPLOAD_LARGE_FILE_TRANSFER_LIMIT || '100mb',
    upload_large_file_max_size: process.env.UPLOAD_LARGE_FILE_MAX_SIZE || 1024 * 1024 * 1024 * 10, // 10GB
    upload_large_file_max_chunks: process.env.UPLOAD_LARGE_FILE_MAX_CHUNKS || 10000,
    upload_root_dir: process.env.FILE_UPLOAD_ROOT_DIR || '/tmp/shionlib-upload/',
    chunk_size: process.env.FILE_UPLOAD_CHUNK_SIZE || 1024 * 1024 * 50, // 50MB
    upload_session_expires_in: process.env.FILE_UPLOAD_SESSION_EXPIRES_IN || 1000 * 60 * 60 * 24, // 1 day
    upload_temp_file_suffix: process.env.FILE_UPLOAD_TEMP_FILE_SUFFIX || '.sltf', // shionlib temp file
  },

  file_scan: {
    clamscan_binary_path:
      process.env.CLAMSCAN_BINARY_PATH || '/opt/homebrew/opt/clamav/bin/clamscan',
    clamscan_db_path: process.env.CLAMSCAN_DB_PATH || '/opt/homebrew/var/lib/clamav',
  },

  file_download: {
    download_cdn_host: process.env.FILE_DOWNLOAD_CDN_HOST || 'https://ft.hikarifallback.uk/',
    download_expires_in: process.env.FILE_DOWNLOAD_EXPIRES_IN || 3600, // 1 hour
  },

  tasks: {
    image_upload: {
      enabled: process.env.TASKS_IMAGE_UPLOAD_ENABLED === 'true',
    },
  },

  search: {
    engine: process.env.SEARCH_ENGINE || 'pg',
  },
})
