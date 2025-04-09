import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Use Helmet for security headers
  app.use(helmet());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');

  // Enable CORS - Configure origin for production!
  app.enableCors(/* {
    origin: 'YOUR_FRONTEND_URL', // e.g., 'http://localhost:4200' or production domain
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  } */);

  app.setGlobalPrefix(apiPrefix);

  // --- Swagger Setup ---
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Voluntia API')
    .setDescription('API documentation for the Voluntia platform backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  // Serve Swagger UI on /api/v1/docs (adjusted for prefix)
  const swaggerPath = `${apiPrefix}/docs`.replace(/\/\/$/, '');

  // Use external CDN assets for Vercel compatibility
  SwaggerModule.setup(swaggerPath, app, document, {
      // customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.7/swagger-ui.min.css',
      // customJs: [
      //     `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.7/swagger-ui-bundle.min.js`,
      //     `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.7/swagger-ui-standalone-preset.min.js`,
      // ],
      // Use unpkg for potentially more up-to-date versions matching swagger-ui-dist used by NestJS
       customCssUrl:
         'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css',
       customJs: [
         `https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js`,
         `https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js`,
       ],
  });
  // ---

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger Docs available at: ${await app.getUrl()}${swaggerPath}`);
}
bootstrap();
