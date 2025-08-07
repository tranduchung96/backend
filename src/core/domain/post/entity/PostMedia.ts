// src/core/domain/post/entity/PostMedia.ts
import { MediaType } from '@core/common/enums/MediaEnums';
import { Entity } from '@core/common/entity/Entity';
import { CreateEntityPayload } from '@core/common/type/CommonTypes';
import { v4 } from 'uuid';

export enum PostMediaType {
    COVER = 'COVER',
    GALLERY = 'GALLERY'
}

export type CreatePostMediaEntityPayload = CreateEntityPayload<{
    postId: string;
    mediaId: string;
    type: PostMediaType;
    sortOrder: number;
    mediaDetails?: {
        name: string;
        type: MediaType;
        relativePath: string;
        size: number;
        ext: string;
        mimetype: string;
    };
}>;

export class PostMedia extends Entity<string> {

    private readonly postId: string;
    private readonly mediaId: string;
    private readonly type: PostMediaType;
    private readonly sortOrder: number;
    private readonly mediaDetails?: {
        name: string;
        type: MediaType;
        relativePath: string;
        size: number;
        ext: string;
        mimetype: string;
    };

    constructor(payload: CreatePostMediaEntityPayload) {
        super(payload.id || v4(), payload.createdAt);

        this.postId = payload.postId;
        this.mediaId = payload.mediaId;
        this.type = payload.type;
        this.sortOrder = payload.sortOrder;
        this.mediaDetails = payload.mediaDetails;
    }

    public getPostId(): string {
        return this.postId;
    }

    public getMediaId(): string {
        return this.mediaId;
    }

    public getType(): PostMediaType {
        return this.type;
    }

    public getSortOrder(): number {
        return this.sortOrder;
    }

    public getMediaDetails() {
        return this.mediaDetails;
    }

    public isCover(): boolean {
        return this.type === PostMediaType.COVER;
    }

    public isGallery(): boolean {
        return this.type === PostMediaType.GALLERY;
    }

    public static async new(payload: Omit<CreatePostMediaEntityPayload, 'id' | 'createdAt'>): Promise<PostMedia> {
        return new PostMedia({
            ...payload,
            id: v4(),
            createdAt: new Date()
        });
    }
}

// src/core/domain/post/entity/PostMediaCollection.ts
export class PostMediaCollection {
    private readonly items: PostMedia[];

    constructor(items: PostMedia[] = []) {
        this.items = items;
    }

    public getAll(): PostMedia[] {
        return [...this.items];
    }

    public getCover(): PostMedia | null {
        return this.items.find(item => item.isCover()) || null;
    }

    public getGallery(): PostMedia[] {
        return this.items
            .filter(item => item.isGallery())
            .sort((a, b) => a.getSortOrder() - b.getSortOrder());
    }

    public getCount(): number {
        return this.items.length;
    }

    public isEmpty(): boolean {
        return this.items.length === 0;
    }

    public hasCover(): boolean {
        return this.getCover() !== null;
    }

    public getMediaIds(): string[] {
        return this.items.map(item => item.getMediaId());
    }
}