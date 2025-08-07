export interface AddPostMediaPort {
    executorId: string;
    postId: string;
    mediaId: string;
    type: 'COVER' | 'GALLERY';
    sortOrder?: number;
}

export interface RemovePostMediaPort {
    executorId: string;
    postId: string;
    mediaId: string;
}

export interface ReorderPostMediaPort {
    executorId: string;
    postId: string;
    mediaOrders: Array<{
        mediaId: string;
        sortOrder: number;
    }>;
}