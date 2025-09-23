import { Injectable } from '@nestjs/common'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { ShionConfigService } from '../../../common/config/services/config.service'

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client
  constructor(private readonly configService: ShionConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('s3.image.region'),
      endpoint: this.configService.get('s3.image.endpoint'),
      credentials: {
        accessKeyId: this.configService.get('s3.image.accessKeyId'),
        secretAccessKey: this.configService.get('s3.image.secretAccessKey'),
      },
    })
  }

  async uploadFile(key: string, buffer: Buffer) {
    const command = new PutObjectCommand({
      Bucket: this.configService.get('s3.image.bucket'),
      Key: key,
      Body: buffer,
    })
    const result = await this.s3Client.send(command)
    return result
  }

  async getFile(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.configService.get('s3.image.bucket'),
      Key: key,
    })
    const result = await this.s3Client.send(command)
    return result
  }
}
