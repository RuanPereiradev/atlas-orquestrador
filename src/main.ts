import * as dotenv from 'dotenv';
dotenv.config(); // Carrega as variáveis do .env para o process.env

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT || 3000);
}
bootstrap();