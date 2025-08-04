import { ApiProperty } from '@nestjs/swagger';

export class HttpRestApiModelRefreshTokenResponse {
  
  @ApiProperty({type: 'string'})
  public accessToken: string;
  
} 