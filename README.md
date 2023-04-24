# pptraas

Puppeteer, exposed as a web service. Built with [Nixpacks](https://nixpacks.com/).

## Introduction

Setting up a service that integrates with Puppeteer is quite a challenge. For example:

- System dependencies
- Fonts (does it render text in language X properly?)
- Emojis
- Font smoothing

This project aims to solve these issues, expose a simple API, and package all of that into a Docker image that you can deploy into serverless container platforms (like [Google Cloud Run](https://cloud.google.com/run/) or [Azure Container Apps](https://azure.microsoft.com/en-us/pricing/details/container-apps/)) or just run on your own server.

## Building image

```bash
bin/build
```

## Running the image

```bash
bin/run
```
