FROM node:18-alpine

RUN groupadd --gid 1000 runner \
    && useradd --uid 1000 --gid runner --shell /bin/false --create-home runner

WORKDIR /tmp/run
USER runner