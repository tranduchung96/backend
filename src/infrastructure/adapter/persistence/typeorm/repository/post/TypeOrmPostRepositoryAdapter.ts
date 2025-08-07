// src/infrastructure/adapter/persistence/typeorm/repository/post/TypeOrmPostRepositoryAdapter.ts (Updated)
import { PostStatus } from '@core/common/enums/PostEnums';
import { RepositoryFindOptions, RepositoryRemoveOptions, RepositoryUpdateManyOptions } from '@core/common/persistence/RepositoryOptions';
import { Nullable, Optional } from '@core/common/type/CommonTypes';
import { Post } from '@core/domain/post/entity/Post';
import { PostMedia } from '@core/domain/post/entity/PostMedia';
import { PostMediaCollection } from '@core/domain/post/entity/PostMediaCollection';
import { PostRepositoryPort } from '@core/domain/post/port/persistence/PostRepositoryPort';
import { TypeOrmMedia } from '@infrastructure/adapter/persistence/typeorm/entity/media/TypeOrmMedia';
import { TypeOrmPostMapper } from '@infrastructure/adapter/persistence/typeorm/entity/post/mapper/TypeOrmPostMapper';
import { TypeOrmPost } from '@infrastructure/adapter/persistence/typeorm/entity/post/TypeOrmPost';
import { TypeOrmPostMedia } from '@infrastructure/adapter/persistence/typeorm/entity/post-media/TypeOrmPostMedia';
import { TypeOrmPostMediaMapper } from '@infrastructure/adapter/persistence/typeorm/entity/post-media/mapper/TypeOrmPostMediaMapper';
import { TypeOrmUser } from '@infrastructure/adapter/persistence/typeorm/entity/user/TypeOrmUser';
import { InsertResult, SelectQueryBuilder, UpdateQueryBuilder, Repository, DataSource } from 'typeorm';

export class TypeOrmPostRepositoryAdapter implements PostRepositoryPort {

  private readonly repository: Repository<TypeOrmPost>;
  private readonly postMediaRepository: Repository<TypeOrmPostMedia>;
  private readonly postAlias: string = 'post';

  private readonly excludeRemovedPostClause: string = `"${this.postAlias}"."removedAt" IS NULL`;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmPost);
    this.postMediaRepository = dataSource.getRepository(TypeOrmPostMedia);
  }

  public async findPost(by: {id?: string}, options: RepositoryFindOptions = {}): Promise<Optional<Post>> {
    let domainEntity: Optional<Post>;

    const query: SelectQueryBuilder<TypeOrmPost> = this.buildPostQueryBuilder();

    this.extendQueryWithByProperties(by, query);

    if (!options.includeRemoved) {
      query.andWhere(this.excludeRemovedPostClause);
    }

    const ormEntity: TypeOrmPost | null = await query.getOne();

    if (ormEntity) {
      // Load post media
      const postMedias = await this.findPostMedias(ormEntity.id);
      domainEntity = TypeOrmPostMapper.toDomainEntity(ormEntity, postMedias);
    }

    return domainEntity;
  }

  public async findPosts(by: {ownerId?: string, status?: PostStatus}, options: RepositoryFindOptions = {}): Promise<Post[]> {
    const query: SelectQueryBuilder<TypeOrmPost> = this.buildPostQueryBuilder();

    this.extendQueryWithByProperties(by, query);

    if (!options.includeRemoved) {
      query.andWhere(this.excludeRemovedPostClause);
    }
    if (options.limit) {
      query.limit(options.limit);
    }
    if (options.offset) {
      query.offset(options.offset);
    }

    const ormPosts: TypeOrmPost[] = await query.getMany();

    // Load post medias for all posts
    const postIds = ormPosts.map(post => post.id);
    const allPostMedias = await this.findPostMediasByPostIds(postIds);

    // Group post medias by post ID
    const postMediasMap = new Map<string, PostMedia[]>();
    allPostMedias.forEach(postMedia => {
      const postId = postMedia.getPostId();
      if (!postMediasMap.has(postId)) {
        postMediasMap.set(postId, []);
      }
      postMediasMap.get(postId)!.push(postMedia);
    });

    const domainPosts: Post[] = ormPosts.map(ormPost => {
      const postMedias = postMediasMap.get(ormPost.id) || [];
      return TypeOrmPostMapper.toDomainEntity(ormPost, postMedias);
    });

    return domainPosts;
  }

  public async addPost(post: Post): Promise<{id: string}> {
    const ormPost: TypeOrmPost = TypeOrmPostMapper.toOrmEntity(post);

    const insertResult: InsertResult = await this.repository
        .createQueryBuilder(this.postAlias)
        .insert()
        .into(TypeOrmPost)
        .values([ormPost])
        .execute();

    const postId = insertResult.identifiers[0].id;

    // Insert post medias
    const mediaCollection = post.getMediaCollection();
    if (!mediaCollection.isEmpty()) {
      const postMedias = mediaCollection.getAll();
      const ormPostMedias = postMedias.map((postMedia: PostMedia) => {
        const ormPostMedia = TypeOrmPostMediaMapper.toOrmEntity(postMedia);
        ormPostMedia.postId = postId; // Ensure correct post ID
        return ormPostMedia;
      });

      if (ormPostMedias.length > 0) {
        await this.postMediaRepository
            .createQueryBuilder()
            .insert()
            .into(TypeOrmPostMedia)
            .values(ormPostMedias)
            .execute();
      }
    }

    return { id: postId };
  }

  public async updatePost(post: Post): Promise<void> {
    const ormPost: TypeOrmPost = TypeOrmPostMapper.toOrmEntity(post);
    await this.repository.update(ormPost.id, ormPost);

    // Update post medias - for now, we'll replace all medias
    // In production, you might want to implement more sophisticated logic
    await this.postMediaRepository.delete({ postId: post.getId() });

    const mediaCollection = post.getMediaCollection();
    if (!mediaCollection.isEmpty()) {
      const postMedias = mediaCollection.getAll();
      const ormPostMedias = postMedias.map((postMedia: PostMedia) => {
        const ormPostMedia = TypeOrmPostMediaMapper.toOrmEntity(postMedia);
        ormPostMedia.postId = post.getId();
        return ormPostMedia;
      });

      if (ormPostMedias.length > 0) {
        await this.postMediaRepository
            .createQueryBuilder()
            .insert()
            .into(TypeOrmPostMedia)
            .values(ormPostMedias)
            .execute();
      }
    }
  }

  public async updatePosts(values: {imageId?: Nullable<string>}, by: {imageId?: string}, options: RepositoryUpdateManyOptions = {}): Promise<void> {
    type ValuesType = {imageId?: string};

    const query: UpdateQueryBuilder<TypeOrmPost> = this.repository
        .createQueryBuilder(this.postAlias)
        .update(TypeOrmPost)
        .set(values as ValuesType)
        .where(by);

    if (!options.includeRemoved) {
      query.andWhere(this.excludeRemovedPostClause);
    }

    await query.execute();
  }

  public async removePost(post: Post, options: RepositoryRemoveOptions = {}): Promise<void> {
    await post.remove();
    const ormPost: TypeOrmPost = TypeOrmPostMapper.toOrmEntity(post);

    if (options.disableSoftDeleting) {
      // Hard delete - cascading will handle post_media
      await this.repository.delete(ormPost.id);
    } else {
      // Soft delete
      await this.repository.update(ormPost.id, ormPost);
    }
  }

  // Add new methods for post media management
  public async addPostMedia(postMedia: PostMedia): Promise<void> {
    const ormPostMedia = TypeOrmPostMediaMapper.toOrmEntity(postMedia);
    await this.postMediaRepository.save(ormPostMedia);
  }

  public async removePostMedia(postId: string, mediaId: string): Promise<void> {
    await this.postMediaRepository.delete({ postId, mediaId });
  }

  public async updatePostMediaOrder(postId: string, mediaOrders: { mediaId: string; sortOrder: number }[]): Promise<void> {
    for (const order of mediaOrders) {
      await this.postMediaRepository.update(
          { postId, mediaId: order.mediaId },
          { sortOrder: order.sortOrder }
      );
    }
  }

  private async findPostMedias(postId: string): Promise<PostMedia[]> {
    const ormPostMedias = await this.postMediaRepository
        .createQueryBuilder('pm')
        .leftJoinAndMapOne('pm.media', TypeOrmMedia, 'media', 'pm.mediaId = media.id')
        .where('pm.postId = :postId', { postId })
        .orderBy('pm.sortOrder', 'ASC')
        .getMany();

    return TypeOrmPostMediaMapper.toDomainEntities(ormPostMedias);
  }

  private async findPostMediasByPostIds(postIds: string[]): Promise<PostMedia[]> {
    if (postIds.length === 0) return [];

    const ormPostMedias = await this.postMediaRepository
        .createQueryBuilder('pm')
        .leftJoinAndMapOne('pm.media', TypeOrmMedia, 'media', 'pm.mediaId = media.id')
        .where('pm.postId IN (:...postIds)', { postIds })
        .orderBy('pm.postId', 'ASC')
        .addOrderBy('pm.sortOrder', 'ASC')
        .getMany();

    return TypeOrmPostMediaMapper.toDomainEntities(ormPostMedias);
  }

  private buildPostQueryBuilder(): SelectQueryBuilder<TypeOrmPost> {
    return this.repository
        .createQueryBuilder(this.postAlias)
        .select()
        .leftJoinAndMapOne(
            `${this.postAlias}.owner`,
            TypeOrmUser,
            'owner',
            `${this.postAlias}."ownerId" = owner.id`
        )
        .leftJoinAndMapOne(
            `${this.postAlias}.image`,
            TypeOrmMedia,
            'image',
            `${this.postAlias}."imageId" = image.id`
        );
  }

  private extendQueryWithByProperties(by: {id?: string, ownerId?: string, status?: PostStatus}, query: SelectQueryBuilder<TypeOrmPost>): void {
    if (by.id) {
      query.andWhere(`"${this.postAlias}"."id" = :id`, {id: by.id});
    }
    if (by.ownerId) {
      query.andWhere(`"${this.postAlias}"."ownerId" = :ownerId`, {ownerId: by.ownerId});
    }
    if (by.status) {
      query.andWhere(`"${this.postAlias}"."status" = :status`, {status: by.status});
    }
  }
}