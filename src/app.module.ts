import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { SyncProcessor } from './sync/sync.processor';
import { SyncService } from './sync/sync.service';

@Module({
  imports: [
    // 1. Configura a conexão com o container do Redis
    BullModule.forRoot({
      redis: {
        host: 'orquestrador_redis', // Nome do serviço no seu docker-compose
        port: 6379,
      },
    }),

    // 2. Registra a fila. O "name" aqui PRECISA ser exatamente igual 
    // ao nome que está escrito em cima da classe do seu SyncProcessor
    BullModule.registerQueue({
      name: 'sync', // 👈 Substitua pelo nome real da sua fila se não for 'sync'
    }),
  ],
  controllers: [],
  // 3. O NestJS precisa que o Processor e o Service estejam declarados aqui
  providers: [SyncProcessor, SyncService], 
})
export class AppModule {}