import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { getQueueToken } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('WebhookController', () => {
  let controller: WebhookController;
  let queueMock: any;

  beforeEach(async () => {
    // Criamos um Mock (simulador) da fila do BullMQ
    queueMock = {
      add: jest.fn().mockResolvedValue({ id: 'job-id-teste' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        {
          provide: getQueueToken('fila-sincronizacao'),
          useValue: queueMock,
        },
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
    // Desativa os logs no terminal durante os testes para ficar limpo
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  // TESTE 1: INSERT LEGÍTIMO
  it('deve aceitar um evento de INSERT legítimo e adicionar à fila', async () => {
    const payloadInsert = {
      type: 'INSERT',
      record: {
        id: 15,
        nm: 'Cliente Novo Teste',
        doc: '12345678901',
        em: 'novo@teste.com',
        tel: '88999999999',
        destinos: ['connect'],
      },
      old_record: null,
    };

    const resultado = await controller.handleCrmWebhook(payloadInsert);

    expect(resultado).toEqual({ received: true });
    expect(queueMock.add).toHaveBeenCalledWith('novo-cliente', payloadInsert.record, expect.any(Object));
  });

  // TESTE 2: PROTEÇÃO ANTI-LOOP (UPDATE APENAS DE STATUS)
  it('deve ignorar um UPDATE que alterou apenas o status (Proteção contra Loop Infinito)', async () => {
    const payloadUpdateLoop = {
      type: 'UPDATE',
      record: {
        id: 14,
        nm: 'Ruan Integracao Final',
        doc: '11122233344',
        em: 'ruan@teste.com',
        status_sync: 'synced', // Status mudou
        destinos: ['connect'],
      },
      old_record: {
        id: 14,
        nm: 'Ruan Integracao Final',
        doc: '11122233344',
        em: 'ruan@teste.com',
        status_sync: 'pending', // Status antigo
        destinos: ['connect'],
      },
    };

    const resultado = await controller.handleCrmWebhook(payloadUpdateLoop);

    expect(resultado).toEqual({ received: true, ignored: 'loop_protection' });
    // Garante que o job NÃO foi enviado para a fila do Redis
    expect(queueMock.add).not.toHaveBeenCalled();
  });

  // TESTE 3: UPDATE LEGÍTIMO (ALTERAÇÃO DE DADO DO CLIENTE)
  it('deve aceitar um UPDATE se um dado relevante do cliente foi alterado', async () => {
    const payloadUpdateLegitimo = {
      type: 'UPDATE',
      record: {
        id: 14,
        nm: 'Ruan Nome Mudou', // Nome foi alterado
        doc: '11122233344',
        em: 'ruan@teste.com',
        destinos: ['connect'],
      },
      old_record: {
        id: 14,
        nm: 'Ruan Integracao Final',
        doc: '11122233344',
        em: 'ruan@teste.com',
        destinos: ['connect'],
      },
    };

    const resultado = await controller.handleCrmWebhook(payloadUpdateLegitimo);

    expect(resultado).toEqual({ received: true });
    expect(queueMock.add).toHaveBeenCalledWith('update-cliente', payloadUpdateLegitimo.record, expect.any(Object));
  });

  // TESTE 4: PAYLOAD TOTALMENTE INVÁLIDO
  it('deve retornar mensagem de erro se o record não for enviado', async () => {
    const payloadInvalido = {
      type: 'INSERT',
      record: null, // Testando a nossa proteção
      old_record: null
    };

    const resultado = await controller.handleCrmWebhook(payloadInvalido);

    expect(resultado).toEqual({ message: 'dados ausentes' });
    expect(queueMock.add).not.toHaveBeenCalled();
  });
});
