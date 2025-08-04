import { RootModule } from '@application/di/.RootModule';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { initializeTransactionalContext, addTransactionalDataSource } from 'typeorm-transactional';

export class TestServer {
  
  constructor(
    public readonly serverApplication: NestExpressApplication,
    public readonly dbConnection: DataSource,
    public readonly testingModule: TestingModule,
  ) {}
  
  public static async new(): Promise<TestServer> {
    const testingModule: TestingModule = await Test
      .createTestingModule({imports: [RootModule]})
      .compile();
  
    initializeTransactionalContext();
    const dbConnection: DataSource = testingModule.get(DataSource);
    addTransactionalDataSource(dbConnection);
    
    const serverApplication: NestExpressApplication = testingModule.createNestApplication();
    
    return new TestServer(serverApplication, dbConnection, testingModule);
  }
  
}
