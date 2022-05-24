# screenshotter

A Google Cloud Function (gen 2) that runs a Puppeteer script and takes a screenshot of a webpage.

## How to deploy

Before the first deployment, some settings has to be configured in the shell.

```sh
gcloud config set project $PROJECT_ID
gcloud config set functions/region asia-northeast1
```

Then this command will deploy the function.

```sh
gcloud beta functions deploy screenshotter --gen2 \
  --runtime=nodejs16 --memory=512MB \
  --trigger-http --entry-point=screenshotter \
  --source=.
```

## Usage

```sh
SERVICE_URI=$(gcloud beta functions describe screenshotter --gen2 --format=json | jq -r '.serviceConfig.uri')
ID_TOKEN=$(gcloud auth print-identity-token)
curl -X POST -H "Authorization: Bearer $ID_TOKEN" -H "Content-Type: application/json" \
  -d '{"code":"(async ()=>{await page.setViewport({width:1280,height:720});await page.goto(\"https://www.example.com\")})()"}' \
  -o /tmp/output.png \
  $SERVICE_URI
```

## Differences from [personal-puppeteer](https://github.com/dtinth/personal-puppeteer)

| `personal-puppeteer`                                               | `screenshotter`                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------ |
| Deployed to Vercel                                                 | Deployed to Google Cloud Functions                           |
| Generates a public, signed URL that can be used as an image source | No public endpoint; only authenticated requests are accepted |
| Result is cached by Vercel’s CDN                                   | No caching                                                   |
| Accepts a URL and options                                          | Accepts raw JavaScript code                                  |
