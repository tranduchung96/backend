// src/core/domain/post/di/PostDITokens.ts (Updated)
export class PostDITokens {

  // Repository
  public static readonly PostRepository: unique symbol = Symbol('PostRepository');

  // Use Cases
  public static readonly CreatePostUseCase: unique symbol = Symbol('CreatePostUseCase');
  public static readonly EditPostUseCase: unique symbol = Symbol('EditPostUseCase');
  public static readonly GetPostListUseCase: unique symbol = Symbol('GetPostListUseCase');
  public static readonly GetPostUseCase: unique symbol = Symbol('GetPostUseCase');
  public static readonly PublishPostUseCase: unique symbol = Symbol('PublishPostUseCase');
  public static readonly RemovePostUseCase: unique symbol = Symbol('RemovePostUseCase');

  // New Media Management Use Cases
  public static readonly AddPostMediaUseCase: unique symbol = Symbol('AddPostMediaUseCase');
  public static readonly RemovePostMediaUseCase: unique symbol = Symbol('RemovePostMediaUseCase');
  public static readonly ReorderPostMediaUseCase: unique symbol = Symbol('ReorderPostMediaUseCase');

  // Event Handlers
  public static readonly PostImageRemovedEventHandler: unique symbol = Symbol('PostImageRemovedEventHandler');

}