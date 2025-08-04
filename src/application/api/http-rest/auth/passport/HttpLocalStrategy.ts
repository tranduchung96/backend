import {HttpAuthService} from '@application/api/http-rest/auth/HttpAuthService';
import {HttpUserPayload} from '@application/api/http-rest/auth/type/HttpAuthTypes';
import {Code} from '@core/common/code/Code';
import {Exception} from '@core/common/exception/Exception';
import {CoreAssert} from '@core/common/util/assert/CoreAssert';
import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {Strategy} from 'passport-local';
import {ConfigService} from '@nestjs/config';

@Injectable()
export class HttpLocalStrategy extends PassportStrategy(Strategy) {
  
  constructor(
      private configService: ConfigService,
      private authService: HttpAuthService
  ) {
    const LOGIN_USERNAME_FIELD = configService.get<string>('API_LOGIN_USERNAME_FIELD');
    if(!LOGIN_USERNAME_FIELD){
      throw Exception.new({code: Code.INTERNAL_ERROR, overrideMessage: 'API_LOGIN_USERNAME_FIELD is not defined'});
    }
    const LOGIN_PASSWORD_FIELD = configService.get<string>('API_LOGIN_PASSWORD_FIELD');
    if(!LOGIN_PASSWORD_FIELD){
      throw Exception.new({code: Code.INTERNAL_ERROR, overrideMessage: 'API_LOGIN_PASSWORD_FIELD is not defined'});
    }
    super({
      usernameField: LOGIN_USERNAME_FIELD,
      passwordField: LOGIN_PASSWORD_FIELD,
    });
  }
  
  public async validate(username: string, password: string): Promise<HttpUserPayload> {
    return CoreAssert.notEmpty(
      await this.authService.validateUser(username, password),
      Exception.new({code: Code.WRONG_CREDENTIALS_ERROR})
    );
  }

}
