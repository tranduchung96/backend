export interface EditPostPort {
  executorId: string;
  postId: string;
  title?: string;
  content?: string;

  // Backward compatibility
  imageId?: string;

  // New fields
  coverImageId?: string;
  galleryImageIds?: string[];
}