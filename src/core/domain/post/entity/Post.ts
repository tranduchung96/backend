// src/core/domain/post/entity/Post.ts (Updated)
import { PostStatus } from '@core/common/enums/PostEnums';
import { Entity } from '@core/common/entity/Entity';
import { Nullable, Optional } from '@core/common/type/CommonTypes';
import { PostImage } from '@core/domain/post/entity/PostImage';
import { PostOwner } from '@core/domain/post/entity/PostOwner';
import { PostMediaCollection } from '@core/domain/post/entity/PostMediaCollection';
import { v4 } from 'uuid';

export type CreatePostEntityPayload = {
  owner: PostOwner;
  title: string;
  content?: string;
  image?: Nullable<PostImage>; // Keep for backward compatibility
  mediaCollection?: PostMediaCollection;
  id?: string;
  status?: PostStatus;
  createdAt?: Date;
  editedAt?: Nullable<Date>;
  publishedAt?: Nullable<Date>;
  removedAt?: Nullable<Date>;
};

export class Post extends Entity<string> {

  private owner: PostOwner;
  private title: string;
  private content: Nullable<string>;
  private image: Nullable<PostImage>; // Keep for backward compatibility
  private mediaCollection: PostMediaCollection;
  private status: PostStatus;
  private editedAt: Nullable<Date>;
  private publishedAt: Nullable<Date>;
  private removedAt: Nullable<Date>;

  constructor(payload: CreatePostEntityPayload) {
    super(payload.id || v4(), payload.createdAt);

    this.owner = payload.owner;
    this.title = payload.title;
    this.content = payload.content || null;
    this.image = payload.image || null;
    this.mediaCollection = payload.mediaCollection || new PostMediaCollection();
    this.status = payload.status || PostStatus.DRAFT;
    this.editedAt = payload.editedAt || null;
    this.publishedAt = payload.publishedAt || null;
    this.removedAt = payload.removedAt || null;
  }

  public getOwner(): PostOwner {
    return this.owner;
  }

  public getTitle(): string {
    return this.title;
  }

  public getContent(): Nullable<string> {
    return this.content;
  }

  // Keep for backward compatibility
  public getImage(): Nullable<PostImage> {
    // If we have media collection, try to get cover image from there
    const coverMedia = this.mediaCollection.getCover();
    if (coverMedia && coverMedia.getMediaDetails()) {
      const details = coverMedia.getMediaDetails()!;
      return new PostImage(coverMedia.getMediaId(), details.relativePath);
    }
    return this.image;
  }

  public getMediaCollection(): PostMediaCollection {
    return this.mediaCollection;
  }

  public getCoverImage(): PostImage | null {
    const coverMedia = this.mediaCollection.getCover();
    if (coverMedia && coverMedia.getMediaDetails()) {
      const details = coverMedia.getMediaDetails()!;
      return new PostImage(coverMedia.getMediaId(), details.relativePath);
    }
    return null;
  }

  public getGalleryImages(): PostImage[] {
    return this.mediaCollection.getGallery()
        .filter(media => media.getMediaDetails())
        .map(media => {
          const details = media.getMediaDetails()!;
          return new PostImage(media.getMediaId(), details.relativePath);
        });
  }

  public getStatus(): PostStatus {
    return this.status;
  }

  public getEditedAt(): Nullable<Date> {
    return this.editedAt;
  }

  public getPublishedAt(): Nullable<Date> {
    return this.publishedAt;
  }

  public getRemovedAt(): Nullable<Date> {
    return this.removedAt;
  }

  public async edit(title: string, content?: string): Promise<void> {
    this.title = title;
    this.content = content || null;
    this.editedAt = new Date();
  }

  public async publish(): Promise<void> {
    this.status = PostStatus.PUBLISHED;
    this.publishedAt = new Date();
    this.editedAt = new Date();
  }

  public async remove(): Promise<void> {
    this.removedAt = new Date();
  }

  public static async new(payload: {
    owner: PostOwner;
    title: string;
    content?: string;
    imageId?: string; // Keep for backward compatibility
    mediaCollection?: PostMediaCollection;
  }): Promise<Post> {
    // Handle backward compatibility
    let image: Nullable<PostImage> = null;
    if (payload.imageId) {
      image = new PostImage(payload.imageId, ''); // relativePath will be set by repository
    }

    return new Post({
      owner: payload.owner,
      title: payload.title,
      content: payload.content,
      image,
      mediaCollection: payload.mediaCollection || new PostMediaCollection(),
      status: PostStatus.DRAFT,
      createdAt: new Date(),
    });
  }
}