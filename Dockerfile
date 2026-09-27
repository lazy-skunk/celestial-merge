FROM node:lts-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    openssh-client \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ENV VP_HOME=/opt/vite-plus
ENV PATH="${VP_HOME}/bin:${PATH}"

RUN curl -fsSL https://vite.plus | CI=true bash

COPY package*.json ./
RUN vp install --frozen-lockfile
