# screenshotter

A Google Cloud Function (gen 2) that runs a Puppeteer script and takes a screenshot of a webpage.

## How to deploy

Before the first deployment, you have to set up some settings in the shell.

<details><summary>Shell setup</summary>

```sh
gcloud config set project $PROJECT_ID
gcloud config set functions/region asia-northeast1
```

</details>

Then this command will deploy the function.

```sh
gcloud beta functions deploy screenshotter --gen2 \
  --runtime=nodejs16 --memory=512MB \
  --trigger-http --entry-point=screenshotter \
  --source=.
```
