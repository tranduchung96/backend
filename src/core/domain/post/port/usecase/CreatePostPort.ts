export interface CreatePostPort {
  executorId: string;
  title: string;
  content?: string;

  // Backward compatibility
  imageId?: string;

  // New fields
  coverImageId?: string;
  galleryImageIds?: string[];
}