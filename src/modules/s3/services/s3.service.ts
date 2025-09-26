import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { Readable } from 'node:stream'

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger: Logger
  constructor(
    private readonly s3Client: S3Client,
    private readonly bucket: string,
  ) {
    this.logger = new Logger(S3Service.name)
  }

  async onModuleInit() {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucket,
      })
      this.s3Client.send(command)
      this.logger.log(`S3 client initialized successfully for bucket ${this.bucket}`)
    } catch (error) {
      this.logger.error(error)
    }
  }

  async uploadFile(key: string, buffer: Buffer, contentType: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
    const result = await this.s3Client.send(command)
    return result
  }

  async uploadFileStream(
    key: string,
    stream: Readable,
    contentType: string,
    game_id: number,
    uploader_id: number,
    file_hash: string,
  ) {
    const uploader = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: stream,
        ContentType: contentType,
        Metadata: {
          'game-id': game_id.toString(),
          'uploader-id': uploader_id.toString(),
          scan: 'ok',
          'file-sha256': file_hash,
        },
      },
      queueSize: 4,
      partSize: 1024 * 1024 * 32,
      leavePartsOnError: false,
    })
    return uploader.done()
  }

  async getFile(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })
    const result = await this.s3Client.send(command)
    return result
  }

  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })
    await this.s3Client.send(command)
  }

  async getFileList() {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
    })
    const result = await this.s3Client.send(command)
    return result
  }
}
