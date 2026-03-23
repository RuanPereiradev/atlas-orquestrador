<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">Um orquestrador de eventos progressivo para <a href="http://nodejs.org" target="_blank">Node.js</a> focado em sincronização de dados em tempo real com <a href="https://supabase.com/" target="_blank">Supabase</a>.</p>

<p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<img src="https://img.shields.io/badge/Supabase-Webhooks-blue.svg" alt="Supabase Webhooks" />
<img src="https://img.shields.io/badge/Status-Online-brightgreen.svg" alt="Status"/>
</p>

## Descrição

Este projeto é um **Orquestrador de Dados** desenvolvido com o framework [Nest](https://github.com/nestjs/nest). Ele funciona como um middleware de sincronização que escuta alterações na tabela `clientes` do Supabase e replica os dados automaticamente para a tabela `teste_sincronizacao`, permitindo a centralização e transformação de informações em tempo real.

## Fluxo da Arquitetura

1.  **Insert:** Um novo registro é inserido na tabela de origem (`clientes`).
2.  **Trigger:** O Supabase dispara um Webhook via HTTP POST.
3.  **Tunnel:** O **Ngrok** encaminha a requisição da nuvem para o ambiente local.
4.  **Orquestração:** O NestJS recebe o payload, aplica a lógica de negócio e persiste no destino.

## Configuração do Projeto

```bash
# Instalar as dependências
$ npm install
```

## Configuração de Ambiente
Crie um arquivo .env na raiz do projeto:
```.env
SUPABASE_URL=[https://seu-projeto.supabase.co](https://seu-projeto.supabase.co)
SUPABASE_KEY=sua-chave-secreta-anon-ou-service-role
```

## Execução

```bash
# desenvolvimento (com auto-reload)
$ npm run start:dev

# produção
$ npm run start:prod
```
## Endpoints da API
### Método,Rota,Função
#### -> POST,/webhooks/supabase,Endpoint receptor do Webhook do Supabase.
#### -> POST,/webhooks/gerar-cliente,Rota de gatilho manual para criar um cliente na origem.

## Teste Rápido (CURL)
### Para disparar uma sincronização completa via terminal:

```Bash

curl -X POST http://localhost:3000/webhooks/gerar-cliente \
-H "Content-Type: application/json" \
-d '{"nome": "Ruan Automático", "email": "ruan@teste.com"}'
```
## Recursos Úteis
- Documentação Oficial NestJS: [text](https://docs.nestjs.com/)

- Guia de Webhooks do Supabase : [text](https://supabase.com/docs/guides/database/webhooks)

- Documentação do Ngrok: [text](https://ngrok.com/docs/start)