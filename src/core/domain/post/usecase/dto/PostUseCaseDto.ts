// src/core/domain/post/usecase/dto/PostUseCaseDto.ts (Updated)
import { PostStatus } from '@core/common/enums/PostEnums';
import { UserRole } from '@core/common/enums/UserEnums';
import { Nullable, Optional } from '@core/common/type/CommonTypes';

export interface PostImageDto {
  id: string;
  url: string;
}

export interface PostMediaDto {
  id: string;
  mediaId: string;
  type: 'COVER' | 'GALLERY';
  sortOrder: number;
  media: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    ext: string;
    mimetype: string;
  };
}

export interface PostOwnerDto {
  id: string;
  name: string;
  role: UserRole;
}

export interface PostUseCaseDto {
  id: string;
  owner: PostOwnerDto;
  title: string;
  content: Nullable<string>;
  status: PostStatus;

  // Keep for backward compatibility
  image?: PostImageDto;

  // New media collection fields
  coverImage?: PostImageDto;
  galleryImages: PostImageDto[];
  mediaCollection: PostMediaDto[];

  createdAt: number;
  editedAt: Optional<number>;
  publishedAt: Optional<number>;
}

// src/application/api/http-rest/controller/documentation/post/HttpRestApiModelCreatePostBody.ts (Updated)
import { ApiProperty } from '@nestjs/swagger';

export class HttpRestApiModelCreatePostBody {

  @ApiProperty({type: 'string'})
  public title: string;

  @ApiProperty({type: 'string', required: false, description: 'Backward compatibility - use coverImageId instead'})
  public imageId?: string;

  @ApiProperty({type: 'string', required: false})
  public coverImageId?: string;

  @ApiProperty({type: 'array', items: {type: 'string'}, required: false})
  public galleryImageIds?: string[];

  @ApiProperty({type: 'string', required: false})
  public content?: string;
}

// src/application/api/http-rest/controller/documentation/post/HttpRestApiModelEditPostBody.ts (Updated)  
import { ApiProperty } from '@nestjs/swagger';

export class HttpRestApiModelEditPostBody {

  @ApiProperty({type: 'string'})
  public title: string;

  @ApiProperty({type: 'string', required: false, description: 'Backward compatibility - use coverImageId instead'})
  public imageId?: string;

  @ApiProperty({type: 'string', required: false})
  public coverImageId?: string;

  @ApiProperty({type: 'array', items: {type: 'string'}, required: false})
  public galleryImageIds?: string[];

  @ApiProperty({type: 'string', required: false})
  public content?: string;
}

// src/application/api/http-rest/controller/documentation/post/HttpRestApiModelPostMedia.ts
import { ApiProperty } from '@nestjs/swagger';

export class HttpRestApiModelPostMediaItem {

  @ApiProperty({type: 'string'})
  public id: string;

  @ApiProperty({type: 'string'})
  public name: string;

  @ApiProperty({type: 'string'})
  public url: string;

  @ApiProperty({type: 'string'})
  public type: string;

  @ApiProperty({type: 'number'})
  public size: number;

  @ApiProperty({type: 'string'})
  public ext: string;

  @ApiProperty({type: 'string'})
  public mimetype: string;
}

export class HttpRestApiModelPostMedia {

  @ApiProperty({type: 'string'})
  public id: string;

  @ApiProperty({type: 'string'})
  public mediaId: string;

  @ApiProperty({enum: ['COVER', 'GALLERY']})
  public type: 'COVER' | 'GALLERY';

  @ApiProperty({type: 'number'})
  public sortOrder: number;

  @ApiProperty({type: HttpRestApiModelPostMediaItem})
  public media: HttpRestApiModelPostMediaItem;
}

// src/application/api/http-rest/controller/documentation/post/HttpRestApiModelPost.ts (Updated)
import { HttpRestApiModelPostImage } from '@application/api/http-rest/controller/documentation/post/HttpRestApiModelPostImage';
import { HttpRestApiModelPostOwner } from '@application/api/http-rest/controller/documentation/post/HttpRestApiModelPostOwner';
import { HttpRestApiModelPostMedia } from '@application/api/http-rest/controller/documentation/post/HttpRestApiModelPostMedia';
import { PostStatus } from '@core/common/enums/PostEnums';
import { ApiProperty } from '@nestjs/swagger';

export class HttpRestApiModelPost {

  @ApiProperty({type: 'string'})
  public id: string;

  @ApiProperty({type: HttpRestApiModelPostOwner})
  public owner: HttpRestApiModelPostOwner;

  @ApiProperty({type: HttpRestApiModelPostImage, required: false, description: 'Backward compatibility'})
  public image?: HttpRestApiModelPostImage;

  @ApiProperty({type: HttpRestApiModelPostImage, required: false})
  public coverImage?: HttpRestApiModelPostImage;

  @ApiProperty({type: HttpRestApiModelPostImage, isArray: true})
  public galleryImages: HttpRestApiModelPostImage[];

  @ApiProperty({type: HttpRestApiModelPostMedia, isArray: true})
  public mediaCollection: HttpRestApiModelPostMedia[];

  @ApiProperty({type: 'string'})
  public title: string;

  @ApiProperty({type: 'string'})
  public content: string;

  @ApiProperty({enum: PostStatus})
  public status: PostStatus;

  @ApiProperty({type: 'number'})
  public createdAt: number;

  @ApiProperty({type: 'number', required: false})
  public editedAt?: number;

  @ApiProperty({type: 'number', required: false})
  public publishedAt?: number;
}