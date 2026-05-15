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

        if(!payload){
            this.logger.warn(`[WEBHOOK] Requisição recebida com body vazio`)
            return {message: 'dados ausentes'}
        }
        const eventType = payload.type || payload.event_type
        const record = payload.record
        const oldRecord = payload.old_record
        const activeRecord = payload.old_record

        if(!record){
            this.logger.warn(`[WEBHOOK] Requisição recebida sem dados de registros`)
            return {message: 'dados ausentes'}
        }

        this.logger.log(`[WEBHOOK] Evento recebido do CRM: ${eventType} para ID: ${record?.id}`)

        if(eventType === 'UPDATE' && record && oldRecord){
            const relevantChange = 
                record.nm !== oldRecord.nm ||
                record.doc !== oldRecord.doc ||
                record.em !== oldRecord.em ||
                record.tel !== oldRecord.tel ||
                JSON.stringify(record.destinos) !== JSON.stringify(oldRecord.destinos)

            if(!relevantChange){
                this.logger.log(`[WEBHOOK] Ignorando UPDATE status para ID: ${record.id} para evitar loop infinito.`);
                return {received: true, ignored: "loop_protection"};
            }
        }

        let jobName = '';
        if(eventType === 'INSERT'){
            jobName = 'novo-cliente'
        }else if(eventType === 'UPDATE'){
            jobName = 'update-cliente'
        }else{
            this.logger.warn(`[WEBHOOK] Evento ${eventType} ignorado pelo orquestrador`);
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