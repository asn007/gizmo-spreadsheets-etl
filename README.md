# Gizmo ETL to Google Spreadsheets

## Introduction

1. First, create an empty spreadsheet where the ETL will work (or several, if you need several reports)
2. Create a Google Cloud IAM account with access to Drive and Spreadsheets. Download the credentials JSON file, you will need it
3. Add the email you got to the Google Spreadsheet

Then, the setup diverges

If you want to run it as a node js application, you will need Node at least v14 and Yarn v1:

1. Clone the repository
2. Run `yarn`
3. Run `yarn build`
4. Run `yarn start --report REPORTNAME --arg "DateFrom=YYYY-MM-DD HH:MM" --arg "DateTo=YYYY-MM-DD HH:MM" --spreadsheet GOOGLE_SPREADSHEET_ID`, providing the necessary environment parameters as well

If you want to run it as Docker container:

1. Create an empty .env file, fill it with ENV variables needed for startup
2. Run `docker run --env-file .env -v /home/path/to/credentials.json:/path/in/env/file.json asn007/gizmo-spreadsheets-etl:latest yarn start --report REPORTNAME --arg "DateFrom=YYYY-MM-DD HH:MM" --arg "DateTo=YYYY-MM-DD HH:MM" --spreadsheet GOOGLE_SPREADSHEET_ID`

## Environment variables

* `GIZMO_USERNAME` - the username to your Gizmo account. For example, `admin`
* `GIZMO_PASSWORD` - the password to your Gizmo account. For example, `admin`
* `GIZMO_URL` - the URL of Gizmo API root, without `/api/` postfix. Aka the page where you download the client, manager, etc. For example `192.168.88.32:3000`
* `GOOGLE_CREDENTIALS_FILE` - the absolute file path to your Google credentials json file, including its name. For example `/opt/credentials.json`. **NB**: if you're operating in a container - this is the path where your file is mounted
* `DEBUG` – set the value to `gizmo-exporter` to output debug logs

## Cmd flags

* `--report` – **REQUIRED** the report type. For now only `OverviewReport` is supported
* `--spreadsheet` – **REQUIRED** the identifier of the spreadsheet you're writing to
* `--arg "string"` – sets the query parameters to the report. At least `--arg "DateFrom=YYYY-MM-DD HH:MM"` and `--arg "DateTo=YYYY-MM-DD HH:MM"` are required - these are the dates between which the report will be built in Gizmo
