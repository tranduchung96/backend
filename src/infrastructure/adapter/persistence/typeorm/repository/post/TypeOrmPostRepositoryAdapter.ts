import { PostStatus } from '@core/common/enums/PostEnums';
import { RepositoryFindOptions, RepositoryRemoveOptions, RepositoryUpdateManyOptions } from '@core/common/persistence/RepositoryOptions';
import { Nullable, Optional } from '@core/common/type/CommonTypes';
import { Post } from '@core/domain/post/entity/Post';
import { PostRepositoryPort } from '@core/domain/post/port/persistence/PostRepositoryPort';
import { TypeOrmMedia } from '@infrastructure/adapter/persistence/typeorm/entity/media/TypeOrmMedia';
import { TypeOrmPostMapper } from '@infrastructure/adapter/persistence/typeorm/entity/post/mapper/TypeOrmPostMapper';
import { TypeOrmPost } from '@infrastructure/adapter/persistence/typeorm/entity/post/TypeOrmPost';
import { TypeOrmUser } from '@infrastructure/adapter/persistence/typeorm/entity/user/TypeOrmUser';
import { InsertResult, SelectQueryBuilder, UpdateQueryBuilder, Repository } from 'typeorm';

export class TypeOrmPostRepositoryAdapter implements PostRepositoryPort {
  
  private readonly repository: Repository<TypeOrmPost>;
  private readonly postAlias: string = 'post';
  
  private readonly excludeRemovedPostClause: string = `"${this.postAlias}"."removedAt" IS NULL`;
  
  constructor(repository: Repository<TypeOrmPost>) {
    this.repository = repository;
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
      domainEntity = TypeOrmPostMapper.toDomainEntity(ormEntity);
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
      query.limit(options.offset);
    }
    
    const ormPosts: TypeOrmPost[] = await query.getMany();
    const domainPosts: Post[] = TypeOrmPostMapper.toDomainEntities(ormPosts);
    
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
    
    return {
      id: insertResult.identifiers[0].id
    };
  }
  
  public async updatePost(post: Post): Promise<void>{
    const ormPost: TypeOrmPost = TypeOrmPostMapper.toOrmEntity(post);
    await this.repository.update(ormPost.id, ormPost);
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
      await this.repository.delete(ormPost);
    }
    if (!options.disableSoftDeleting) {
      await this.repository.update(ormPost.id, ormPost);
    }
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
