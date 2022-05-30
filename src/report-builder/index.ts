import { UnwrapPromise } from "../lib/unwrap-promise";
import createSpreadsheetApi from "../spreadsheet-api";
import { ReportType, ReportTypes } from "../lib/gizmo";

import buildOverviewReport from './overview'

export type ReportHandler<T extends ReportType> = (
  spreadsheetApi: UnwrapPromise<ReturnType<typeof createSpreadsheetApi>>,
  spreadsheetId: string,
  report: ReportTypes[T]['response']
) => Promise<void>

type ReportHandlerMapping = Record<ReportType, ReportHandler<ReportType>>

const reportMapping: ReportHandlerMapping = {
  OverviewReport: buildOverviewReport,
  FinancialReport: buildOverviewReport as any,
  HostUsageReport: buildOverviewReport as any,
  ShiftsLogReport: buildOverviewReport as any,
}

export default reportMapping
