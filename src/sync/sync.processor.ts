import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { SyncService } from "./sync.service";
import { promises } from "dns";
import { Job, Queue, tryCatch } from "bullmq";
import { Logger } from "@nestjs/common";

@Processor('fila-sincronizacao')
export class SyncProcessor extends WorkerHost {
  constructor(
    @InjectQueue('sync-queue') private readonly syncQueue: Queue, // ✅ Agora o Nest localiza a fila  ) {
    private readonly logger = new Logger(SyncProcessor.name),
    private readonly syncService: SyncService,
  ){
    super();
  }

  async process(job: Job<any>): Promise<any> {
    const jobName = job.name;
    const party = job.data; 

    this.logger.log(`[JOB] Processando: ${jobName} ID: ${party.id}`);

    switch (jobName) {
      case 'novo-cliente':
      case 'update-cliente':

        const targets = party.destinos || [];

        for (const target of targets) {
          try {

            await this.syncService.processSynchronization(target, party);

          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            this.logger.error(`Falha ao sincronizar ${party.id} para ${target}: ${errorMessage}`); 
            }
        }
        break;

      default:
        this.logger.warn(`Job desconhecido: ${jobName}`);
    }

    return {};
  }
}