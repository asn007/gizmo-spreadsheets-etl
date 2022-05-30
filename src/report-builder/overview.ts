import { UnwrapPromise } from "../lib/unwrap-promise";
import { ReportTypes, ReportType, convertGizmoHoursAndMinutesToMinutes } from "../lib/gizmo";
import { SpreadsheetApi } from "../spreadsheet-api";
import { ReportHandler } from "./index";
import { log } from "../lib/logger";
import { parse as parseDate, format as formatDate } from 'date-fns'

const preCreateSheetIfMissing = async (
  spreadsheetApi: SpreadsheetApi,
  spreadsheetId: string,
  sheetName: string,
  header: any[]
) => {
  const spreadsheet = await spreadsheetApi.spreadsheets.get({
    spreadsheetId,
  })
  if (!(
    spreadsheet.data.sheets &&
    spreadsheet.data.sheets.find(sheet =>
        sheet.properties &&
        sheet.properties.title &&
        sheet.properties.title === sheetName))) {
    log(`creating ${sheetName} sheet in spreadsheets`)
    await spreadsheetApi.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: sheetName,
              sheetType: 'GRID',
            }
          }
        }]
      }
    })
    await spreadsheetApi.spreadsheets.values.append({
      spreadsheetId,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',

      range: `${sheetName}!A1`,
      requestBody: {
        values: [header]
      }
    })
  }
}

const fillUtilizationSheet = async (
  spreadsheetApi: SpreadsheetApi,
  spreadsheetId: string,
  report: ReportTypes['OverviewReport']['response']['utilizationChart']
) => {
  await preCreateSheetIfMissing(spreadsheetApi, spreadsheetId, 'Utilization',           [
    'Date',
    'Utilization %',
    'Total seconds available',
    'Used seconds'
  ])
  await spreadsheetApi.spreadsheets.values.append({
    spreadsheetId,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    range: 'Utilization!A1',
    requestBody: {
      values: report.map(x => ([
        formatDate(parseDate(x.name, 'M/d/yyyy', 0), 'dd.MM.yyyy'),
        x.value.toFixed(2).replace('.', ','),
        x.totalSeconds,
        x.usedSeconds
      ]))
    }
  })
}

const fillOperatorSheet = async(
  spreadsheetApi: SpreadsheetApi,
  spreadsheetId: string,
  report: ReportTypes['OverviewReport']['response']['operatorsStatistics'],
  dateFrom: string,
  dateTo: string
) => {
  await preCreateSheetIfMissing(spreadsheetApi, spreadsheetId, 'Operators', [
    'Date From',
    'Date To',
    'Operator ID',
    'Operator Name',
    'Minutes worked',
    'Hours worked in minutes',
    'Minutes sold',
    'Hours sold in minutes',
    'Products sold',
    'Time offers sold',
    'Bundles sold',
    'Voids',
    'Register transactions total',
    'Revenue'
  ])
  await spreadsheetApi.spreadsheets.values.append({
    spreadsheetId,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    range: 'Operators!A1',
    requestBody: {
      values: report.map(x => ([
        formatDate(parseDate(dateFrom.split('T')[0], 'yyyy-MM-dd', 0), 'dd.MM.yyyy'),
        formatDate(parseDate(dateTo.split('T')[0], 'yyyy-MM-dd', 0), 'dd.MM.yyyy'),
        x.operatorId,
        x.operatorName,
        x.minutesWorked,
        convertGizmoHoursAndMinutesToMinutes(x.hoursWorked),
        x.minutesSold,
        convertGizmoHoursAndMinutesToMinutes(x.hoursSold),
        x.productsSold,
        x.timeOffersSold,
        x.bundlesSold,
        x.voids,
        x.registerTransactionsTotal,
        x.revenue
      ]))
    }
  })
}

const fillMainSheet = async (
  spreadsheetApi: SpreadsheetApi,
  spreadsheetId: string,
  report: ReportTypes['OverviewReport']['response'],
) => {
  await preCreateSheetIfMissing(spreadsheetApi, spreadsheetId, 'Main', [
    'Date From',
    'Date To',
    'Average member usage period in minutes',
    'Average guest usage period in hours',
    'Average utilization %',
    'Unique member logins',
    'Unique guest logins',
    'New members',
    'Total members',
    'Banned members',
    'Total pay in out',
    'Total revenue',
    'Average revenue per member',
    'Average revenue per guest',
  ])
  await spreadsheetApi.spreadsheets.values.append({
    spreadsheetId,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    range: 'Main!A1',
    requestBody: {
      values: [[
        formatDate(parseDate(report.dateFrom.split('T')[0], 'yyyy-MM-dd', 0), 'dd.MM.yyyy'),
        formatDate(parseDate(report.dateTo.split('T')[0], 'yyyy-MM-dd', 0), 'dd.MM.yyyy'),
        convertGizmoHoursAndMinutesToMinutes(report.averageMemberUsagePeriodMinutes),
        convertGizmoHoursAndMinutesToMinutes(report.averageGuestUsagePeriodMinutes),
        report.averageUtilizationPercentage.toFixed(2).replace('.', ','),
        report.uniqueMembersLogins,
        report.uniqueGuestsLogins,
        report.memberCounters.newMembers,
        report.memberCounters.totalMembers,
        report.memberCounters.bannedMembers,
        report.totalPayInOut,
        report.totalRevenue,
        report.averageRevenuePerMember.toFixed(2).replace('.', ','),
        report.averageRevenuePerGuest.toFixed(2).replace('.', ',')
      ]]
    }
  })
}

const fillFinancialSheet = async (
  spreadsheetApi: SpreadsheetApi,
  spreadsheetId: string,
  report: ReportTypes['OverviewReport']['response']['financialChart'],
) => {
  await preCreateSheetIfMissing(spreadsheetApi, spreadsheetId, 'Financial', [
    'Date',
    'Value',
  ])

  await spreadsheetApi.spreadsheets.values.append({
    spreadsheetId,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    range: 'Financial!A1',
    requestBody: {
      values: report.map(x => ([
        formatDate(parseDate(x.name, 'M/d/yyyy', 0), 'dd.MM.yyyy'),
        x.value.toFixed(2).replace('.', ',')
      ]))
    }
  })
}

const fillRevenuePerGroupSheet = async (
  spreadsheetApi: SpreadsheetApi,
  spreadsheetId: string,
  report: ReportTypes['OverviewReport']['response']['revenuePerGroup'],
  dateFrom: string,
  dateTo: string
) => {
  await preCreateSheetIfMissing(spreadsheetApi, spreadsheetId, 'RevenuePerGroup', [
    'Date From',
    'Date To',
    'Name',
    'Value',
  ])

  await spreadsheetApi.spreadsheets.values.append({
    spreadsheetId,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    range: 'RevenuePerGroup!A1',
    requestBody: {
      values: report.map(x => ([
        formatDate(parseDate(dateFrom.split('T')[0], 'yyyy-MM-dd', 0), 'dd.MM.yyyy'),
        formatDate(parseDate(dateTo.split('T')[0], 'yyyy-MM-dd', 0), 'dd.MM.yyyy'),
        x.name,
        x.value.toFixed(2).replace('.', ',')
      ]))
    }
  })
}

const buildReport: ReportHandler<'OverviewReport'> = async (
  spreadsheetApi,
  spreadsheetId,
  report
) => {
  await fillMainSheet(spreadsheetApi, spreadsheetId, report)
  await fillFinancialSheet(spreadsheetApi, spreadsheetId, report.financialChart)
  await fillRevenuePerGroupSheet(spreadsheetApi, spreadsheetId, report.revenuePerGroup, report.dateFrom, report.dateTo)
  await fillUtilizationSheet(spreadsheetApi, spreadsheetId, report.utilizationChart)
  await fillOperatorSheet(
    spreadsheetApi,
    spreadsheetId,
    report.operatorsStatistics,
    report.dateFrom,
    report.dateTo
  )
}

export default buildReport
