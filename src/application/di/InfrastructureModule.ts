import { NestHttpExceptionFilter } from '@application/api/http-rest/exception-filter/NestHttpExceptionFilter';
import { NestHttpLoggingInterceptor } from '@application/api/http-rest/interceptor/NestHttpLoggingInterceptor';
import { CoreDITokens } from '@core/common/di/CoreDITokens';
import { NestCommandBusAdapter } from '@infrastructure/adapter/message/NestCommandBusAdapter';
import { NestEventBusAdapter } from '@infrastructure/adapter/message/NestEventBusAdapter';
import { NestQueryBusAdapter } from '@infrastructure/adapter/message/NestQueryBusAdapter';
import { TypeOrmLogger } from '@infrastructure/adapter/persistence/typeorm/logger/TypeOrmLogger';
import { TypeOrmDirectory } from '@infrastructure/adapter/persistence/typeorm/TypeOrmDirectory';
import { Global, Module, OnApplicationBootstrap, Provider } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { initializeTransactionalContext, addTransactionalDataSource } from 'typeorm-transactional';
import {DataSource} from 'typeorm';
import {ConfigModule, ConfigService} from '@nestjs/config';

const providers: Provider[] = [
  {
    provide : APP_FILTER,
    useClass: NestHttpExceptionFilter,
  },
  {
    provide: CoreDITokens.CommandBus,
    useClass: NestCommandBusAdapter,
  },
  {
    provide: CoreDITokens.QueryBus,
    useClass: NestQueryBusAdapter,
  },
  {
    provide: CoreDITokens.EventBus,
    useClass: NestEventBusAdapter,
  },
  {
    provide : APP_INTERCEPTOR,
    useClass: NestHttpLoggingInterceptor,
  }
];


@Global()
@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>({
        type                     : 'postgres',
        host                     : configService.get('DB_HOST') || 'localhost',
        port                     : configService.get('DB_PORT') || 5432,
        username                 : configService.get('DB_USERNAME') || '5432',
        password                 : configService.get('DB_PASSWORD') || '5432',
        database                 : configService.get('DB_NAME') || '5432',
        logging                  : configService.get('DB_LOG_ENABLE') == 'true' ? 'all' : false,
        logger                   : configService.get('DB_LOG_ENABLE') == 'true' ? TypeOrmLogger.new() : undefined,
        entities                 : [`${TypeOrmDirectory}/entity/**/*{.ts,.js}`],
        migrationsRun            : true,
        migrations               : [`${TypeOrmDirectory}/migration/**/*{.ts,.js}`],
        migrationsTransactionMode: 'all',
      })
    })
  ],
  providers: providers,
  exports: [
    CoreDITokens.CommandBus,
    CoreDITokens.QueryBus,
    CoreDITokens.EventBus,
    TypeOrmModule,
  ]
})
export class InfrastructureModule implements OnApplicationBootstrap {
  constructor(private readonly moduleRef: ModuleRef) {}
  async onApplicationBootstrap(): Promise<void> {
    initializeTransactionalContext();
    const dataSource: DataSource = this.moduleRef.get(DataSource, { strict: false });
    try {
      addTransactionalDataSource(dataSource);
    } catch (e: any) {
      if (e?.message?.includes('has already added')) {
        // Ignore if already added
      } else {
        throw e;
      }
    }
  }
}
