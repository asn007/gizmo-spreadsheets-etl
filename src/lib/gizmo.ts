import got from 'got'
import { debug } from './logger'
import { UnwrapPromise } from './unwrap-promise'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS' | 'HEAD' | 'PATCH'

type SearchParams = { [x: string]: string | number | boolean | undefined}
type GizmoResponse<T> = { result: T }

type GizmoConfig = {
  username: string
  password: string
  url: string
}

const createGizmoResourceMethod = (config: GizmoConfig) => {
  const apiBase = `http://${config.username}:${config.password}@${config.url}/api/`
  return async <T>(uri = '', method: HttpMethod = 'GET', query?: SearchParams, body?: object): Promise<T> => {
    debug(`gizmo resource ${method} -> ${uri}`, { query: query || {}, body: body || {} })
    const { body: responseBody } = await got<GizmoResponse<T>>(apiBase + uri, {
      method,
      searchParams: query || {},
      json: body,
      responseType: 'json',
      username: config.username,
      password: config.password
    })

    return responseBody.result
  }
}


export const reportMethods = {
  'OverviewReport': 'overview',
  'FinancialReport': 'financial',
  'HostUsageReport': 'hostusage',
  'ShiftsLogReport': 'shiftlog'
}

export type ReportType = keyof typeof reportMethods

export type ReportTypes = {
  OverviewReport: {
    args: DateQueryArgs
    response: {
      dateFrom: string
      dateTo: string
      operatorsStatistics: {
        operatorId: number
        operatorName: string
        minutesWorked: number
        hoursWorked: string
        minutesSold: string
        hoursSold: string
        productsSold: number,
        timeOffersSold: number,
        bundlesSold: number,
        voids: number,
        registerTransactionsTotal: number,
        revenue: number
      }[]
      averageMemberUsagePeriodMinutes: string,
      averageGuestUsagePeriodMinutes: string,
      averageUtilizationPercentage: number,
      uniqueMembersLogins: number,
      uniqueGuestsLogins: number,
      memberCounters: {
        newMembers: number,
        totalMembers: number,
        bannedMembers: number
      },
      utilizationChart: {
          name: string,
          value: 0,
          totalSeconds: 0,
          usedSeconds: 0
      }[]
      financialChart: {
        name: string,
        value: number
      }[]
      totalPayInOut: number,
      totalRevenue: 0,
      averageRevenuePerMember: 0,
      averageRevenuePerGuest: 0,
      revenuePerGroup: {
        name: string
        value: 0
      }[]
    }
  }
  FinancialReport: {
    // FIXME: Only SIMPLE report is now supported
    args: DateQueryArgs & { FinancialReportType: 1 } & Partial<{
      OperatorId: number,
      RegisterId: number
      FinancialReportType: 1
    }>
    response: {
      operatorId: number | null
      operatorName: string | null
      registerId: number | null
      registerName: string | null
      financialReportType: 1
      deposits: {
        createdTime: string
        transactionType: number
        paymentMethodId: number
        paymentMethodName: string
        amount: number
        quantity: number
        total: number
        operatorId: number
        userGroupId: number
        isGuest: boolean
      }[]
      withdrawals: {
        createdTime: string
        transactionType: number
        paymentMethodId: number
        paymentMethodName: string
        amount: number
        quantity: number
        total: number
        operatorId: number
        userGroupId: number
        isGuest: boolean
      }
    }
  }
  HostUsageReport: {
    args: DateQueryArgs
    response: {}
  }
  ShiftsLogReport: {
    args: DateQueryArgs
    response: {}
  }
}

type DateQueryArgs = {
  DateFrom: string,
  DateTo: string
}

const createGizmoService = (config: GizmoConfig) => {
  debug(`initializing Gizmo communication service...`)
  const resource = createGizmoResourceMethod(config)

  const getReport = async <X extends ReportType>(reportId: X, queryArgs: ReportTypes[X]['args']): Promise<ReportTypes[X]['response']> => {
    if (typeof reportMethods[reportId] === 'undefined') throw new Error(`Report ${reportId} is not supported`)
    return resource<ReportTypes[X]>(`reports/${reportMethods[reportId]}`, 'GET', queryArgs)
  }

  return ({
    resource,
    getReport
  })
}

// gizmo uses retarded "xxh yym" format, so we have to convert it to proper minutes
export const convertGizmoHoursAndMinutesToMinutes = (x: string) =>
  x.replace('m', '').split('h ').reduceRight((acc, current) => acc + parseFloat(current) * 60)

export default createGizmoService
