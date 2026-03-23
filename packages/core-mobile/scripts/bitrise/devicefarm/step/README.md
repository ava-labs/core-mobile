# Bitrise step: AWS Device Farm upload & schedule

This folder is a **Bitrise path step** (`path::./packages/core-mobile/scripts/bitrise/devicefarm/step`) used by `android-internal-e2e-aws-regression-run`.

**Do not add** the marketplace step **Amazon Device Farm File Deploy** (`peartherapeutics/bitrise-aws-device-farm-file-deploy`): it is unmaintained and defaults to non-standard env names (`AWS_ACCESS_KEY` / `AWS_SECRET_KEY` instead of `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`).

## What it runs

`step.sh` → `../androidDeviceFarmRegression.sh` → `yarn devicefarm:package` → `node scripts/devicefarm/trigger-devicefarm-api.js`

## Workflow snippet

```yaml
- path::./packages/core-mobile/scripts/bitrise/devicefarm/step:
    title: AWS Device Farm — upload & schedule run
    no_output_timeout: 1800
```

## Outputs (Bitrise)

On success, `trigger-devicefarm-api.js` registers via `envman`:

- `DEVICEFARM_RUN_ARN`
- `DEVICEFARM_RUN_URL`

Use these in later steps (e.g. Slack) with `$DEVICEFARM_RUN_URL`.
