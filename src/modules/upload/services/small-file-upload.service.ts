import { Injectable } from '@nestjs/common'
import { S3Service } from '../../s3/services/s3.service'

@Injectable()
export class SmallFileUploadService {
  constructor(private readonly s3Service: S3Service) {}
}
