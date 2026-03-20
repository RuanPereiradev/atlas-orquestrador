import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebhookController } from './webhook/webhook.controller';
import { SyncService } from './sync/sync.service';

@Module({
  imports: [],
  controllers: [WebhookController],
  providers: [SyncService],
})
export class AppModule {}
