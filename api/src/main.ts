import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const isProd = process.env.NODE_ENV === 'production';

  // Refresh token de admin viaja en cookie httpOnly (ver auth.controller.ts)
  app.use(cookieParser());

  // ── Security headers ─────────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],  // Swagger UI needs inline styles
        imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    hsts: isProd
      ? { maxAge: 31536000, includeSubDomains: true, preload: true }
      : false,
    crossOriginEmbedderPolicy: false, // Needed for Swagger UI
  }));

  // ── HTTP → HTTPS redirect in production ──────────────────────────────────
  if (isProd) {
    app.use((req: any, res: any, next: any) => {
      if (req.headers['x-forwarded-proto'] === 'http') {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
      }
      next();
    });
  }

  // ── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: isProd
      ? process.env.ALLOWED_ORIGINS?.split(',')
      : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Validation ───────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Swagger (development only) ────────────────────────────────────────────
  if (!isProd) {
    const config = new DocumentBuilder()
      .setTitle('Sanguis API')
      .setDescription('Plataforma de Banco de Sangre — API Documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Sanguis API running on ${isProd ? 'https' : 'http'}://localhost:${port}`);
  if (!isProd) console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
