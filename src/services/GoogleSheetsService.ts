import Papa from 'papaparse';
import type { HeaderMap } from '../context/SettingsContext';

export interface ExpenseRow {
    ID: string;
    Fecha: string; // ISO Date String
    Gasto: number;
    Dueño: string;
    Categoría: string;
    Descipcion: string;
}

export interface TabConfig {
    id: string;
    name: string;
    sheetName: string;
    currency: string;
    headerMap: HeaderMap;
    customLocalRate?: number;
}

export interface SpreadsheetSettings {
    sheetUrl: string;
    localCurrency: string;
    startDay: number;
    tabs: TabConfig[];
}

export class GoogleSheetsService {

    /**
     * Extracts the Spreadsheet ID from a Google Sheets URL
     */
    static extractSpreadsheetId(url: string): string | null {
        try {
            // Matches /d/SPREADSHEET_ID/
            const regex = /\/d\/([a-zA-Z0-9-_]+)/;
            const match = url.match(regex);
            return match ? match[1] : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Fetches data from a specific sheet in the Google Spreadsheet
     * User's sheet must be shared as "Anyone with the link can view".
     */
    static async fetchExpenses(spreadsheetId: string, sheetName: string, headers: HeaderMap): Promise<ExpenseRow[]> {
        if (!spreadsheetId) {
            throw new Error("Invalid Spreadsheet ID");
        }

        // Export endpoint for CSV
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;

        try {
            const response = await fetch(csvUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch sheet: ${response.statusText}`);
            }

            const csvText = await response.text();

            return new Promise((resolve, reject) => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        // Clean up parsing issues, standardize numbers
                        const parsedData = results.data
                            .filter((row: any) => row[headers.id] && row[headers.date]) // Filter out empty validation rows
                            .map((row: any) => {
                                // Ensure proper numeric conversion
                                let gastoRaw = row[headers.amount];
                                if (typeof gastoRaw === 'string') {
                                    // Remove spaces and currency symbols first
                                    gastoRaw = gastoRaw.replace(/[^0-9.,-]+/g, "");

                                    // If we have both dot and comma (e.g. 1.234,56 or 1,234.56)
                                    if (gastoRaw.includes('.') && gastoRaw.includes(',')) {
                                        const lastDot = gastoRaw.lastIndexOf('.');
                                        const lastComma = gastoRaw.lastIndexOf(',');
                                        if (lastComma > lastDot) {
                                            // Format like 1.234,56 -> remove dots, change comma to dot
                                            gastoRaw = gastoRaw.replace(/\./g, '').replace(',', '.');
                                        } else {
                                            // Format like 1,234.56 -> remove commas
                                            gastoRaw = gastoRaw.replace(/,/g, '');
                                        }
                                    } else if (gastoRaw.includes(',')) {
                                        // Only comma, treat as decimal (e.g. 23,8)
                                        // But if there are multiple commas (e.g. 1,234,567), we should remove them
                                        const commaCount = (gastoRaw.match(/,/g) || []).length;
                                        if (commaCount === 1) {
                                            gastoRaw = gastoRaw.replace(',', '.');
                                        } else {
                                            gastoRaw = gastoRaw.replace(/,/g, '');
                                        }
                                    }
                                }

                                return {
                                    ID: String(row[headers.id] || '').trim(),
                                    Fecha: String(row[headers.date] || '').trim(),
                                    Gasto: parseFloat(gastoRaw) || 0,
                                    Dueño: String(row[headers.owner] || '').trim(),
                                    Categoría: String(row[headers.category] || '').trim(),
                                    Descipcion: String(row[headers.description] || '').trim()
                                };
                            });
                        resolve(parsedData);
                    },
                    error: (error: Error) => {
                        reject(error);
                    }
                });
            });
        } catch (error) {
            console.error("Error fetching Google Sheet:", error);
            throw error;
        }
    }
}
