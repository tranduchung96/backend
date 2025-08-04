import { HttpJwtPayload, HttpLoggedInUser, HttpRefreshTokenPayload, HttpUserPayload } from '@application/api/http-rest/auth/type/HttpAuthTypes';
import { Code } from '@core/common/code/Code';
import { Exception } from '@core/common/exception/Exception';
import { Nullable, Optional } from '@core/common/type/CommonTypes';
import { UserDITokens } from '@core/domain/user/di/UserDITokens';
import { User } from '@core/domain/user/entity/User';
import { UserRepositoryPort } from '@core/domain/user/port/persistence/UserRepositoryPort';
import {Inject, Injectable, Logger} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {ConfigService} from '@nestjs/config';

@Injectable()
export class HttpAuthService {
  private readonly logger = new Logger(HttpAuthService.name);
  constructor(
      private configService: ConfigService,
    @Inject(UserDITokens.UserRepository)
    private readonly userRepository: UserRepositoryPort,
    
    private readonly jwtService: JwtService
  ) {}
  
  public async validateUser(username: string, password: string): Promise<Nullable<HttpUserPayload>> {
    const user: Optional<User> = await this.userRepository.findUser({email: username});
    console.log(user)
    if (user) {
      const isPasswordValid: boolean = await user.comparePassword(password);
      if (isPasswordValid) {
        return {id: user.getId(), email: user.getEmail(), role: user.getRole()};
      }
    }
    
    return null;
  }
  
  public login(user: HttpUserPayload): HttpLoggedInUser {
    const accessPayload: HttpJwtPayload = { id: user.id };
    const refreshPayload: HttpRefreshTokenPayload = { id: user.id, type: 'refresh' };
    
    return {
      id: user.id,
      accessToken: this.jwtService.sign(accessPayload),
      refreshToken: this.jwtService.sign(refreshPayload, {
        secret: this.configService.get<string>('API_REFRESH_TOKEN_SECRET'),
        expiresIn: `${this.configService.get<string>('API_REFRESH_TOKEN_TTL_IN_DAYS')}d`,
      }),
    };
  }

  public refreshAccessToken(refreshToken: string): { accessToken: string } {
    if (!refreshToken) {
      throw Exception.new({code: Code.UNAUTHORIZED_ERROR});
    }

    try {
      const payload: HttpRefreshTokenPayload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('API_REFRESH_TOKEN_SECRET'),
      }) as HttpRefreshTokenPayload;
      if (payload.type !== 'refresh') {
        throw Exception.new({code: Code.UNAUTHORIZED_ERROR});
      }

      const accessPayload: HttpJwtPayload = { id: payload.id };
      return {
        accessToken: this.jwtService.sign(accessPayload),
      };
    } catch (error) {
      this.logger.error(error);
      throw Exception.new({code: Code.UNAUTHORIZED_ERROR});
    }
  }
  
  public async getUser(by: {id: string}): Promise<Optional<User>> {
    return this.userRepository.findUser(by);
  }
  
}
