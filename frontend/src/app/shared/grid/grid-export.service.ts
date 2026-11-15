import { Injectable } from '@angular/core';
import { GridColumn, GridValue } from './grid.models';
export interface GridExportSheet<T> {
    readonly name: string;
    readonly rows: readonly T[];
    readonly columns: readonly GridColumn<T>[];
    readonly columnIds: readonly string[];
}
export const browserExportLimits = { rows: 20000, cells: 200000, textCharacters: 10000000, sheets: 10 } as const;
/** Quoted Excel-viewing CSV guard; consumers must prefer typed XLSX for spreadsheet exchange. */
export function safeCsvText(value: string): string { const normalized = value.normalize('NFKC'); return /^[\s\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\ufeff]*[=+\-@]/u.test(normalized) || /^[\t\r\n]/.test(value) ? '\t\'' + value : value; }
export function exportFilename(value: string, extension: 'csv' | 'xlsx'): string { let name = value.replace(/\.(csv|xlsx)$/i, '').replace(/[^\p{L}\p{N}._ -]/gu, '_').replace(/^\.+/, '').slice(0, 100).trim() || 'export'; if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(name))
    name = 'export-' + name; return name + '.' + extension; }
function scalar(value: GridValue): string | number | boolean | Date | null { if (value == null)
    return null; if (value instanceof Date) {
    if (!Number.isFinite(value.getTime()))
        throw new Error('Invalid export date');
    return value;
} if (typeof value === 'number') {
    if (!Number.isFinite(value))
        throw new Error('Invalid export number');
    return value;
} if (typeof value === 'string') {
    if (value.length > 32767)
        throw new Error('Export text exceeds spreadsheet limits');
    return value;
} if (typeof value === 'boolean')
    return value; throw new Error('Unsupported spreadsheet value'); }
function allowedColumns<T>(sheet: GridExportSheet<T>): readonly GridColumn<T>[] { if (!sheet.columnIds.length || new Set(sheet.columnIds).size !== sheet.columnIds.length)
    throw new Error('Choose distinct permitted export columns'); return sheet.columnIds.map(id => { const column = sheet.columns.find(column => column.id === id && column.export?.allowed); if (!column)
    throw new Error('Export column is not permitted'); return column; }); }
/** ExcelJS ships a CommonJS browser bundle; normalize its dynamic-import default interop. */
export async function loadExcelJS(): Promise<typeof import('exceljs')> { const loaded = await import('exceljs') as typeof import('exceljs') & {
    default?: typeof import('exceljs');
}; const library = loaded.Workbook ? loaded : loaded.default; if (!library?.Workbook)
    throw new Error('Spreadsheet writer unavailable'); return library; }
@Injectable({ providedIn: 'root' })
export class GridExportService {
    private prepare<T>(sheets: readonly GridExportSheet<T>[]): {
        name: string;
        columns: readonly GridColumn<T>[];
        values: (string | number | boolean | Date | null)[][];
    }[] { let rows = 0, cells = 0, text = 0; if (!sheets.length || sheets.length > browserExportLimits.sheets)
        throw new Error('Invalid export sheet count'); return sheets.map(sheet => { const columns = allowedColumns(sheet); for (const column of columns) {
        if (typeof column.header !== 'string' || column.header.length > 32767)
            throw new Error('Invalid export header');
        text += column.header.length;
    } rows += sheet.rows.length; cells += (sheet.rows.length + 1) * columns.length; if (rows > browserExportLimits.rows || cells > browserExportLimits.cells)
        throw new Error('Use a backend export job for this dataset'); const values = sheet.rows.map(row => columns.map(column => { const value = scalar((column.export?.value ?? column.value)(row)); if (typeof value === 'string')
        text += value.length; if (text > browserExportLimits.textCharacters)
        throw new Error('Export exceeds the browser text limit'); return value; })); return { name: sheet.name, columns, values }; }); }
    csv<T>(sheet: GridExportSheet<T>): Blob { const data = this.prepare([sheet])[0]; const encode = (value: GridValue): string => { const text = value instanceof Date ? value.toISOString() : String(value ?? ''); return '"' + (typeof value === 'number' ? text : safeCsvText(text)).replace(/"/g, '""') + '"'; }; const rows = [data.columns.map(column => column.header), ...data.values]; return new Blob(['\ufeff' + rows.map(row => row.map(encode).join(',')).join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8' }); }
    async xlsx<T>(sheets: readonly GridExportSheet<T>[]): Promise<Blob> { const data = this.prepare(sheets); const { Workbook } = await loadExcelJS(); const workbook = new Workbook(); const names = new Set<string>(); for (const [index, sheet] of data.entries()) {
        let name = sheet.name.replace(/[\[\]:*?\/\\]/g, '_').replace(/^'+|'+$/g, '').slice(0, 31) || 'Sheet' + (index + 1);
        const base = name;
        let suffix = 2;
        while (names.has(name.toLowerCase()))
            name = base.slice(0, 26) + '-' + suffix++;
        names.add(name.toLowerCase());
        const worksheet = workbook.addWorksheet(name);
        worksheet.addRow(sheet.columns.map(column => column.header));
        worksheet.getRow(1).font = { bold: true };
        sheet.columns.forEach((column, index) => { worksheet.getColumn(index + 1).width = Math.min(45, Math.max(14, column.header.length + 2)); if (column.kind === 'number')
            worksheet.getColumn(index + 1).numFmt = column.export?.numberFormat ?? '0.00'; if (column.kind === 'date')
            worksheet.getColumn(index + 1).numFmt = column.export?.numberFormat ?? 'yyyy-mm-dd'; });
        for (const values of sheet.values)
            worksheet.addRow(values);
        worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    } const bytes = new Uint8Array(await workbook.xlsx.writeBuffer()); return new Blob([bytes.buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); }
    download(blob: Blob, filename: string): void { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
}
