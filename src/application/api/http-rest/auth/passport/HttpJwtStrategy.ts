import { HttpAuthService } from '@application/api/http-rest/auth/HttpAuthService';
import { HttpJwtPayload, HttpUserPayload } from '@application/api/http-rest/auth/type/HttpAuthTypes';
import { Code } from '@core/common/code/Code';
import { Exception } from '@core/common/exception/Exception';
import { CoreAssert } from '@core/common/util/assert/CoreAssert';
import { User } from '@core/domain/user/entity/User';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {ConfigService} from '@nestjs/config';

@Injectable()
export class HttpJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  
  constructor(
      private configService: ConfigService,
      private authService: HttpAuthService
  ) {
    const ACCESS_TOKEN_SECRET = configService.get<string>('API_ACCESS_TOKEN_SECRET');
    if(!ACCESS_TOKEN_SECRET){
      throw Exception.new({code: Code.INTERNAL_ERROR, overrideMessage: 'ACCESS_TOKEN_SECRET is not defined'});
    }
    const ACCESS_TOKEN_IGNORE_EXPIRATION = configService.get<string>('API_ACCESS_TOKEN_IGNORE_EXPIRATION');
    if(!ACCESS_TOKEN_IGNORE_EXPIRATION){
      throw Exception.new({code: Code.INTERNAL_ERROR, overrideMessage: 'ACCESS_TOKEN_IGNORE_EXPIRATION is not defined'});
    }
    console.log(`Using ACCESS_TOKEN_SECRET: ${ACCESS_TOKEN_SECRET}`);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: ACCESS_TOKEN_IGNORE_EXPIRATION === 'true',
      secretOrKey: ACCESS_TOKEN_SECRET,
    });
  }
  
  public async validate(payload: HttpJwtPayload): Promise<HttpUserPayload> {
    const user: User = CoreAssert.notEmpty(
      await this.authService.getUser({id: payload.id}),
      Exception.new({code: Code.UNAUTHORIZED_ERROR})
    );
  
    return {id: user.getId(), email: user.getEmail(), role: user.getRole()};
  }
  
}
