import { Logger } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { metadata } from "reflect-metadata/no-conflict";

export class SyncService{
    private readonly logger = new Logger(SyncService.name);
    private crm: SupabaseClient;
    private atlas: SupabaseClient;
    private connect: SupabaseClient;
    
    constructor(){
        this.crm = createClient(process.env.CRM_DB_URL!, process.env.CRM_DB_KEY!);
        this.atlas = createClient(process.env.RFOPS_DB_URL!, process.env.RFOPS_KEY!);
        this.connect = createClient(process.env.CONNECT_URL!, process.env.CONNECT_KEY!);
    }
    
    async processSynchronization(target: string, party: any){
        let result;

        if(target === 'connect'){
            result = await this.syncToConnect(party)
        } else if(target === 'juridico'){
            result = await this.syncToAtlas(party)
        }

        if(result){
            await this.updateStatusCrm(party.id, target, 'synced')
        }else{
            await this.updateStatusCrm(party.id, target, 'failed')
        }
    }
    private async syncToAtlas(data: any){
        this.logger.log(`[ATLAS/Juridico] sync: ${data.nm}`);

        const payload = {
            nome: data.nm,
            cpf: data.doc,
            email: data.em,
            telefone: data.tel,
            tipo: data.tp?.toLowerCase() === 'pj' ? 'pj' : 'pf'
        };

        const {error} = await this.atlas.from('clientes').upsert(payload, {onConflict:'cpf'})
        if(error){
            this.logger.error(`Erro Atlas: ${error.message}`);
            return false;
        }
        return true;
    }

    private async syncToConnect(data: any){
        this.logger.log(`[CONNECT] Sincronizando participante: ${data.nm}`)
        
        const payload = {
            full_name: data.nm,
            email: data.em,
            phone: data.tel,
            cpf: data.doc,
            company: data.nome_fantasia || data.rs
        };

        const {error} = await this.connect.from('event_attendees').upsert(payload, {onConflict: 'email' })
        if(error){
            this.logger.error(`Erro Connect: ${error.message}`);
            return false;
        }
        return true;
    }

    private async updateStatusCrm(partyId:number, destino: string, status: string) {
        const { error } = await this.crm.rpc('update_party_sync_status', {
            p_party_id: partyId,
            p_destino: destino,
            p_status: status
        });

        if(error){
            this.logger.error(`Erro ao atualizar status RPC no CRM: ${error.message}`)
        }
    }
}