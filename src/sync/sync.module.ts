import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { SyncService } from "./sync.service";
import { SyncProcessor } from "./sync.processor";
import { ConnectWorker } from "./worker/connect.worker";
import { JuridicoWorker } from "./worker/juridico.worker";
import { WebhookController } from "src/webhook/webhook.controller";

@Module({
    imports:[
        BullModule.registerQueue(
            {name: 'fila-sincronizacao'},
            {name: 'fila-connect'},
            {name: 'fila-juridico'},
        ),
    ],
    controllers:[WebhookController],
    providers: [SyncService, SyncProcessor, ConnectWorker, JuridicoWorker],
    exports: [SyncService, BullModule]
})
export class syncModule{}