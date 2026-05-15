import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { JuridicoWorker } from "./juridico.worker";
import { SyncService } from "../sync.service";

@Processor('fila-connect')
export class ConnectWorker extends WorkerHost{

    private readonly logger = new Logger(ConnectWorker.name)

    constructor(private readonly syncService: SyncService){
        super()
    }
    async process(job: Job<any>){
        await this.syncService.processSynchronization('connect', job.data)

        return {status: 'completed'}
    }
}