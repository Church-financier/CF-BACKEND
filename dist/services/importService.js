"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseImportFile = parseImportFile;
const exceljs_1 = __importDefault(require("exceljs"));
function parseCsv(text) {
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length === 0)
        return [];
    const headers = splitCsvLine(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const values = splitCsvLine(lines[i]);
        const row = {};
        headers.forEach((header, idx) => {
            row[header] = values[idx] ?? null;
        });
        rows.push(row);
    }
    return rows;
}
function splitCsvLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            }
            else {
                inQuotes = !inQuotes;
            }
        }
        else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
        }
        else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}
async function parseImportFile(buffer, filename) {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "csv" || ext === "tsv") {
        const text = buffer.toString("utf-8");
        return parseCsv(text);
    }
    if (ext === "xlsx" || ext === "xls") {
        const workbook = new exceljs_1.default.Workbook();
        await workbook.xlsx.load(buffer);
        const sheet = workbook.getWorksheet(1);
        if (!sheet)
            return [];
        const rows = [];
        const headerRow = sheet.getRow(1);
        const headers = [];
        headerRow.eachCell((cell) => {
            headers.push(cell.value?.toString().trim() || "");
        });
        for (let i = 2; i <= sheet.rowCount; i++) {
            const row = sheet.getRow(i);
            const values = {};
            let hasData = false;
            headers.forEach((header, idx) => {
                const cell = row.getCell(idx + 1);
                const val = cell.value;
                if (val !== undefined && val !== null && val !== "") {
                    hasData = true;
                    values[header] = typeof val === "object" ? JSON.stringify(val) : String(val);
                }
                else {
                    values[header] = null;
                }
            });
            if (hasData)
                rows.push(values);
        }
        return rows;
    }
    throw new Error(`Unsupported file format: ${ext || "unknown"}`);
}
//# sourceMappingURL=importService.js.map