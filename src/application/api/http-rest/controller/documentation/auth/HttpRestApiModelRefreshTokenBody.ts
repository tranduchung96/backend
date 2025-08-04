import { ApiProperty } from '@nestjs/swagger';

export class HttpRestApiModelRefreshTokenBody {
  
  @ApiProperty({type: 'string'})
  public refreshToken: string;
  
} 