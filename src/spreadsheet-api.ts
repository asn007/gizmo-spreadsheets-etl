import fs from 'fs'
import { google } from 'googleapis';
import { error } from './lib/logger.js';
import got from 'got'
import { UnwrapPromise } from './lib/unwrap-promise';


const createSpreadsheetApi = async (authFile: string, spreadsheetId) => {
  const authDescriptor = require(authFile)

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: authDescriptor.client_email,
      client_id: authDescriptor.client_id,
      private_key: authDescriptor.private_key.replace(/\\n/g, "\n")
    },
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/spreadsheets'
    ]
  })

  const sheets = google.sheets({
    auth,
    version: 'v4'
  })

  try {
    await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    })
  } catch (e) {
    error(`failed to find spreadsheet`, spreadsheetId, e)
    process.exit(1)
  }

  return sheets
}

export type SpreadsheetApi = UnwrapPromise<ReturnType<typeof createSpreadsheetApi>>

export default createSpreadsheetApi
