import { HttpRestApiModelRefreshTokenResponse } from '@application/api/http-rest/controller/documentation/auth/HttpRestApiModelRefreshTokenResponse';
import { HttpRestApiResponse } from '@application/api/http-rest/controller/documentation/common/HttpRestApiResponse';
import { ApiProperty } from '@nestjs/swagger';

export class HttpRestApiResponseRefreshToken extends HttpRestApiResponse<HttpRestApiModelRefreshTokenResponse> {
  
  @ApiProperty({type: HttpRestApiModelRefreshTokenResponse})
  public data: HttpRestApiModelRefreshTokenResponse;
  
} 