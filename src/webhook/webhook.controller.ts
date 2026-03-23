import { InjectQueue } from "@nestjs/bullmq";
import { Body, Controller, Logger, Post } from "@nestjs/common";
import { Queue } from "bullmq";
import { SyncService } from "src/sync/sync.service";

@Controller('webhooks')
export class WebhookController{
    private readonly logger = new Logger('WebhookController');

    constructor(private readonly syncService: SyncService,
        @InjectQueue('fila-sincronizacao') private readonly syncQueue: Queue,
    ){}

    @Post('supabase')
    async handle(@Body() payload: any) {
    console.log('1. Recebi o Webhook!', payload.record.nome); // Log de entrada
    
        try {
            await this.syncQueue.add('sincronizar-novo-cliente',payload.record,{
                attempts: 5,
                backoff: {
                    type: "exponential",
                    delay: 3000,
                },
                removeOnComplete: true,
            });

            this.logger.log('2. Cliente enviado para a fila com sucesso!');

            return { status: 'enfileirado', cliente: payload.record.nome };
        } catch (err) {
            this.logger.error('ERRO AO COLOCAR NA FILA:', err.message);
            return {status: 'erro', message: 'Falha ao processar a fila'}
        }
    }

    @Post('gerar-cliente')
    async gerar(@Body() body: {nome: string, email: string}){
        return await this.syncService.criarNovoCliente(body.nome, body.email);
    }
}