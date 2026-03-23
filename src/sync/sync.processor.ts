import { Processor, WorkerHost } from "@nestjs/bullmq";
import { SyncService } from "./sync.service";
import { promises } from "dns";
import { Job } from "bullmq";

@Processor('fila-sincronizacao')
export class SyncProcessor extends WorkerHost{
    constructor(private readonly syncService: SyncService){
        super();    
    }

    async process(job: Job<any>): Promise<any>{
        console.log(`Cliente em fila: ${job.data.nome} da fila!`);

        await this.syncService.orquestrar(job.data);

        return {}
    }
}