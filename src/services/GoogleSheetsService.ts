import Papa from 'papaparse';

export interface ExpenseRow {
    ID: string;
    Fecha: string; // ISO Date String
    Gasto: number;
    Dueño: string;
    Categoría: string;
    Descipcion: string;
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
    static async fetchExpenses(spreadsheetId: string, sheetName: string): Promise<ExpenseRow[]> {
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
                            .filter((row: any) => row.ID && row.Fecha) // Filter out empty validation rows
                            .map((row: any) => {
                                // Ensure proper numeric conversion
                                let gastoRaw = row.Gasto;
                                if (typeof gastoRaw === 'string') {
                                    gastoRaw = gastoRaw.replace(/[^0-9.-]+/g, ""); // strip non-numeric (e.g., $ signs)
                                }

                                return {
                                    ID: String(row.ID || '').trim(),
                                    Fecha: String(row.Fecha || '').trim(),
                                    Gasto: parseFloat(gastoRaw) || 0,
                                    Dueño: String(row.Dueño || '').trim(),
                                    Categoría: String(row.Categoría || '').trim(),
                                    Descipcion: String(row.Descipcion || '').trim()
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
