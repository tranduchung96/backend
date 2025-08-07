// src/infrastructure/adapter/persistence/typeorm/entity/post-media/mapper/TypeOrmPostMediaMapper.ts
import { PostMedia, PostMediaType } from '@core/domain/post/entity/PostMedia';
import { TypeOrmPostMedia } from '@infrastructure/adapter/persistence/typeorm/entity/post-media/TypeOrmPostMedia';

export class TypeOrmPostMediaMapper {

    public static toOrmEntity(domainPostMedia: PostMedia): TypeOrmPostMedia {
        const ormPostMedia: TypeOrmPostMedia = new TypeOrmPostMedia();

        ormPostMedia.id = domainPostMedia.getId();
        ormPostMedia.postId = domainPostMedia.getPostId();
        ormPostMedia.mediaId = domainPostMedia.getMediaId();
        ormPostMedia.type = domainPostMedia.getType();
        ormPostMedia.sortOrder = domainPostMedia.getSortOrder();
        ormPostMedia.createdAt = domainPostMedia.getCreatedAt();

        return ormPostMedia;
    }

    public static toOrmEntities(domainPostMedias: PostMedia[]): TypeOrmPostMedia[] {
        return domainPostMedias.map(domainPostMedia => this.toOrmEntity(domainPostMedia));
    }

    public static toDomainEntity(ormPostMedia: TypeOrmPostMedia): PostMedia {
        const mediaDetails = ormPostMedia.media ? {
            name: ormPostMedia.media.name,
            type: ormPostMedia.media.type,
            relativePath: ormPostMedia.media.relativePath,
            size: ormPostMedia.media.size,
            ext: ormPostMedia.media.ext,
            mimetype: ormPostMedia.media.mimetype,
        } : undefined;

        const domainPostMedia: PostMedia = new PostMedia({
            postId: ormPostMedia.postId,
            mediaId: ormPostMedia.mediaId,
            type: ormPostMedia.type,
            sortOrder: ormPostMedia.sortOrder,
            mediaDetails,
            id: ormPostMedia.id,
            createdAt: ormPostMedia.createdAt,
        });

        return domainPostMedia;
    }

    public static toDomainEntities(ormPostMedias: TypeOrmPostMedia[]): PostMedia[] {
        return ormPostMedias.map(ormPostMedia => this.toDomainEntity(ormPostMedia));
    }
}