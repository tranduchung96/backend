import { AuthModule } from '@application/di/AuthModule';
import { InfrastructureModule } from '@application/di/InfrastructureModule';
import { MediaModule } from '@application/di/MediaModule';
import { PostModule } from '@application/di/PostModule';
import { UserModule } from '@application/di/UserModule';
import { Module } from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    InfrastructureModule,
    AuthModule,
    UserModule,
    MediaModule,
    PostModule,
  ]
})
export class RootModule {}
