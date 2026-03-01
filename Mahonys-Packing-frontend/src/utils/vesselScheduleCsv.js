/**
 * Parse vessel schedule CSV (vs*.csv format).
 * Columns: UN Loc Code, Terminal ID, ETA, ETD, Ship Name, Ship Operator Voyage Out,
 * Lloyds ID, Cargo Cutoff Date, Reefer Cutoff Date, ..., Export Receival Commencement Date,
 * ..., First Free Import Date
 */
function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === "," && !inQuotes) || (c === "\n" && !inQuotes)) {
      result.push(current.trim());
      current = "";
      if (c === "\n") break;
    } else {
      current += c;
    }
  }
  if (current !== "" || result.length > 0) result.push(current.trim());
  return result;
}

/** Format "20260212 2330" to "2026-02-12 23:30" for display/storage */
export function formatVesselDateTime(str) {
  if (!str || typeof str !== "string") return "";
  const s = str.trim().replace(/\s+/, " ");
  if (/^\d{8}\s+\d{4}$/.test(s)) {
    const date = s.slice(0, 8);
    const time = s.slice(9, 13);
    return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)} ${time.slice(0, 2)}:${time.slice(2, 4)}`;
  }
  return str;
}

/** Parse "20260212 2330" to ISO date-only for date inputs */
export function vesselDateTimeToDateOnly(str) {
  if (!str || typeof str !== "string") return "";
  const s = str.trim().replace(/\s+/, " ").slice(0, 8);
  if (s.length === 8)
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  return "";
}

export function parseVesselScheduleCsv(csvText) {
  if (!csvText || typeof csvText !== "string") return [];
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = parseCsvLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row = {};
    header.forEach((h, idx) => {
      const key = h.trim();
      row[key] = values[idx] !== undefined ? String(values[idx]).trim() : "";
    });
    const shipName = row["Ship Name"] || "";
    if (!shipName) continue;
    rows.push({
      unLocCode: row["UN Loc Code"] || "",
      terminalId: row["Terminal ID"] || "",
      eta: row["ETA"] || "",
      etd: row["ETD"] || "",
      shipName,
      voyageOut: row["Ship Operator Voyage Out"] || "",
      lloydsId: (row["Lloyds ID"] || "").replace(/^\./, ""),
      cargoCutoffDate: row["Cargo Cutoff Date"] || "",
      reeferCutoffDate: row["Reefer Cutoff Date"] || "",
      exportReceivalCommencementDate: row["Export Receival Commencement Date"] || "",
      firstFreeImportDate: row["First Free Import Date"] || "",
      operators: row["Operators"] || "",
      vesselCode: row["Vessel Code"] || "",
    });
  }
  return rows;
}
