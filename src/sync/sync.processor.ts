import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { SyncService } from "./sync.service";
import { promises } from "dns";
import { Job, Queue, tryCatch } from "bullmq";
import { Logger } from "@nestjs/common";

@Processor('fila-sincronizacao')
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name); 
  constructor(
    @InjectQueue('fila-connect') private readonly connectQueue: Queue,
    @InjectQueue('fila-juridico') private readonly juridicoQueue: Queue
  ){
    super();
  }

  async process(job: Job<any>){
    const party = job.data;
    const targets = party.destinos || []

    this.logger.log(`[ROTEADOR] Encaminhando Party ID: ${party.id} para ${targets.length} destinos`);

    const tarefas = targets.map(target => {
      if(target === 'connect'){
        return this.connectQueue.add('sync-connect', party, {
          attempts: 5,
          backoff: { type: 'exponential', delay: 2000 }
        })
      }
      if(target === 'juridico'){
        return this.juridicoQueue.add('sync-juridico', party,{
          attempts: 5,
          backoff: {type: "exponential", delay: 2000}
        });
      }
    });

    await Promise.all(tarefas.filter(t=>t))
    return {roteado: true}
  }
}