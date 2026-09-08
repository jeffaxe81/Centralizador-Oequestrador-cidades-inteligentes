# M001 Local Runbook

## Requisitos

- Node.js 22.x
- pnpm 10.15.0
- Docker com Compose plugin (opcional)

## Instalação

```bash
corepack enable
corepack prepare pnpm@10.15.0 --activate
pnpm install
```

## Teste do M001

```bash
pnpm test -- tests/app/health.test.ts
```

Esperado após a implementação GREEN:

- `GET /health/live` retorna HTTP 200 com `{ "status": "ok" }`;
- `GET /health/ready` retorna HTTP 200 com `{ "status": "ready" }`.

## Gate de qualidade

```bash
pnpm quality
```

O M001 só pode ser promovido quando typecheck, testes e build estiverem GREEN no mesmo SHA.

## Execução local

```bash
pnpm dev
```

ou:

```bash
docker compose up --build
```

## Restrições

- não aplicar migration de produção;
- não inserir credenciais reais;
- não realizar deploy automático;
- não promover o PR sem evidência GREEN.
