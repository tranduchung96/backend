import { TransactionalUseCase } from '@core/common/usecase/TransactionalUseCase';
import { RemoveMediaPort } from '@core/domain/media/port/usecase/RemoveMediaPort';

export type RemoveMediaUseCase = TransactionalUseCase<RemoveMediaPort, void>
