export default () => ({
  port: process.env.PORT || 5000,
  environment: process.env.ENVIRONMENT || 'production',

  allowRegister: process.env.ALLOW_REGISTER === 'true',

  throttle: {
    ttl: process.env.THROTTLE_TTL_MS || 60000,
    limit: process.env.THROTTLE_LIMIT || 100,
    blockDuration: process.env.THROTTLE_BLOCK_DURATION_MS || 10000,
    download: {
      ttl: process.env.THROTTLE_DOWNLOAD_TTL_MS || 60000,
      limit: process.env.THROTTLE_DOWNLOAD_LIMIT || 60,
      blockDuration: process.env.THROTTLE_DOWNLOAD_BLOCK_DURATION_MS || 360000 * 12,
    },
  },

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
    upload_quota: {
      base_size_bytes: process.env.UPLOAD_QUOTA_BASE_SIZE_BYTES || 5 * 1024 * 1024 * 1024, // 5GB
      cap_size_bytes: process.env.UPLOAD_QUOTA_CAP_SIZE_BYTES || 20 * 1024 * 1024 * 1024, // 20GB
      dynamic_step_bytes: process.env.UPLOAD_QUOTA_DYNAMIC_STEP_BYTES || 2 * 1024 * 1024 * 1024, // 2GB
      dynamic_threshold_bytes:
        process.env.UPLOAD_QUOTA_DYNAMIC_THRESHOLD_BYTES || 1 * 1024 * 1024 * 1024, // 1GB
      grant_after_days: process.env.UPLOAD_QUOTA_GRANT_AFTER_DAYS || 7,
      longest_inactive_days: process.env.UPLOAD_QUOTA_LONGEST_INACTIVE_DAYS || 30,
    },
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
    meilisearch: {
      host: process.env.MEILISEARCH_HOST,
      apiKey: process.env.MEILISEARCH_API_KEY,
      indexName: process.env.MEILISEARCH_INDEX_NAME || 'shionlib_games',
    },
  },

  game: {
    hot_score: {
      half_life_release_days: process.env.GAME_HOT_SCORE_HALF_LIFE_RELEASE_DAYS || 30,
      half_life_created_days: process.env.GAME_HOT_SCORE_HALF_LIFE_CREATED_DAYS || 15,
      weight_views: process.env.GAME_HOT_SCORE_WEIGHT_VIEWS || 0.6,
      weight_downloads: process.env.GAME_HOT_SCORE_WEIGHT_DOWNLOADS || 1.0,
      weight_release: process.env.GAME_HOT_SCORE_WEIGHT_RELEASE || 0.8,
      weight_created: process.env.GAME_HOT_SCORE_WEIGHT_CREATED || 0.4,
    },
  },
})
