import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebhookController } from './webhook/webhook.controller';
import { SyncService } from './sync/sync.service';
import {BullModule} from '@nestjs/bullmq';
import { SyncProcessor } from './sync/sync.processor';

@Module({
  imports: [BullModule.forRoot({
    connection:{
      host: 'localhost',
      port: 6379,
    },
  }),
  BullModule.registerQueue({
    name: 'fila-sincronizacao'
  })
],
  controllers: [WebhookController],
  providers: [SyncService, SyncProcessor],
})
export class AppModule {}
