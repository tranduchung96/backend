import { UseCase } from '@core/common/usecase/UseCase';
import { CreateUserPort } from '@core/domain/user/port/usecase/CreateUserPort';
import { UserUseCaseDto } from '@core/domain/user/usecase/dto/UserUseCaseDto';

export type CreateUserUseCase = UseCase<CreateUserPort, UserUseCaseDto>
