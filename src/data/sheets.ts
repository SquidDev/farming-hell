/** Cut down version of https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets */

export type Spreadsheets = {
  sheets: Array<Sheet>,
}

export type Sheet = {
  data: Array<GridData>,
}

export type GridData = {
  rowData: Array<RowData>,
}

export type RowData = {
  values: Array<CellData>,
}

export type CellData = {
  effectiveValue?: { numberValue?: number, stringValue?: string },
  formattedValue?: string,
  hyperlink?: string,
}
