import { HttpAuthService } from '@application/api/http-rest/auth/HttpAuthService';
import { HttpJwtStrategy } from '@application/api/http-rest/auth/passport/HttpJwtStrategy';
import { HttpLocalStrategy } from '@application/api/http-rest/auth/passport/HttpLocalStrategy';
import { HttpRefreshTokenStrategy } from '@application/api/http-rest/auth/passport/HttpRefreshTokenStrategy';
import { AuthController } from '@application/api/http-rest/controller/AuthController';
import { UserModule } from '@application/di/UserModule';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import {ConfigModule, ConfigService} from '@nestjs/config';

@Module({
  controllers: [
    AuthController
  ],
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('API_ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('API_ACCESS_TOKEN_TTL_IN_MINUTES'),
        },
      }),
    }),
    UserModule,
  ],
  providers: [
    HttpAuthService,
    HttpLocalStrategy,
    HttpJwtStrategy,
    HttpRefreshTokenStrategy
  ],
})
export class AuthModule {}

