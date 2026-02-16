import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import 'dotenv/config';
import { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import hpp from 'hpp';
import passport from 'passport';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import './config/passport.config';

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Nearby Car & Driver Matching API')
    .setDescription(
      'Backend API for ride requests, authentication, and nearby driver matching',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    )
    .build();
  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDoc);

  app.use(hpp());
  app.use(cookieParser());

  app.use(
    session({
      secret: process.env.EXPRESS_SESSION_SECRET ?? 'change-me',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
      },
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());
  if (isProd) {
    app.use(
      csurf({
        cookie: {
          httpOnly: true,
          secure: isProd,
          sameSite: 'lax',
        },
      }),
    );
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (
        req.method === 'GET' ||
        req.method === 'HEAD' ||
        req.method === 'OPTIONS'
      ) {
        const csrfTokenFn = (req as unknown as { csrfToken?: () => string })
          .csrfToken;
        if (csrfTokenFn) {
          res.cookie('XSRF-TOKEN', csrfTokenFn(), {
            httpOnly: false,
            secure: isProd,
            sameSite: 'lax',
          });
        }
      }
      next();
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
