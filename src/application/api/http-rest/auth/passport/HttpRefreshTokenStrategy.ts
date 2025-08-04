import { HttpAuthService } from '@application/api/http-rest/auth/HttpAuthService';
import { HttpRefreshTokenPayload, HttpUserPayload } from '@application/api/http-rest/auth/type/HttpAuthTypes';
import { Code } from '@core/common/code/Code';
import { Exception } from '@core/common/exception/Exception';
import { CoreAssert } from '@core/common/util/assert/CoreAssert';
import { User } from '@core/domain/user/entity/User';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {ConfigService} from '@nestjs/config';

@Injectable()
export class HttpRefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  
  constructor(
      private configService: ConfigService,
      private authService: HttpAuthService
  ) {
     
    const REFRESH_TOKEN = configService.get<string>('API_REFRESH_TOKEN_SECRET');
    if(!REFRESH_TOKEN){
      throw Exception.new({code: Code.INTERNAL_ERROR, overrideMessage: 'API_REFRESH_TOKEN_SECRET is not defined'});
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,

      secretOrKey: REFRESH_TOKEN,
    });
  }
  
  public async validate(payload: HttpRefreshTokenPayload): Promise<HttpUserPayload> {
    if (payload.type !== 'refresh') {
      throw Exception.new({code: Code.UNAUTHORIZED_ERROR});
    }
    console.log('HttpRefreshTokenStrategy.validate', payload);
    const user: User = CoreAssert.notEmpty(
      await this.authService.getUser({id: payload.id}),
      Exception.new({code: Code.UNAUTHORIZED_ERROR})
    );
  
    return {id: user.getId(), email: user.getEmail(), role: user.getRole()};
  }
  
} 