import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { SyncProcessor } from './sync/sync.processor';
import { SyncService } from './sync/sync.service';
import { ConnectWorker } from './sync/worker/connect.worker';
import { JuridicoWorker } from './sync/worker/juridico.worker';
import { syncModule } from './sync/sync.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost', 
      },
    }),
    syncModule
  ],
})
export class AppModule {}