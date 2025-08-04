import { HttpLocalAuthGuard } from '@application/api/http-rest/auth/guard/HttpLocalAuthGuard';
import { HttpAuthService } from '@application/api/http-rest/auth/HttpAuthService';
import { HttpLoggedInUser, HttpRequestWithUser } from '@application/api/http-rest/auth/type/HttpAuthTypes';
import { HttpRestApiModelLogInBody } from '@application/api/http-rest/controller/documentation/auth/HttpRestApiModelLogInBody';
import { HttpRestApiModelRefreshTokenBody } from '@application/api/http-rest/controller/documentation/auth/HttpRestApiModelRefreshTokenBody';
import { HttpRestApiResponseLoggedInUser } from '@application/api/http-rest/controller/documentation/auth/HttpRestApiResponseLoggedInUser';
import { HttpRestApiResponseRefreshToken } from '@application/api/http-rest/controller/documentation/auth/HttpRestApiResponseRefreshToken';
import { CoreApiResponse } from '@core/common/api/CoreApiResponse';
import { Body, Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  
  constructor(private readonly authService: HttpAuthService) {}
  
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(HttpLocalAuthGuard)
  @ApiBody({type: HttpRestApiModelLogInBody})
  @ApiResponse({status: HttpStatus.OK, type: HttpRestApiResponseLoggedInUser})
  public async login(@Req() request: HttpRequestWithUser): Promise<CoreApiResponse<HttpLoggedInUser>> {
    return CoreApiResponse.success(this.authService.login(request.user));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBody({type: HttpRestApiModelRefreshTokenBody})
  @ApiResponse({status: HttpStatus.OK, type: HttpRestApiResponseRefreshToken})
  public async refresh(@Body() body: { refreshToken: string }): Promise<CoreApiResponse<{ accessToken: string }>> {
    return CoreApiResponse.success(this.authService.refreshAccessToken(body.refreshToken));
  }
  
  
}

