# M001 TDD Evidence

Este documento preserva a evidência do ciclo TDD usado na microentrega M001.

## RED observado

Antes da implementação funcional, o teste de reprodução foi executado com Node.js 22 e falhou porque `src/app/buildApp` ainda não existia.

Essa falha confirmou que o contrato de health ainda não estava implementado.

## GREEN pendente

Após o RED, foi adicionada a implementação mínima de M001. A promoção da microentrega continua bloqueada até execução real, no mesmo SHA, de:

- `pnpm install --frozen-lockfile`;
- `pnpm quality`;
- `docker build`.

## Regra de promoção

M001 somente pode ser homologado após os gates GREEN, evidência anexada ao PR e merge controlado aprovado.
