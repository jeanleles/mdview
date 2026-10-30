# Design Document: MDview

## Visao geral

MDview e uma aplicacao Next.js App Router para leitura pessoal de apostilas Markdown. A interface e protegida por autenticacao JWT. Os arquivos nao sao separados por usuario: sao armazenados globalmente no SQLite e compartilhados por toda a instalacao.

## Componentes

- `src/app/(auth)/login`: formulario de login.
- `src/app/(protected)`: pagina inicial e visualizacao dos arquivos.
- `src/components/NavigationPanelClient`: sidebar, navegacao, logout e upload.
- `src/components/MarkdownRenderer`: renderizacao segura de Markdown.
- `src/app/api/files`: listagem, upload, validacao e substituicao por nome.
- `src/lib/files.ts`: consultas locais por ID e listagem global.
- `src/lib/db/schema.ts`: usuarios, arquivos, marcadores e tentativas de login.
- `src/lib/db/index.ts`: conexao SQLite e migracoes automaticas Drizzle.

## Armazenamento de arquivos

A tabela `files` contem `id`, `name`, `content`, `size`, `createdAt` e `updatedAt`.

- Apenas arquivos com extensao `.md` sao aceitos.
- O limite total por upload e 2 MB.
- O conteudo e armazenado como texto no SQLite.
- Arquivos sao ordenados pelo nome.
- Upload com nome existente preserva o ID e substitui o conteudo.
- Novos uploads recebem UUID.
- Os arquivos ficam disponiveis em `/files/[fileId]`.

## Integracao removida

Nao existem mais cliente, API key, pasta configurada, cache ou consultas ao Google Drive. A lista e o conteudo sao servidos localmente pelo banco de dados, tornando o carregamento independente de rede externa.

## Persistencia e implantacao

Os bancos SQLite ficam em `/app/data` no container e persistem por volume Docker. As migracoes da pasta `drizzle` sao executadas na inicializacao. Docker Compose executa a aplicacao e Caddy fornece proxy reverso e TLS.

## Upload na interface

O botao de upload fica antes da lista de arquivos na sidebar. Ele abre um input oculto, aceita `.md`, informa carregamento, sucesso via atualizacao da lista e erros de validacao ou gravacao.
