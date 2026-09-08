# M002 — Universal Connector Contract — Handoff

Este documento prepara a próxima microentrega sem iniciar sua implementação antes da homologação do M001.

## Objetivo

Definir o contrato mínimo e estável para conectores do Integration Service.

## Contrato-alvo

```ts
export interface Connector {
  readonly id: string;
  readonly version: string;
  readonly capabilities: readonly string[];

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  health(): Promise<ConnectorHealth>;
  execute(input: ConnectorExecutionInput): Promise<ConnectorExecutionResult>;
  validateConfig(config: unknown): ConnectorConfigValidation;
}
```

## TDD planejado

1. Escrever teste RED para um `FakeConnector` que satisfaça o contrato.
2. Confirmar falha pela ausência do contrato/implementação.
3. Criar tipos mínimos do contrato.
4. Criar `FakeConnector` mínimo.
5. Executar testes GREEN.
6. Rodar `pnpm quality` e build no mesmo SHA.

## Critérios de aceite

- contrato não contém regra de negócio de CRM/Dispatch/Event Engine;
- `id` e `version` são explícitos;
- capabilities são declarativas;
- `validateConfig` não persiste configuração;
- `execute` recebe/retorna estruturas neutras de integração;
- FakeConnector permite testes sem dependência externa;
- nenhuma implementação real de fornecedor entra no M002.

## Gate de início

A implementação de M002 só pode começar após:

- M001 `pnpm-lock.yaml` versionado;
- M001 `pnpm quality` GREEN;
- M001 Docker build GREEN;
- evidência registrada no PR #1;
- homologação explícita do M001.
