// src/application/api/http-rest/controller/PostController.ts (Updated)
import { HttpAuth } from '@application/api/http-rest/auth/decorator/HttpAuth';
import { HttpUser } from '@application/api/http-rest/auth/decorator/HttpUser';
import { HttpUserPayload } from '@application/api/http-rest/auth/type/HttpAuthTypes';
import { HttpRestApiModelCreatePostBody } from '@application/api/http-rest/controller/documentation/post/HttpRestApiModelCreatePostBody';
import { HttpRestApiModelEditPostBody } from '@application/api/http-rest/controller/documentation/post/HttpRestApiModelEditPostBody';
import { HttpRestApiModelGetPostListQuery } from '@application/api/http-rest/controller/documentation/post/HttpRestApiModelGetPostListQuery';
import { HttpRestApiResponsePost } from '@application/api/http-rest/controller/documentation/post/HttpRestApiResponsePost';
import { HttpRestApiResponsePostList } from '@application/api/http-rest/controller/documentation/post/HttpRestApiResponsePostList';
import { CoreApiResponse } from '@core/common/api/CoreApiResponse';
import { PostStatus } from '@core/common/enums/PostEnums';
import { UserRole } from '@core/common/enums/UserEnums';
import { PostDITokens } from '@core/domain/post/di/PostDITokens';
import { CreatePostUseCase } from '@core/domain/post/usecase/CreatePostUseCase';
import { PostUseCaseDto } from '@core/domain/post/usecase/dto/PostUseCaseDto';
import { EditPostUseCase } from '@core/domain/post/usecase/EditPostUseCase';
import { GetPostListUseCase } from '@core/domain/post/usecase/GetPostListUseCase';
import { GetPostUseCase } from '@core/domain/post/usecase/GetPostUseCase';
import { PublishPostUseCase } from '@core/domain/post/usecase/PublishPostUseCase';
import { RemovePostUseCase } from '@core/domain/post/usecase/RemovePostUseCase';
import { CreatePostAdapter } from '@infrastructure/adapter/usecase/post/CreatePostAdapter';
import { EditPostAdapter } from '@infrastructure/adapter/usecase/post/EditPostAdapter';
import { GetPostAdapter } from '@infrastructure/adapter/usecase/post/GetPostAdapter';
import { GetPostListAdapter } from '@infrastructure/adapter/usecase/post/GetPostListAdapter';
import { PublishPostAdapter } from '@infrastructure/adapter/usecase/post/PublishPostAdapter';
import { RemovePostAdapter } from '@infrastructure/adapter/usecase/post/RemovePostAdapter';
import { AddPostMediaAdapter, RemovePostMediaAdapter, ReorderPostMediaAdapter } from '@infrastructure/adapter/usecase/post/ManagePostMediaAdapter';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { URL } from 'url';
import { CoreAssert } from '@core/common/util/assert/CoreAssert';
import { ConfigService } from '@nestjs/config';

@Controller('posts')
@ApiTags('posts')
export class PostController {

  constructor(
      @Inject(PostDITokens.CreatePostUseCase)
      private readonly createPostUseCase: CreatePostUseCase,

      @Inject(PostDITokens.EditPostUseCase)
      private readonly editPostUseCase: EditPostUseCase,

      @Inject(PostDITokens.GetPostListUseCase)
      private readonly getPostListUseCase: GetPostListUseCase,

      @Inject(PostDITokens.GetPostUseCase)
      private readonly getPostUseCase: GetPostUseCase,

      @Inject(PostDITokens.PublishPostUseCase)
      private readonly publishPostUseCase: PublishPostUseCase,

      @Inject(PostDITokens.RemovePostUseCase)
      private readonly removePostUseCase: RemovePostUseCase,

      // New use cases for media management
      @Inject(PostDITokens.AddPostMediaUseCase)
      private readonly addPostMediaUseCase: any, // Will be defined in DI tokens

      @Inject(PostDITokens.RemovePostMediaUseCase)
      private readonly removePostMediaUseCase: any,

      @Inject(PostDITokens.ReorderPostMediaUseCase)
      private readonly reorderPostMediaUseCase: any,

      private readonly configService: ConfigService
  ) {}

  @Post()
  @HttpAuth(UserRole.AUTHOR)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiBody({type: HttpRestApiModelCreatePostBody})
  @ApiResponse({status: HttpStatus.OK, type: HttpRestApiResponsePost})
  public async createPost(@HttpUser() user: HttpUserPayload, @Body() body: HttpRestApiModelCreatePostBody): Promise<CoreApiResponse<PostUseCaseDto>> {
    const adapter: CreatePostAdapter = await CreatePostAdapter.new({
      executorId: user.id,
      title: body.title,
      imageId: body.imageId, // Backward compatibility
      coverImageId: body.coverImageId,
      galleryImageIds: body.galleryImageIds,
      content: body.content,
    });

    const createdPost: PostUseCaseDto = await this.createPostUseCase.execute(adapter);
    this.setFileStorageBasePath([createdPost]);

    return CoreApiResponse.success(createdPost);
  }

  @Put(':postId')
  @HttpAuth(UserRole.AUTHOR)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiBody({type: HttpRestApiModelEditPostBody})
  @ApiResponse({status: HttpStatus.OK, type: HttpRestApiResponsePost})
  public async editPost(
      @HttpUser() user: HttpUserPayload,
      @Body() body: HttpRestApiModelEditPostBody,
      @Param('postId') postId: string
  ): Promise<CoreApiResponse<PostUseCaseDto>> {

    const adapter: EditPostAdapter = await EditPostAdapter.new({
      executorId: user.id,
      postId: postId,
      title: body.title,
      content: body.content,
      imageId: body.imageId, // Backward compatibility
      coverImageId: body.coverImageId,
      galleryImageIds: body.galleryImageIds,
    });

    const editedPost: PostUseCaseDto = await this.editPostUseCase.execute(adapter);
    this.setFileStorageBasePath([editedPost]);

    return CoreApiResponse.success(editedPost);
  }

  @Get()
  @HttpAuth(UserRole.AUTHOR, UserRole.ADMIN, UserRole.GUEST)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiQuery({name: 'authorId', type: 'string', required: false})
  @ApiResponse({status: HttpStatus.OK, type: HttpRestApiResponsePostList})
  public async getPostList(
      @HttpUser() user: HttpUserPayload,
      @Query() query: HttpRestApiModelGetPostListQuery
  ): Promise<CoreApiResponse<PostUseCaseDto[]>> {

    const adapter: GetPostListAdapter = await GetPostListAdapter.new({
      executorId: user.id,
      ownerId: query.authorId,
      status: PostStatus.PUBLISHED
    });
    const posts: PostUseCaseDto[] = await this.getPostListUseCase.execute(adapter);
    this.setFileStorageBasePath(posts);

    return CoreApiResponse.success(posts);
  }

  @Get('mine')
  @HttpAuth(UserRole.AUTHOR)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiResponse({status: HttpStatus.OK, type: HttpRestApiResponsePostList})
  public async getMinePostList(@HttpUser() user: HttpUserPayload): Promise<CoreApiResponse<PostUseCaseDto[]>> {
    const adapter: GetPostListAdapter = await GetPostListAdapter.new({
      executorId: user.id,
      ownerId: user.id,
    });
    const posts: PostUseCaseDto[] = await this.getPostListUseCase.execute(adapter);
    this.setFileStorageBasePath(posts);

    return CoreApiResponse.success(posts);
  }

  @Get(':postId')
  @HttpAuth(UserRole.AUTHOR, UserRole.ADMIN, UserRole.GUEST)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiResponse({status: HttpStatus.OK, type: HttpRestApiResponsePost})
  public async getPost(@HttpUser() user: HttpUserPayload, @Param('postId') postId: string): Promise<CoreApiResponse<PostUseCaseDto>> {
    const adapter: GetPostAdapter = await GetPostAdapter.new({executorId: user.id, postId: postId});
    const post: PostUseCaseDto = await this.getPostUseCase.execute(adapter);
    this.setFileStorageBasePath([post]);

    return CoreApiResponse.success(post);
  }

  @Post(':postId/publish')
  @HttpAuth(UserRole.AUTHOR)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiResponse({status: HttpStatus.OK, type: HttpRestApiResponsePost})
  public async publishPost(@HttpUser() user: HttpUserPayload, @Param('postId') postId: string): Promise<CoreApiResponse<PostUseCaseDto>> {
    const adapter: PublishPostAdapter = await PublishPostAdapter.new({executorId: user.id, postId: postId});
    const post: PostUseCaseDto = await this.publishPostUseCase.execute(adapter);
    this.setFileStorageBasePath([post]);

    return CoreApiResponse.success(post);
  }

  @Delete(':postId')
  @HttpAuth(UserRole.AUTHOR)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiResponse({status: HttpStatus.OK})
  public async removePost(@HttpUser() user: HttpUserPayload, @Param('postId') postId: string): Promise<CoreApiResponse<void>> {
    const adapter: RemovePostAdapter = await RemovePostAdapter.new({executorId: user.id, postId: postId});
    await this.removePostUseCase.execute(adapter);

    return CoreApiResponse.success();
  }

  // New endpoints for media management
  @Post(':postId/media')
  @HttpAuth(UserRole.AUTHOR)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mediaId: { type: 'string', format: 'uuid' },
        type: { type: 'string', enum: ['COVER', 'GALLERY'] },
        sortOrder: { type: 'number', required: false }
      },
      required: ['mediaId', 'type']
    }
  })
  @ApiResponse({status: HttpStatus.OK})
  public async addPostMedia(
      @HttpUser() user: HttpUserPayload,
      @Param('postId') postId: string,
      @Body() body: { mediaId: string; type: 'COVER' | 'GALLERY'; sortOrder?: number }
  ): Promise<CoreApiResponse<void>> {
    const adapter: AddPostMediaAdapter = await AddPostMediaAdapter.new({
      executorId: user.id,
      postId,
      mediaId: body.mediaId,
      type: body.type,
      sortOrder: body.sortOrder,
    });

    await this.addPostMediaUseCase.execute(adapter);

    return CoreApiResponse.success();
  }

  @Delete(':postId/media/:mediaId')
  @HttpAuth(UserRole.AUTHOR)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiResponse({status: HttpStatus.OK})
  public async removePostMedia(
      @HttpUser() user: HttpUserPayload,
      @Param('postId') postId: string,
      @Param('mediaId') mediaId: string
  ): Promise<CoreApiResponse<void>> {
    const adapter: RemovePostMediaAdapter = await RemovePostMediaAdapter.new({
      executorId: user.id,
      postId,
      mediaId,
    });

    await this.removePostMediaUseCase.execute(adapter);

    return CoreApiResponse.success();
  }

  @Put(':postId/media/reorder')
  @HttpAuth(UserRole.AUTHOR)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        mediaOrders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              mediaId: { type: 'string', format: 'uuid' },
              sortOrder: { type: 'number' }
            },
            required: ['mediaId', 'sortOrder']
          }
        }
      },
      required: ['mediaOrders']
    }
  })
  @ApiResponse({status: HttpStatus.OK})
  public async reorderPostMedia(
      @HttpUser() user: HttpUserPayload,
      @Param('postId') postId: string,
      @Body() body: { mediaOrders: Array<{ mediaId: string; sortOrder: number }> }
  ): Promise<CoreApiResponse<void>> {
    const adapter: ReorderPostMediaAdapter = await ReorderPostMediaAdapter.new({
      executorId: user.id,
      postId,
      mediaOrders: body.mediaOrders,
    });

    await this.reorderPostMediaUseCase.execute(adapter);

    return CoreApiResponse.success();
  }

  private setFileStorageBasePath(posts: PostUseCaseDto[]): void {
    const baseUrl = CoreAssert.notEmpty(
        this.configService.get<string>('FILE_STORAGE_BASE_PATH'),
        new Error('Minio: image base path not set')
    );

    posts.forEach((post: PostUseCaseDto) => {
      // Handle backward compatibility image
      if (post.image) {
        post.image.url = new URL(post.image.url, baseUrl).toString();
      }

      // Handle cover image
      if (post.coverImage) {
        post.coverImage.url = new URL(post.coverImage.url, baseUrl).toString();
      }

      // Handle gallery images
      post.galleryImages.forEach(image => {
        image.url = new URL(image.url, baseUrl).toString();
      });

      // Handle media collection
      post.mediaCollection.forEach(media => {
        media.media.url = new URL(media.media.url, baseUrl).toString();
      });
    });
  }
}