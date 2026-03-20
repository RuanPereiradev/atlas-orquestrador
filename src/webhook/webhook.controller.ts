import { Body, Controller, Logger, Post } from "@nestjs/common";
import { SyncService } from "src/sync/sync.service";

@Controller('webhooks')
export class WebhookController{
    private readonly logger = new Logger('WebhookController');

    constructor(private readonly syncService: SyncService){}

    @Post('supabase')
    async handle(@Body() payload: any) {
    console.log('1. Recebi o Webhook!', payload.record.nome); // Log de entrada
    
    try {
        const resultado = await this.syncService.orquestrar(payload.record);
        console.log('3. Fim do processo de orquestração');
        return { status: 'ok' };
    } catch (err) {
        console.error('ERRO CRÍTICO NO CONTROLLER:', err.message);
    }
    }

    @Post('gerar-cliente')
    async gerar(@Body() body: {nome: string, email: string}){
        return await this.syncService.criarNovoCliente(body.nome, body.email);
    }
}