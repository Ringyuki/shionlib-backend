import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'

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

  async getFile(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    })
    const result = await this.s3Client.send(command)
    return result
  }
}
