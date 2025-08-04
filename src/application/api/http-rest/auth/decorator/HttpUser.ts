import { HttpRequestWithUser } from '@application/api/http-rest/auth/type/HttpAuthTypes';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

 
export const HttpUser: () => any = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request: HttpRequestWithUser = ctx.switchToHttp().getRequest();
  return request.user;
});

