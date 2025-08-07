// src/infrastructure/adapter/usecase/post/CreatePostAdapter.ts (Updated)
import { UseCaseValidatableAdapter } from '@core/common/adapter/usecase/UseCaseValidatableAdapter';
import { CreatePostPort } from '@core/domain/post/port/usecase/CreatePostPort';
import { Exclude, Expose, plainToClass } from 'class-transformer';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

@Exclude()
export class CreatePostAdapter extends UseCaseValidatableAdapter implements CreatePostPort {

  @Expose()
  @IsUUID()
  public executorId: string;

  @Expose()
  @IsString()
  public title: string;

  @Expose()
  @IsOptional()
  @IsUUID()
  public imageId?: string; // Backward compatibility

  @Expose()
  @IsOptional()
  @IsUUID()
  public coverImageId?: string;

  @Expose()
  @IsOptional()
  @IsArray()
  @IsUUID(4, { each: true })
  public galleryImageIds?: string[];

  @Expose()
  @IsOptional()
  @IsString()
  public content?: string;

  public static async new(payload: CreatePostPort): Promise<CreatePostAdapter> {
    const adapter: CreatePostAdapter = plainToClass(CreatePostAdapter, payload);
    await adapter.validate();

    return adapter;
  }
}