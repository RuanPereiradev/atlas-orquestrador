import { Logger } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { metadata } from "reflect-metadata/no-conflict";

export class SyncService{
    private readonly logger = new Logger(SyncService.name);
    private supabase: SupabaseClient;

    constructor(){
        this.supabase = createClient(
        'https://dmpnhlsreokzjikpccny.supabase.co',
        'sb_publishable_T66RCdRBnS8R6Z9Wn9UChg_XpaEVO5A'
        );
    }

    async criarNovoCliente(nome: string, email: string){
        this.logger.log(`[CÓDIGO] Gerando novo cliente na tabela original: ${nome}`);

        const { data, error } = await this.supabase
        .from('clientes')
        .insert([{nome, email}])
        .select()

        if(error){
            this.logger.error(`[ERRO AO CRIAR ] ${error.message}`)
            return null;
        }
        return data[0];
    }


    async orquestrar(dadosOrigem: any){
        this.logger.log(`[SYNC] Processando registro: ${dadosOrigem.nome}`);

        const payloadDestino = {
            nome: dadosOrigem.nome,
            email: dadosOrigem.email,
            origem_bu: 'SYNC_TEST_WORKSPACE',
            metadata: {
                original_id: dadosOrigem.id,
                sync_at: new Date().toISOString()
            }
        };

        const { data, error} = await this.supabase
        .from('teste_sincronizacao')
        .insert([payloadDestino])
        .select();

        if(error){
            this.logger.error(`[ERRO] Falha ao sincronizar: ${error.message}`);
            return;
        }

        this.logger.log(`[SUCESSO] Sincronizado! Novo ID: ${data[0].id}`)
    }
}