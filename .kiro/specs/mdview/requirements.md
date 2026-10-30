# Requirements Document

## Introducao

O MDview e uma aplicacao web pessoal para leitura de apostilas Markdown. Os arquivos sao enviados pela interface autenticada, armazenados diretamente no SQLite e disponibilizados globalmente para todos os usuarios da instalacao. O progresso continua salvo por usuario e por arquivo.

## Requisitos principais

1. Autenticacao: login por e-mail e senha, JWT, logout, protecao de rotas e limitacao de tentativas.
2. Arquivos locais: upload de arquivos `.md` com limite de 2 MB.
3. Substituicao: um upload cujo nome ja exista atualiza o arquivo preservando seu ID.
4. Listagem: arquivos globais ordenados pelo nome, exibidos no sidebar e na pagina inicial.
5. Visualizacao: renderizacao Markdown segura com tabelas, links, codigo, listas e tipografia responsiva.
6. Navegacao interna: links para arquivos locais devem navegar pelos IDs locais.
7. Marcadores: cada usuario pode salvar o percentual de leitura por arquivo. O percentual deve ser atualizado em tempo real na barra de progresso, na sidebar e na home.
   - Nao deve haver salvamentos repetidos enquanto o percentual nao mudar.
   - Uma nova posicao deve ser persistida apos 2 segundos sem novas alteracoes de rolagem.
8. Persistencia: arquivos e marcadores ficam no SQLite; o volume Docker `/app/data` deve ser persistente.
9. Implantacao: Docker Compose e Caddy continuam sendo usados para executar e publicar a aplicacao.
10. Remocao externa: o Google Drive e suas variaveis, clientes, cache e erros nao fazem parte da arquitetura.
