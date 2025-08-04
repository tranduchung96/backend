import { UserRole } from '@core/common/enums/UserEnums';
import { SetMetadata } from '@nestjs/common';

 
export const HttpRoles = (...roles: UserRole[]) => SetMetadata('roles', roles);

