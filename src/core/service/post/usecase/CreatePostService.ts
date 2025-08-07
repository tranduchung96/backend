// src/core/service/post/usecase/CreatePostService.ts (Corrected)
import { QueryBusPort } from '@core/common/port/message/QueryBusPort';
import { CoreAssert } from '@core/common/util/assert/CoreAssert';
import { Post } from '@core/domain/post/entity/Post';
import { PostMedia, PostMediaType } from '@core/domain/post/entity/PostMedia';
import { PostMediaCollection } from '@core/domain/post/entity/PostMediaCollection';
import { PostOwner } from '@core/domain/post/entity/PostOwner';
import { CreatePostPort } from '@core/domain/post/port/usecase/CreatePostPort';
import { PostRepositoryPort } from '@core/domain/post/port/persistence/PostRepositoryPort';
import { CreatePostUseCase } from '@core/domain/post/usecase/CreatePostUseCase';
import { PostUseCaseDto } from '@core/domain/post/usecase/dto/PostUseCaseDto';
import { GetUserPreviewQuery } from '@core/common/message/query/queries/user/GetUserPreviewQuery';
import { GetUserPreviewQueryResult } from '@core/common/message/query/queries/user/result/GetUserPreviewQueryResult';
import { GetMediaPreviewQuery } from '@core/common/message/query/queries/media/GetMediaPreviewQuery';
import { GetMediaPreviewQueryResult } from '@core/common/message/query/queries/media/result/GetMediaPreviewQueryResult';
import { PostImage } from '@core/domain/post/entity/PostImage';

export class CreatePostService implements CreatePostUseCase {

    constructor(
        private readonly postRepository: PostRepositoryPort,
        private readonly queryBus: QueryBusPort,
    ) {}

    public async execute(port: CreatePostPort): Promise<PostUseCaseDto> {
        // Get user info
        const userPreview: GetUserPreviewQueryResult = CoreAssert.notEmpty(
            await this.queryBus.sendQuery(new GetUserPreviewQuery(port.executorId)),
            new Error('User not found.')
        );

        const owner: PostOwner = new PostOwner(userPreview.id, userPreview.name, userPreview.role);

        // Build media collection
        const mediaCollection = await this.buildMediaCollection(port);

        // Handle backward compatibility - if imageId is provided but no coverImageId
        let backwardCompatibilityImageId: string | undefined;
        if (port.imageId && !port.coverImageId) {
            backwardCompatibilityImageId = port.imageId;
        } else if (port.coverImageId) {
            backwardCompatibilityImageId = port.coverImageId;
        }

        const post: Post = await Post.new({
            owner,
            title: port.title,
            content: port.content,
            imageId: backwardCompatibilityImageId,
            mediaCollection,
        });

        const result = await this.postRepository.addPost(post);

        // Update post ID in media collection after post is created
        const updatedMediaCollection = this.updateMediaCollectionPostId(mediaCollection, result.id);
        const updatedPost = new Post({
            owner: post.getOwner(),
            title: post.getTitle(),
            content: post.getContent(),
            image: post.getImage(),
            mediaCollection: updatedMediaCollection,
            id: result.id,
            status: post.getStatus(),
            createdAt: post.getCreatedAt(),
            editedAt: post.getEditedAt(),
            publishedAt: post.getPublishedAt(),
            removedAt: post.getRemovedAt(),
        });

        return this.buildPostUseCaseDto(updatedPost);
    }

    private async buildMediaCollection(port: CreatePostPort): Promise<PostMediaCollection> {
        const postMedias: PostMedia[] = [];

        // Handle cover image (backward compatibility with imageId)
        const coverImageId = port.coverImageId || port.imageId;
        if (coverImageId) {
            const mediaPreview = await this.queryBus.sendQuery(new GetMediaPreviewQuery(coverImageId));
            CoreAssert.notEmpty(mediaPreview, new Error(`Cover image ${coverImageId} not found.`));

            // Validate media type is IMAGE
            CoreAssert.isTrue(
                mediaPreview.type === 'IMAGE',
                new Error('Cover media must be an image.')
            );

            const coverMedia = new PostMedia({
                postId: '', // Will be updated after post creation
                mediaId: coverImageId,
                type: PostMediaType.COVER,
                sortOrder: 0,
                mediaDetails: {
                    name: mediaPreview.name,
                    type: mediaPreview.type,
                    relativePath: mediaPreview.relativePath,
                    size: mediaPreview.size,
                    ext: mediaPreview.ext,
                    mimetype: mediaPreview.mimetype,
                },
                createdAt: new Date(),
            });

            postMedias.push(coverMedia);
        }

        // Handle gallery images
        if (port.galleryImageIds && port.galleryImageIds.length > 0) {
            // Remove duplicates and filter out cover image if it's also in gallery
            const uniqueGalleryIds = [...new Set(port.galleryImageIds)].filter(id => id !== coverImageId);

            for (let i = 0; i < uniqueGalleryIds.length; i++) {
                const mediaId = uniqueGalleryIds[i];
                const mediaPreview = await this.queryBus.sendQuery(new GetMediaPreviewQuery(mediaId));
                CoreAssert.notEmpty(mediaPreview, new Error(`Gallery image ${mediaId} not found.`));

                // Validate media type is IMAGE
                CoreAssert.isTrue(
                    mediaPreview.type === 'IMAGE',
                    new Error(`Gallery media ${mediaId} must be an image.`)
                );

                const galleryMedia = new PostMedia({
                    postId: '', // Will be updated after post creation
                    mediaId,
                    type: PostMediaType.GALLERY,
                    sortOrder: i + 1, // Start from 1 (0 is reserved for cover)
                    mediaDetails: {
                        name: mediaPreview.name,
                        type: mediaPreview.type,
                        relativePath: mediaPreview.relativePath,
                        size: mediaPreview.size,
                        ext: mediaPreview.ext,
                        mimetype: mediaPreview.mimetype,
                    },
                    createdAt: new Date(),
                });

                postMedias.push(galleryMedia);
            }
        }

        return new PostMediaCollection(postMedias);
    }

    private updateMediaCollectionPostId(mediaCollection: PostMediaCollection, postId: string): PostMediaCollection {
        const updatedMedias = mediaCollection.getAll().map(media => {
            return new PostMedia({
                postId: postId,
                mediaId: media.getMediaId(),
                type: media.getType(),
                sortOrder: media.getSortOrder(),
                mediaDetails: media.getMediaDetails(),
                id: media.getId(),
                createdAt: media.getCreatedAt(),
            });
        });

        return new PostMediaCollection(updatedMedias);
    }

    private buildPostUseCaseDto(post: Post): PostUseCaseDto {
        const mediaCollection = post.getMediaCollection();
        const coverImage = post.getCoverImage();
        const galleryImages = post.getGalleryImages();

        return {
            id: post.getId(),
            owner: {
                id: post.getOwner().getId(),
                name: post.getOwner().getName(),
                role: post.getOwner().getRole(),
            },
            title: post.getTitle(),
            content: post.getContent(),
            status: post.getStatus(),

            // Backward compatibility
            image: coverImage ? {
                id: coverImage.getId(),
                url: coverImage.getRelativePath(),
            } : undefined,

            // New fields
            coverImage: coverImage ? {
                id: coverImage.getId(),
                url: coverImage.getRelativePath(),
            } : undefined,

            galleryImages: galleryImages.map(img => ({
                id: img.getId(),
                url: img.getRelativePath(),
            })),

            mediaCollection: mediaCollection.getAll().map(media => ({
                id: media.getId(),
                mediaId: media.getMediaId(),
                type: media.getType(),
                sortOrder: media.getSortOrder(),
                media: {
                    id: media.getMediaId(),
                    name: media.getMediaDetails()?.name || '',
                    url: media.getMediaDetails()?.relativePath || '',
                    type: media.getMediaDetails()?.type || '',
                    size: media.getMediaDetails()?.size || 0,
                    ext: media.getMediaDetails()?.ext || '',
                    mimetype: media.getMediaDetails()?.mimetype || '',
                }
            })),

            createdAt: post.getCreatedAt().getTime(),
            editedAt: post.getEditedAt()?.getTime(),
            publishedAt: post.getPublishedAt()?.getTime(),
        };
    }
}

// src/core/service/post/usecase/EditPostService.ts (Corrected)
import { QueryBusPort } from '@core/common/port/message/QueryBusPort';
import { CoreAssert } from '@core/common/util/assert/CoreAssert';
import { Post } from '@core/domain/post/entity/Post';
import { PostMedia, PostMediaType } from '@core/domain/post/entity/PostMedia';
import { PostMediaCollection } from '@core/domain/post/entity/PostMediaCore';
import { EditPostPort } from '@core/domain/post/port/usecase/EditPostPort';
import { PostRepositoryPort } from '@core/domain/post/port/persistence/PostRepositoryPort';
import { EditPostUseCase } from '@core/domain/post/usecase/EditPostUseCase';
import { PostUseCaseDto } from '@core/domain/post/usecase/dto/PostUseCaseDto';
import { GetMediaPreviewQuery } from '@core/common/message/query/queries/media/GetMediaPreviewQuery';

export class EditPostService implements EditPostUseCase {

    constructor(
        private readonly postRepository: PostRepositoryPort,
        private readonly queryBus: QueryBusPort,
    ) {}

    public async execute(port: EditPostPort): Promise<PostUseCaseDto> {
        const post: Post = CoreAssert.notEmpty(
            await this.postRepository.findPost({id: port.postId}),
            new Error('Post not found.')
        );

        // Check ownership
        CoreAssert.isTrue(
            post.getOwner().getId() === port.executorId,
            new Error('Access denied.')
        );

        // Update basic fields
        if (port.title !== undefined || port.content !== undefined) {
            await post.edit(
                port.title !== undefined ? port.title : post.getTitle(),
                port.content !== undefined ? port.content : post.getContent()
            );
        }

        // Update media collection if media-related fields are provided
        if (this.shouldUpdateMediaCollection(port)) {
            const newMediaCollection = await this.buildMediaCollection(port, post.getId());

            // Create updated post with new media collection
            const updatedPost = new Post({
                owner: post.getOwner(),
                title: post.getTitle(),
                content: post.getContent(),
                image: post.getImage(),
                mediaCollection: newMediaCollection,
                id: post.getId(),
                status: post.getStatus(),
                createdAt: post.getCreatedAt(),
                editedAt: new Date(),
                publishedAt: post.getPublishedAt(),
                removedAt: post.getRemovedAt(),
            });

            await this.postRepository.updatePost(updatedPost);
            return this.buildPostUseCaseDto(updatedPost);
        } else {
            await this.postRepository.updatePost(post);
            return this.buildPostUseCaseDto(post);
        }
    }

    private shouldUpdateMediaCollection(port: EditPostPort): boolean {
        return port.coverImageId !== undefined ||
            port.galleryImageIds !== undefined ||
            port.imageId !== undefined;
    }

    private async buildMediaCollection(port: EditPostPort, postId: string): Promise<PostMediaCollection> {
        const postMedias: PostMedia[] = [];

        // Handle cover image (backward compatibility with imageId)
        const coverImageId = port.coverImageId !== undefined ? port.coverImageId : port.imageId;
        if (coverImageId) {
            const mediaPreview = await this.queryBus.sendQuery(new GetMediaPreviewQuery(coverImageId));
            CoreAssert.notEmpty(mediaPreview, new Error(`Cover image ${coverImageId} not found.`));

            CoreAssert.isTrue(
                mediaPreview.type === 'IMAGE',
                new Error('Cover media must be an image.')
            );

            const coverMedia = new PostMedia({
                postId,
                mediaId: coverImageId,
                type: PostMediaType.COVER,
                sortOrder: 0,
                mediaDetails: {
                    name: mediaPreview.name,
                    type: mediaPreview.type,
                    relativePath: mediaPreview.relativePath,
                    size: mediaPreview.size,
                    ext: mediaPreview.ext,
                    mimetype: mediaPreview.mimetype,
                },
                createdAt: new Date(),
            });

            postMedias.push(coverMedia);
        }

        // Handle gallery images
        if (port.galleryImageIds && port.galleryImageIds.length > 0) {
            const uniqueGalleryIds = [...new Set(port.galleryImageIds)].filter(id => id !== coverImageId);

            for (let i = 0; i < uniqueGalleryIds.length; i++) {
                const mediaId = uniqueGalleryIds[i];
                const mediaPreview = await this.queryBus.sendQuery(new GetMediaPreviewQuery(mediaId));
                CoreAssert.notEmpty(mediaPreview, new Error(`Gallery image ${mediaId} not found.`));

                CoreAssert.isTrue(
                    mediaPreview.type === 'IMAGE',
                    new Error(`Gallery media ${mediaId} must be an image.`)
                );

                const galleryMedia = new PostMedia({
                    postId,
                    mediaId,
                    type: PostMediaType.GALLERY,
                    sortOrder: i + 1,
                    mediaDetails: {
                        name: mediaPreview.name,
                        type: mediaPreview.type,
                        relativePath: mediaPreview.relativePath,
                        size: mediaPreview.size,
                        ext: mediaPreview.ext,
                        mimetype: mediaPreview.mimetype,
                    },
                    createdAt: new Date(),
                });

                postMedias.push(galleryMedia);
            }
        }

        return new PostMediaCollection(postMedias);
    }

    private buildPostUseCaseDto(post: Post): PostUseCaseDto {
        const mediaCollection = post.getMediaCollection();
        const coverImage = post.getCoverImage();
        const galleryImages = post.getGalleryImages();

        return {
            id: post.getId(),
            owner: {
                id: post.getOwner().getId(),
                name: post.getOwner().getName(),
                role: post.getOwner().getRole(),
            },
            title: post.getTitle(),
            content: post.getContent(),
            status: post.getStatus(),

            // Backward compatibility
            image: coverImage ? {
                id: coverImage.getId(),
                url: coverImage.getRelativePath(),
            } : undefined,

            // New fields
            coverImage: coverImage ? {
                id: coverImage.getId(),
                url: coverImage.getRelativePath(),
            } : undefined,

            galleryImages: galleryImages.map(img => ({
                id: img.getId(),
                url: img.getRelativePath(),
            })),

            mediaCollection: mediaCollection.getAll().map(media => ({
                id: media.getId(),
                mediaId: media.getMediaId(),
                type: media.getType(),
                sortOrder: media.getSortOrder(),
                media: {
                    id: media.getMediaId(),
                    name: media.getMediaDetails()?.name || '',
                    url: media.getMediaDetails()?.relativePath || '',
                    type: media.getMediaDetails()?.type || '',
                    size: media.getMediaDetails()?.size || 0,
                    ext: media.getMediaDetails()?.ext || '',
                    mimetype: media.getMediaDetails()?.mimetype || '',
                }
            })),

            createdAt: post.getCreatedAt().getTime(),
            editedAt: post.getEditedAt()?.getTime(),
            publishedAt: post.getPublishedAt()?.getTime(),
        };
    }
}