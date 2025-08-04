import { RootModule } from '@application/di/.RootModule';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

export class ServerApplication {

  public async run(): Promise<void> {
    const app: NestExpressApplication = await NestFactory.create<NestExpressApplication>(RootModule);
    const configService: ConfigService = app.get(ConfigService);
     
    const host = configService.get<string>('API_HOST');
    const port =  Number.parseInt(configService.get<string>('API_PORT') || '3000', 10);
    if(!host) {
      throw new Error('API server host is not defined in the configuration.');
    }
    this.buildAPIDocumentation(app);
    this.log(host, port);
    await app.listen(port, host);
    Logger.log(`API server run at: http://${host}:${port}`, ServerApplication.name);

  }
  
  private buildAPIDocumentation(app: NestExpressApplication): void {
    const configService: ConfigService = app.get(ConfigService);
    const title: string = configService.get<string>('API_TITLE', 'API');
    const description: string = configService.get<string>('API_DESCRIPTION', 'API Documentation');
    const version: string = configService.get('API_VERSION', '1.0.0');
    
    const options: Omit<OpenAPIObject, 'paths'> = new DocumentBuilder()
      .setTitle(title)
      .setDescription(description)
      .setVersion(version)
      .addBearerAuth()
      .build();
    
    const document: OpenAPIObject = SwaggerModule.createDocument(app, options);
    
    SwaggerModule.setup('documentation', app, document);
  }
  
  private log(host: string, port: number): void {
    Logger.log(`Server started on host: ${host}; port: ${port};`, ServerApplication.name);
  }
  
  public static new(): ServerApplication {
    return new ServerApplication();
  }
  
}
