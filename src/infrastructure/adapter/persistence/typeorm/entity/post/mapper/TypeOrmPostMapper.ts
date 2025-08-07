// src/infrastructure/adapter/persistence/typeorm/entity/post/mapper/TypeOrmPostMapper.ts (Updated)
import { PostStatus } from '@core/common/enums/PostEnums';
import { Nullable } from '@core/common/type/CommonTypes';
import { Post } from '@core/domain/post/entity/Post';
import { PostImage } from '@core/domain/post/entity/PostImage';
import { PostOwner } from '@core/domain/post/entity/PostOwner';
import { PostMedia } from '@core/domain/post/entity/PostMedia';
import { PostMediaCollection } from '@core/domain/post/entity/PostMediaCollection';
import { TypeOrmPost } from '@infrastructure/adapter/persistence/typeorm/entity/post/TypeOrmPost';

export class TypeOrmPostMapper {

  public static toOrmEntity(domainPost: Post): TypeOrmPost {
    const ormPost: TypeOrmPost = new TypeOrmPost();
    const image: Nullable<PostImage> = domainPost.getImage();

    ormPost.id          = domainPost.getId();
    ormPost.ownerId     = domainPost.getOwner().getId();
    ormPost.title       = domainPost.getTitle();

    // Keep backward compatibility
    ormPost.imageId     = image ? image.getId() : null!;
    ormPost.content     = domainPost.getContent() as string;
    ormPost.status      = domainPost.getStatus() as PostStatus;

    ormPost.createdAt   = domainPost.getCreatedAt();
    ormPost.editedAt    = domainPost.getEditedAt() as Date;
    ormPost.publishedAt = domainPost.getPublishedAt() as Date;
    ormPost.removedAt   = domainPost.getRemovedAt() as Date;

    return ormPost;
  }

  public static toOrmEntities(domainPosts: Post[]): TypeOrmPost[] {
    return domainPosts.map(domainPost => this.toOrmEntity(domainPost));
  }

  public static toDomainEntity(ormPost: TypeOrmPost, postMedias: PostMedia[] = []): Post {
    const mediaCollection = new PostMediaCollection(postMedias);

    const domainPost: Post = new Post({
      owner      : new PostOwner(ormPost.owner.id, `${ormPost.owner.firstName} ${ormPost.owner.lastName}`, ormPost.owner.role),
      title      : ormPost.title,
      image      : ormPost.image ? new PostImage(ormPost.image.id, ormPost.image.relativePath) : null,
      content    : ormPost.content,
      mediaCollection: mediaCollection,
      id         : ormPost.id,
      status     : ormPost.status,
      createdAt  : ormPost.createdAt,
      editedAt   : ormPost.editedAt,
      publishedAt: ormPost.publishedAt,
      removedAt  : ormPost.removedAt,
    });

    return domainPost;
  }

  public static toDomainEntities(ormPosts: TypeOrmPost[], postMediasMap?: Map<string, PostMedia[]>): Post[] {
    return ormPosts.map(ormPost => {
      const postMedias = postMediasMap?.get(ormPost.id) || [];
      return this.toDomainEntity(ormPost, postMedias);
    });
  }
}