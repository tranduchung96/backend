import { ApiProperty } from '@nestjs/swagger';

export class HttpRestApiResponse<T> {
  
  @ApiProperty({type: 'number'})
  public code: number;
  
  @ApiProperty({ type: 'string' })
  public message: string;
  
  @ApiProperty({ description: 'timestamp in ms', type: 'number' })
  public timestamp: number;
  

  public data: T;

}
