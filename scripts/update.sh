#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$APP_DIR"

echo "==> Verificando Git e Docker"

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Erro: $APP_DIR nao e um repositorio Git." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Erro: Docker Compose nao esta disponivel." >&2
  exit 1
fi

echo "==> Atualizando repositorio"
git pull --ff-only

echo "==> Construindo a aplicacao"
docker compose build app

echo "==> Atualizando o container app"
docker compose up -d --no-deps app

echo "==> Aguardando a aplicacao ficar saudavel"
healthy=false
health_output=""

for attempt in $(seq 1 30); do
  health_output="$(
    docker compose exec -T app node -e '
      fetch("http://127.0.0.1:3000/login", { redirect: "manual" })
        .then((response) => {
          console.log(response.status);
          process.exit(response.status >= 200 && response.status < 500 ? 0 : 1);
        })
        .catch((error) => {
          console.error(error.message);
          process.exit(1);
        });
    ' 2>&1
  )" && {
    healthy=true
    break
  }

  echo "Tentativa $attempt/30..."
  sleep 2
done

if [[ "$healthy" != true ]]; then
  echo "Erro: a aplicacao nao respondeu no container apos 60 segundos." >&2
  echo "$health_output" >&2
  echo "" >&2
  docker compose ps app >&2 || true
  docker compose logs --tail=100 app >&2 || true
  exit 1
fi

echo "==> Aplicacao respondeu na porta 3000 (HTTP $health_output)"

echo "==> Estado dos containers"
docker compose ps app
