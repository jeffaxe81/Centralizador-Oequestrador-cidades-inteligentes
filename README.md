# AXE Sistemas — Centralizador / Orquestrador de Cidades Inteligentes

Serviço independente responsável pela camada de integração e orquestração entre os produtos AXE Sistemas e sistemas externos.

## Diretrizes arquiteturais

- cada produto é proprietário do seu próprio banco de dados;
- consultas SQL cruzadas entre produtos não são mecanismo de integração;
- chamadas síncronas usam APIs versionadas;
- evolução assíncrona usa eventos controlados;
- o Orquestrador não centraliza dados de negócio;
- fluxos multiempresa falham de forma fechada quando o tenant não é inequívoco;
- merge, deploy, migrations e grants permanecem gates controlados.

A implementação inicial segue as microentregas M001–M005 formalizadas no repositório `jeffaxe81/dispatch`, PR #54.
