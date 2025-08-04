import { UseCase } from '@core/common/usecase/UseCase';
import { GetUserPort } from '@core/domain/user/port/usecase/GetUserPort';
import { UserUseCaseDto } from '@core/domain/user/usecase/dto/UserUseCaseDto';

export type GetUserUseCase = UseCase<GetUserPort, UserUseCaseDto>
