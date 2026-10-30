# Implementation Plan: MDview

## Arquitetura concluida

- [x] Projeto Next.js, TypeScript, Tailwind e Vitest.
- [x] Autenticacao JWT, bcrypt, rate limiting e middleware.
- [x] Banco SQLite com Drizzle e migracoes automaticas.
- [x] Renderizacao Markdown segura e responsiva.
- [x] Marcadores de progresso por usuario.
- [x] Navegacao entre arquivos e home.
- [x] Docker, Caddy e seed.
- [x] Tabela global `files` com ID, nome, conteudo, tamanho e datas.
- [x] API local de listagem e upload Markdown.
- [x] Upload no topo da sidebar com validacao de extensao e tamanho.
- [x] Remocao de cliente, cache e configuracoes do Google Drive.

## Pendencias de validacao

- [ ] Completar cobertura automatizada de upload, substituicao, listagem e recuperacao.
- [ ] Executar lint, TypeScript, testes e build apos a migracao.
- [ ] Validar a migracao `0001_add_local_markdown_files.sql` no Docker.
- [ ] Verificar links internos Markdown usando IDs/nomes dos arquivos locais.
- [ ] Revisar a documentacao e remover artefatos historicos restantes.
