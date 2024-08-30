//@ts-nocheck

import NodeCache from "node-cache"
import { google } from "googleapis"

const cache = new NodeCache({ stdTTL: 60 * 5 }) // Cache for 5 minutes by default
async function getLastModifiedTime(sheetId: string, oauth2Client: any): Promise<string | null> {
  try {
    const drive = google.drive({ version: "v3", auth: oauth2Client })
    const response = await drive.files.get({
      fileId: sheetId,
      fields: "modifiedTime",
    })
    return response.data.modifiedTime || null
  } catch (error) {
    console.error("Error fetching last modified time:", error)
    return null
  }
}
async function fetchSheetColumns(
  sheetId: string,
  tabName: string,
  oauth2Client: any
): Promise<string[]> {
  try {
    const sheets = google.sheets({ version: "v4", auth: oauth2Client })
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${tabName}!1:1`,
    })
    return response.data.values?.[0] || []
  } catch (error) {
    console.error(`Error fetching columns for tab "${tabName}":`, error)
    return []
  }
}

// Function to fetch the tabs (sheet names) from the spreadsheet
async function fetchSheetTabs(sheetId: string, oauth2Client: any): Promise<string[]> {
  const sheets = google.sheets({ version: "v4", auth: oauth2Client })
  const response = await sheets.spreadsheets.get({
    spreadsheetId: sheetId,
  })

  return response.data.sheets?.map((sheet) => sheet.properties?.title) || []
}

export async function getCachedSheetColumns(
  sheetId: string,
  tabName: string,
  oauth2Client: any
): Promise<string[]> {
  const cacheKey = `sheet-${sheetId}-${tabName}-columns`
  const cachedData = cache.get<{ columns: string[]; lastModifiedTime: string }>(cacheKey)

  const lastModifiedTime = await getLastModifiedTime(sheetId, oauth2Client)
  console.log(`Last Modified Time for ${cacheKey}:`, lastModifiedTime)

  if (cachedData) {
    console.log(`Cached Last Modified Time for ${cacheKey}:`, cachedData.lastModifiedTime)
  }

  if (cachedData && cachedData.lastModifiedTime === lastModifiedTime) {
    console.log("Cache hit for:", cacheKey)
    return cachedData.columns
  }

  console.log("Cache miss, fetching new data for:", cacheKey)

  // Fetch fresh data and cache it
  const columns = await fetchSheetColumns(sheetId, tabName, oauth2Client)
  cache.set(cacheKey, { columns, lastModifiedTime })

  return columns
}

// Function to get cached sheet tabs (sheet names)
export async function getCachedSheetTabs(sheetId: string, oauth2Client: any): Promise<string[]> {
  const cacheKey = `sheet-${sheetId}-tabs`
  const cachedData = cache.get<{ tabs: string[]; lastModifiedTime: string }>(cacheKey)

  const lastModifiedTime = await getLastModifiedTime(sheetId, oauth2Client)

  if (cachedData && cachedData.lastModifiedTime === lastModifiedTime) {
    // Return cached tabs if they haven't changed
    return cachedData.tabs
  }

  // Fetch fresh tabs and cache them
  const tabs = await fetchSheetTabs(sheetId, oauth2Client)
  cache.set(cacheKey, { tabs, lastModifiedTime })

  return tabs
}

// Function to get cached sheet data (all columns of the first sheet)
export async function getCachedSheetData(sheetId: string, oauth2Client: any): Promise<string[]> {
  const cacheKey = `sheet-${sheetId}-data`
  const cachedData = cache.get<{ columns: string[]; lastModifiedTime: string }>(cacheKey)

  const lastModifiedTime = await getLastModifiedTime(sheetId, oauth2Client)

  if (cachedData && cachedData.lastModifiedTime === lastModifiedTime) {
    // Return cached data if it hasn't changed
    return cachedData.columns
  }

  // Fetch fresh data and cache it
  const columns = await fetchSheetColumns(sheetId, "Sheet1", oauth2Client) // Assumes "Sheet1" is the first sheet
  cache.set(cacheKey, { columns, lastModifiedTime })

  return columns
}
