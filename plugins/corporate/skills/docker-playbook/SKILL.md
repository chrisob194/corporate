---
name: docker-playbook
description: Use when work touches containers — a `Dockerfile`, `.dockerignore`, `compose.yaml` or `docker-compose.yml`, `docker build`, `docker run`, `docker compose`, `buildx`, a base image, a multi-stage build, layer caching, an image tag or digest, a healthcheck, a named volume, `docker push` or a registry — or when a service has to run the same way locally and in CI.
---

# Docker Playbook

## Stack

Docker Engine, with BuildKit as the builder and Compose v2 as the multi-service
layer. Two contracts, one file each:

| Contract | File | Built and run by |
|---|---|---|
| one container image | `Dockerfile` | `docker buildx build` |
| a multi-service application | `compose.yaml` | `docker compose` |

`compose.yaml` is the canonical name — `compose.yml` and both
`docker-compose.*` spellings are backwards compatibility, and `compose.yaml`
wins when more than one exists. The Compose Specification is the format; there
is no `version:` key.

Multi-stage is the default shape of a Dockerfile, not an optimization: the stage
that compiles is not the stage that ships. Base images are pinned by digest
(`image@sha256:…`), and every image declares a non-root `USER` and an exec-form
entrypoint.

## Toolchain

| Job | Command |
|---|---|
| build an image | `docker buildx build -t <name>:<tag> .` |
| build for another arch | `docker buildx build --platform linux/amd64,linux/arm64 …` |
| pass a build secret | `docker buildx build --secret id=<id>,env=<VAR> …` |
| see what each layer cost and carries | `docker image history <image>` |
| resolve a tag to a digest | `docker buildx imagetools inspect <image>` |
| run one container | `docker run --rm -it <image>` |
| render the effective compose file | `docker compose config` |
| bring the stack up | `docker compose up -d --build` |
| logs / a shell in a service | `docker compose logs -f <svc>` / `docker compose exec <svc> sh` |
| stop the stack, keep volumes | `docker compose down` |
| reclaim disk | `docker system df`, then a scoped `docker image prune` |

`docker compose` — the v2 CLI plugin — is the only spelling. Never the legacy
`docker-compose` binary, not in a shell, not in a `package.json` script, not in
CI, not in a README. Builds go through BuildKit; never disable it with
`DOCKER_BUILDKIT=0`. Older docs, Stack Overflow answers and generated snippets
still show both legacy forms — the translated command is what lands in the file.

## Obligations by activity

| Activity | Obligation |
|---|---|
| any | `docs.docker.com` is the authority, its pages indexed by `docs.docker.com/llms.txt` and retrieved through the `.md` route for a page (`…/reference/dockerfile.md`). The `reference/`, `build/`, `engine/` and `compose/` subtrees are this playbook's area — Desktop, Hub, Scout, billing and enterprise are not. A fact those pages cover is read there, never asserted from memory |
| choosing an approach | decide in writing what runs in the image and what runs beside it. A database, a queue or a cache is a compose service, never a second process bolted into an application image |
| implementing | multi-stage build, pinned base digest, a `.dockerignore` written before the first `COPY`, dependency manifests copied and installed before the source, a non-root `USER`, exec-form `ENTRYPOINT`/`CMD`. A service another service waits on gets a `healthcheck` |
| reviewing | reject a secret in `ARG` or `ENV`, a `latest` or unpinned base, a missing `.dockerignore`, `COPY . .` above the dependency install, a container left running as root, shell-form `CMD`, a `version:` key, a `depends_on` without `condition: service_healthy` where readiness is actually required, and any `docker-compose` invocation |
| testing | the image is the unit — build it and run the suite inside it, not against the host toolchain. A compose stack is proven by coming up from nothing (`down` then `up`) and passing every healthcheck |

## Traps

- **Layer cache is positional.** `COPY . .` before the dependency install
  invalidates the install layer on every source edit. Copy the manifest, install,
  then copy the source.
- **No `.dockerignore` means the whole context is uploaded** — `.git`,
  `node_modules`, local env files — and everything in it is reachable by a
  `COPY`. It is not a build-speed tweak; it is what keeps secrets out of the
  image.
- A non-predefined `ARG` is preserved in `docker history`, and its value
  invalidates the cache when it changes. `ENV` goes further: it persists into
  the running container's environment. A build-time secret is
  `RUN --mount=type=secret`, never either of them.
- **`latest` is a mutable tag, not a version.** Two builds a week apart from the
  same Dockerfile are two different images unless the base is pinned by digest.
- **Shell form breaks signals.** `CMD python app.py` runs under `/bin/sh -c`,
  which becomes PID 1 and does not forward `SIGTERM`, so the container is killed
  on timeout instead of shutting down. Exec form — the JSON array — is the
  default, and a process that genuinely needs a shell gets an init instead.
- A container runs as root unless a `USER` is set. Adding one late usually
  breaks file ownership written by earlier layers, so it belongs in the first
  draft.
- The top-level `version:` in `compose.yaml` is **obsolete** and warns. Compose
  always validates against the current schema.
- **`depends_on` waits for start, not for readiness.** Without
  `condition: service_healthy` and a `healthcheck` on the dependency, the
  dependent starts against a database that is not accepting connections yet.
- A named volume and a bind mount are different contracts: a bind mount over a
  directory the build populated hides what the image put there, and the
  container then runs code the image does not contain.
- Image architecture follows the build host. An image built on arm64 and
  deployed to amd64 fails at runtime unless `--platform` said so at build time.
- **Destructive, never run unprompted:** `docker compose down -v` deletes the
  stack's named volumes, and `docker system prune -a` removes every image not
  backing a running container. Neither is a cleanup step; both are a decision.

## Resources

### Skills

None.

### MCP servers

None.
