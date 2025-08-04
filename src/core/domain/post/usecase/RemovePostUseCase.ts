import { TransactionalUseCase } from '@core/common/usecase/TransactionalUseCase';
import { RemovePostPort } from '@core/domain/post/port/usecase/RemovePostPort';

export type RemovePostUseCase = TransactionalUseCase<RemovePostPort, void>
