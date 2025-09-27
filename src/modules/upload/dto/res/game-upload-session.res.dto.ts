export class GameUploadSessionResDto {
  upload_session_id: number
  file_name?: string
  uploaded_chunks?: number[]
  chunk_size?: number
  total_chunks: number
  expires_at: Date
}
