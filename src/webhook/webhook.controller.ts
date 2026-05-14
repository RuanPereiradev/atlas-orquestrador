import { InjectQueue } from "@nestjs/bullmq";
import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from "@nestjs/common";
import { Queue } from "bullmq";
import { SyncService } from "src/sync/sync.service";

@Controller('webhooks')
export class WebhookController{
    private readonly logger = new Logger('WebhookController');

    constructor(
        @InjectQueue('fila-sincronizacao') private readonly syncQueue: Queue,
    ){}

    @Post('crm_sync')
    @HttpCode(HttpStatus.OK)
    async handleCrmWebhook(@Body() payload: any){
        const {event_type, record, old_record} = payload;
        this.logger.log(`[WEBHOOK] Evento recebido do CRM: ${event_type} para ID: ${record?.id || old_record?.id}`)

        let jobName = '';
        if(event_type === 'INSERT'){
            jobName = 'novo-cliente'
        }else if(event_type === 'UPDATE'){
            jobName = 'update-cliente'
        }else{
            this.logger.warn(`[WEBHOOK] Evento ${event_type} ignorado pelo orquestrador`);
            return {message: 'Evento ignorado'}
        }

        const partyData = record;

        await this.syncQueue.add(jobName, partyData, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
            removeOnComplete: true,
        });

        this.logger.log(`[WEBHOOK] job ${jobName} adicionado à fila com sucesso para a party: ${partyData.nm}`)

        return { received: true };
    }
}