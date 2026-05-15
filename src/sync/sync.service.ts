import { Injectable, Logger } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { metadata } from "reflect-metadata/no-conflict";

@Injectable()
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
        let isSuccess = false;

        if(target === 'connect'){
            isSuccess = await this.syncToConnect(party) === true
        } else if(target === 'juridico'){
            isSuccess = await this.syncToAtlas(party) === true
        }

        if(isSuccess){
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

    private async syncToConnect(record: any){
        try {
            const {data, error} = await this.connect
            .from('parties')
            .upsert({
                name: record.nm,
                email: record.em,
                phone: record.tel,
                document: record.doc,
                type: record.tp?.toLowerCase() === 'pf' ? 'person' : 'company',
                source: 'crm_teste'
            },{
                onConflict: 'email'
            });

            if(error){
                this.logger.error(`[CONNECT] Erro Supabae: ${error.message}`)
                return false
            }

            this.logger.log(`[CONNECT] Sincronizado com sucesso na tabela global: ${record.nm}`)
            return true;
        } catch (error) {
            this.logger.error(`[CONNECT] Erro ao sincronizar na tabela global: ${error}`)
            return false;
        }
      
    }

    private async updateStatusCrm(partyId:number, destino: string, status: string) {
        const { error } = await this.crm.rpc('update_party_sync_status', {
            p_party_id: partyId,
            p_destino: destino,
            p_status: status
        });

        if(error){
            this.logger.error(`Erro: ${error.message}`);
            throw new Error(error.message); 
        }
        return true;
    }
}