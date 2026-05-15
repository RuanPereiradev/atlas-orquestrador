import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { SyncService } from "../sync.service";

@Processor('fila-juridico')
export class JuridicoWorker extends WorkerHost{
    private readonly logger = new Logger(JuridicoWorker.name)

    constructor(private readonly syncService: SyncService){
        super();
    }
    async process(job: Job<any>){
        await this.syncService.processSynchronization('juridico', job.data)

        return {status: 'completed'}
    }
}