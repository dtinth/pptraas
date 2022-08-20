# screenshotter

A Google Cloud Function (gen 2) service that runs a Puppeteer script and takes a screenshot of a webpage.

## How to deploy

Before the first deployment, some settings has to be configured in the shell.

```sh
gcloud config set project $PROJECT_ID
```

Then this command will deploy the function.

```sh
gcloud beta functions deploy screenshotter --region=asia-northeast1 --gen2 \
  --runtime=nodejs16 --memory=512MB \
  --trigger-http --entry-point=screenshotter \
  --source=.
```

## Usage

You have to [make an authenticated request to the function](https://cloud.google.com/functions/docs/securing/authenticating), passing these 2 parameters in the JSON POST body:

- `code` The code of the Puppeteer script to run.
- `type` The output format, `png` or `jpeg`.

Here is an example of invoking the function from a shell script:

```sh
# Obtain the URL to the deployed function
SERVICE_URI=$(gcloud beta functions describe screenshotter --gen2 --format=json | jq -r '.serviceConfig.uri')

# Obtain the ID token required to invoke the function
ID_TOKEN=$(gcloud auth print-identity-token)

# Invoke the function
curl -X POST -H "Authorization: Bearer $ID_TOKEN" -H "Content-Type: application/json" \
  -d '{"code":"(async ()=>{await page.setViewport({width:1280,height:720});await page.goto(\"https://www.example.com\")})()"}' \
  -o output.png \
  $SERVICE_URI
```

## Differences from [personal-puppeteer](https://github.com/dtinth/personal-puppeteer)

| `personal-puppeteer`                                               | `screenshotter`                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------ |
| Deployed to Vercel                                                 | Deployed to Google Cloud Functions                           |
| Generates a public, signed URL that can be used as an image source | No public endpoint; only authenticated requests are accepted |
| Result is cached by Vercel’s CDN                                   | No caching                                                   |
| Accepts a URL and options                                          | Accepts raw JavaScript code                                  |

## Development

Build a Docker image using the same builder as Google Cloud Functions.

```sh
pack build screenshotter --builder asia-northeast1-docker.pkg.dev/gae-runtimes/gcp/buildpacks/nodejs/builder:nodejs16_20220809_16_16_0_RC00 --env GOOGLE_FUNCTION_TARGET=screenshotter
```

> **Note**
> Check the Google Cloud Build logs to obtain the latest builder image. We use that instead of the [general purpose build images provided in `GoogleCloudPlatform/buildpacks`](https://github.com/GoogleCloudPlatform/buildpacks), which unfortunately does not include proper dependencies to run Puppeteer.

Run the screenshotter image locally:

```sh
docker run -ti --rm --init -p 8080:8080 --privileged --name screenshotter -v $PWD/index.js:/workspace/index.js:ro screenshotter
```

Capture some page:

```
mkdir -p .temp && curl -X POST -H "Content-Type: application/json" -d '{"code":"(async ()=>{await page.setViewport({width:1280,height:720});await page.goto(\"https://www.example.com\")})()"}' -o .temp/output.png http://localhost:8080
```
