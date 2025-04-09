import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as fs from 'fs'; // Import Node.js file system module

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Use Helmet with customized CSP for Swagger CDN
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          scriptSrc: [
            `'self'`,
            `'unsafe-inline'`,
            'https://unpkg.com',
          ], // Allow scripts from self, inline, and unpkg
          styleSrc: [
            `'self'`,
            `'unsafe-inline'`,
            'https://unpkg.com',
          ], // Allow styles from self, inline, and unpkg
          imgSrc: [
            `'self'`,
            'data:',
            'https://unpkg.com',
          ], // Allow images from self, data URIs, and unpkg (for Swagger UI assets)
          connectSrc: [`'self'`], // Adjust if Swagger needs to connect elsewhere
          // Add other directives as needed, be as strict as possible
        },
      },
      // Keep other helmet defaults or configure as needed
      crossOriginEmbedderPolicy: false, // Might be needed depending on CDN resources
      crossOriginResourcePolicy: { policy: "cross-origin" }, // Might be needed
    }),
  );

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

  // Serve Swagger UI on /api/v1/docs
  const swaggerPath = `${apiPrefix}/docs`.replace(/\/\/$/, '');
  SwaggerModule.setup(swaggerPath, app, document, {
    customCssUrl:
      'https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css',
    customJs: [
      `https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js`,
      `https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js`,
    ],
  });

  // --- Write Swagger spec to file ---
  fs.writeFileSync("./swagger-spec.json", JSON.stringify(document, null, 2));
  console.log('Swagger specification saved to swagger-spec.json');
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
