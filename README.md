# MDview

Aplicação Next.js para leitura pessoal de apostilas Markdown armazenadas localmente em SQLite.

## Desenvolvimento local

Copie `.env.example` para `.env`, configure as variáveis e execute:

```bash
npm ci
npm run dev
```

Variáveis obrigatórias:

- `JWT_SECRET`: segredo com pelo menos 32 caracteres.
Variáveis opcionais:

- `DATABASE_URL`: banco SQLite; padrão `./data/mdview.db`.
- `PORT`: porta HTTP; padrão 3000.
- `DOMAIN`: domínio público usado pelo Caddy.
- `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD`: credenciais do primeiro administrador.

## Criar o administrador

No desenvolvimento:

```bash
npm run seed
```

O script exige uma senha com pelo menos 12 caracteres, usa bcrypt com custo 10 e não substitui um usuário existente.

## Arquivos Markdown

Faça login e clique no ícone de upload ao lado da logo `MDview`, no topo da barra lateral. Selecione qualquer arquivo da lista para estudá-lo aleatoriamente. Arquivos podem ter até 2 MB e devem usar a extensão `.md`.

Os arquivos são compartilhados globalmente e ficam armazenados diretamente no SQLite. Enviar novamente um arquivo com o mesmo nome substitui o conteúdo anterior.

## Progresso de leitura

O percentual de leitura é atualizado em tempo real na barra superior, na sidebar e na tela inicial durante “Última leitura”.

Na página inicial, abaixo da seção “Última leitura”, a seção “Todos os arquivos” lista todos os arquivos Markdown disponíveis para acesso direto.

O progresso é salvo no SQLite apenas quando o percentual muda. Após a pausa da rolagem, o sistema aguarda 2 segundos antes de persistir a posição; não há requisições periódicas enquanto o usuário permanece parado.

## Docker e Caddy

Configure o DNS do domínio para apontar ao servidor, complete `.env` e execute:

```bash
docker compose build
docker compose up -d
```

Crie o administrador usando o serviço de seed:

```bash
docker compose --profile seed run --rm seed
```

Os dados ficam em `sqlite_data:/app/data`; os certificados TLS ficam em `caddy_data`.
