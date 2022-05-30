import createSpreadsheetApi from './spreadsheet-api'
import createGizmoService, { reportMethods } from './lib/gizmo'
import createGizmoServiceCreator, { ReportType } from './lib/gizmo'
import { log, debug, error } from './lib/logger'
import reportTemplates from './report-builder'
import { info } from 'console'

type AppConfig = {
  'report': ReportType
}

const startupEnvVariables = [
  'GIZMO_USERNAME',
  'GIZMO_PASSWORD',
  'GIZMO_URL',
  'GOOGLE_CREDENTIALS_FILE'
]

const main = async () => {
  debug('started initialization')
  const parsedArgs = process.argv.slice(2).reduce((acc, currentValue, currentIndex, arr) => {
    const isArgName = !(currentIndex % 2) && currentValue.startsWith('--')
    const argName = isArgName ? currentValue.substring(2) : arr[currentIndex - 1].substring(2)
    if (isArgName) {
      if (acc[argName]) acc[argName] = [acc[argName]]
      else acc[argName] = true
      return acc
    }
    if (Array.isArray(acc[argName]))
      acc[argName].push(currentValue)
    else
      acc[argName] = currentValue
    return acc
  }, {} as any);
  debug('got parameters', parsedArgs)
  debug('environment sanity check')
  startupEnvVariables.forEach(envVar => {
    if (process.env[envVar]) return
    error(`env ${envVar} is not set`)
    process.exit(1)
  })

  const gizmo = createGizmoService({
    username: process.env.GIZMO_USERNAME!,
    password: process.env.GIZMO_PASSWORD!,
    url: process.env.GIZMO_URL!
  })

  if (!parsedArgs.hasOwnProperty('report')) {
    error('--report is not set')
    process.exit(1)
  }

  if (!Object.keys(reportMethods).includes(parsedArgs['report'])) {
    error(`--report ${parsedArgs['report']} is not in available methods: ${Object.keys(reportMethods).join(', ')}`)
    process.exit(1)
  }

  if (!parsedArgs['arg'] || !Array.isArray(parsedArgs['arg']) || parsedArgs['arg'].length < 2) {
    error('insufficient request args provided, at least DateFrom and DateTo are required')
    process.exit(1)
  }

  const requestArgs = (parsedArgs['arg'] as string[]).reduce((acc, value) => {
    const [ k, v ] = value.split('=')
    acc[k] = v
    return acc
  }, {})

  if (!requestArgs['DateFrom']) {
    error('DateFrom arg is missing')
    process.exit(1)
  }

  if (!requestArgs['DateTo']) {
    error('DateTo arg is missing')
    process.exit(1)
  }

  debug('setting up spreadsheet api')

  if (!parsedArgs['spreadsheet'] || parsedArgs['spreadsheet'] === true) {
    error('spreadsheet is not specified')
    process.exit(1)
  }

  const spreadsheetApi = await createSpreadsheetApi(process.env.GOOGLE_CREDENTIALS_FILE!, parsedArgs['spreadsheet'])

  debug('args', requestArgs)
  log(`querying report ${parsedArgs['report']}, args ${parsedArgs['arg'].join(', ')}`)
  const reportResult = await gizmo.getReport(parsedArgs['report'], requestArgs)
  debug('report', reportResult)
  info('uploading report to spreadsheet')
  await reportTemplates[parsedArgs['report'] as ReportType](spreadsheetApi, parsedArgs['spreadsheet'], reportResult)
}

main()
