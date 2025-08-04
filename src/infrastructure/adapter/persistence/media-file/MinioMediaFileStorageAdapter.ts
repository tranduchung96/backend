import { MediaType } from '@core/common/enums/MediaEnums';
import { MediaFileStorageOptions } from '@core/common/persistence/MediaFileStorageOptions';
import { CoreAssert } from '@core/common/util/assert/CoreAssert';
import { MediaFileStoragePort } from '@core/domain/media/port/persistence/MediaFileStoragePort';
import { FileMetadata } from '@core/domain/media/value-object/FileMetadata';
import * as Minio from 'minio';
import { BucketItemStat } from 'minio';
import { Readable } from 'stream';
import { v4 } from 'uuid';
import {ConfigService} from '@nestjs/config';
import {Injectable} from '@nestjs/common';

@Injectable()
export class MinioMediaFileStorageAdapter implements MediaFileStoragePort {
  private client: Minio.Client;
  constructor(
      private readonly configService: ConfigService
  ) {
    this.client = new Minio.Client({
      endPoint : CoreAssert.notEmpty(this.configService.get<string>('FILE_STORAGE_ENDPOINT'), new Error('Minio: endpoint not set')),
      port     : CoreAssert.notEmpty(this.configService.get<number>('FILE_STORAGE_PORT'), new Error('Minio: port not set')),
      accessKey: CoreAssert.notEmpty(this.configService.get<string>('FILE_STORAGE_ACCESS_KEY'), new Error('Minio: access key not set')),
      secretKey: CoreAssert.notEmpty(this.configService.get<string>('FILE_STORAGE_SECRET_KEY'), new Error('Minio: secret key not set')),
      useSSL   : this.normalizeBoolean(
        CoreAssert.notEmpty(this.configService.get<string>('FILE_STORAGE_USE_SSL'), new Error('Minio: use SSL not set'))
      ),
    });
  }

  public async upload(uploadFile: Buffer | Readable, options: MediaFileStorageOptions): Promise<FileMetadata> {
    const uploadDetails: FileUploadDetails = this.defineFileUploadDetails(options.type);
    const bucket: string = uploadDetails.bucket;
    const key: string    = `${v4()}.${uploadDetails.ext}`;
  
    const size = Buffer.isBuffer(uploadFile) ? uploadFile.length : undefined;
    await this.client.putObject(bucket, key, uploadFile, size, {'content-type': uploadDetails.mimitype});
    const fileStat: BucketItemStat = await this.client.statObject(bucket, key);
    const fileMetadata: FileMetadata = await FileMetadata.new({
      relativePath: `${bucket}/${key}`,
      size        : fileStat.size,
      mimetype    : fileStat.metaData['content-type'],
      ext         : uploadDetails.ext
    });

    return fileMetadata;
  }
  
  private defineFileUploadDetails(type: MediaType): FileUploadDetails {
    const detailsRecord: Record<MediaType, FileUploadDetails> = {
      [MediaType.IMAGE]: {
        bucket: CoreAssert.notEmpty(this.configService.get<string>('FILE_STORAGE_IMAGE_BUCKET'), new Error('Minio: image bucket not set')),
        ext: CoreAssert.notEmpty(this.configService.get<string>('FILE_STORAGE_IMAGE_EXT'), new Error('Minio: image ext not set')),
        mimitype: CoreAssert.notEmpty(this.configService.get<string>('FILE_STORAGE_IMAGE_MIMETYPE'), new Error('Minio: image mimetype not set'))
      }
    };
    
    return CoreAssert.notEmpty(detailsRecord[type], new Error('Minio: unknown media type'));
  }
  private normalizeBoolean(value: unknown): boolean {
    return value === true || value === 'true';
  }
}

type FileUploadDetails = {bucket: string, ext: string, mimitype: string};
