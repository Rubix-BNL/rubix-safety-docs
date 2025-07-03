"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Artikel } from "@/lib/types";

interface ImportResult {
  success: number;
  errors: Array<{ row: number; error: string; data?: any }>;
  duplicates: Array<{ row: number; unieke_id: string }>;
}

interface ImportRow {
  naam: string;
  unieke_id: string;
  referentie_rubix?: string;
  referentie_fabrikant?: string;
  ean?: string;
}

export default function BulkImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function parseCSV(csvText: string): ImportRow[] {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2)
      throw new Error("CSV moet minstens een header en één data rij hebben");

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    console.log("CSV headers:", headers);

    // Check required columns
    const requiredColumns = ["naam", "unieke_id"];
    const missingColumns = requiredColumns.filter(
      (col) => !headers.some((h) => h.toLowerCase() === col.toLowerCase()),
    );

    if (missingColumns.length > 0) {
      throw new Error(
        `Vereiste kolommen ontbreken: ${missingColumns.join(", ")}`,
      );
    }

    const data: ImportRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const row: any = {};

      headers.forEach((header, index) => {
        const normalizedHeader = header.toLowerCase();
        const value = values[index] || "";

        if (normalizedHeader === "naam") row.naam = value;
        else if (normalizedHeader === "unieke_id") row.unieke_id = value;
        else if (normalizedHeader === "referentie_rubix")
          row.referentie_rubix = value;
        else if (normalizedHeader === "referentie_fabrikant")
          row.referentie_fabrikant = value;
        else if (normalizedHeader === "ean") row.ean = value;
      });

      if (row.naam && row.unieke_id) {
        data.push(row);
      }
    }

    return data;
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      alert("Alleen CSV bestanden zijn toegestaan");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      alert("Bestand mag maximaal 5MB zijn");
      return;
    }

    setSelectedFile(file);
    setImportResult(null);
    setShowPreview(false);

    // Read and preview file
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const parsedData = parseCSV(csvText);
        setPreviewData(parsedData.slice(0, 10)); // Show first 10 rows
        setShowPreview(true);
      } catch (error: any) {
        alert(`Fout bij lezen bestand: ${error.message}`);
        setSelectedFile(null);
      }
    };
    reader.readAsText(file);
  }

  async function checkDuplicates(data: ImportRow[]): Promise<string[]> {
    const uniqueIds = data.map((row) => row.unieke_id);
    const { data: existingArtikelen, error } = await supabase
      .from("artikelen")
      .select("unieke_id")
      .in("unieke_id", uniqueIds);

    if (error) throw error;

    return existingArtikelen?.map((a) => a.unieke_id) || [];
  }

  async function handleImport() {
    if (!selectedFile || previewData.length === 0) return;

    setIsImporting(true);
    const result: ImportResult = {
      success: 0,
      errors: [],
      duplicates: [],
    };

    try {
      // Re-parse full file
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csvText = event.target?.result as string;
          const fullData = parseCSV(csvText);

          console.log(`Processing ${fullData.length} rows`);

          // Check for duplicates
          const existingIds = await checkDuplicates(fullData);
          console.log("Existing IDs:", existingIds);

          // Process each row
          for (let i = 0; i < fullData.length; i++) {
            const row = fullData[i];

            try {
              // Check if this unieke_id already exists
              if (existingIds.includes(row.unieke_id)) {
                result.duplicates.push({
                  row: i + 2, // +2 because of header row and 0-based index
                  unieke_id: row.unieke_id,
                });
                continue;
              }

              // Validate required fields
              if (!row.naam || !row.unieke_id) {
                result.errors.push({
                  row: i + 2,
                  error: "Naam en unieke_id zijn verplicht",
                  data: row,
                });
                continue;
              }

              // Insert into database
              const { error: insertError } = await supabase
                .from("artikelen")
                .insert({
                  unieke_id: row.unieke_id,
                  naam: row.naam,
                  referentie_rubix: row.referentie_rubix || null,
                  referentie_fabrikant: row.referentie_fabrikant || null,
                  ean: row.ean || null,
                });

              if (insertError) {
                result.errors.push({
                  row: i + 2,
                  error: insertError.message,
                  data: row,
                });
              } else {
                result.success++;
              }
            } catch (rowError: any) {
              result.errors.push({
                row: i + 2,
                error: rowError.message || "Onbekende fout",
                data: row,
              });
            }
          }

          setImportResult(result);
          console.log("Import completed:", result);
        } catch (parseError: any) {
          alert(`Fout bij verwerken bestand: ${parseError.message}`);
        } finally {
          setIsImporting(false);
        }
      };

      reader.readAsText(selectedFile);
    } catch (error: any) {
      console.error("Import failed:", error);
      alert(`Import mislukt: ${error.message}`);
      setIsImporting(false);
    }
  }

  function resetImport() {
    setSelectedFile(null);
    setPreviewData([]);
    setShowPreview(false);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function downloadTemplate() {
    const template = `naam,unieke_id,referentie_rubix,referentie_fabrikant,ean
"Veiligheidshelm Standaard","VH-001","RUB-VH-001","FAB-VH-STD","1234567890123"
"Werkhandschoenen Latex","WH-002","RUB-WH-002","FAB-WH-LAT","2345678901234"
"Veiligheidsbril Helder","VB-003","RUB-VB-003","FAB-VB-HLD","3456789012345"`;

    const blob = new Blob(["\uFEFF" + template], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "artikelen_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#051e50] mb-4">
          Data Importeren
        </h2>
        <p className="text-gray-600 mb-6">
          Upload een CSV bestand om meerdere artikelen tegelijk toe te voegen
          aan je database.
        </p>
      </div>

      {/* Template download */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-800">CSV Template</h3>
            <p className="text-sm text-blue-700">
              Download een voorbeeld CSV bestand om de juiste structuur te zien
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            Download Template
          </button>
        </div>
      </div>

      {/* File upload */}
      <div>
        <label className="block text-sm font-medium text-[#051e50] mb-2">
          CSV Bestand Selecteren
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#051e50] file:text-white hover:file:bg-opacity-90"
        />
        <p className="text-xs text-gray-500 mt-1">
          Alleen CSV bestanden, maximaal 5MB
        </p>
      </div>

      {/* Preview */}
      {showPreview && previewData.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-[#051e50] mb-3">
            Voorbeeld Data ({previewData.length} van {previewData.length} rijen
            getoond)
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded">
              <thead className="bg-[#051e50]">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                    Naam
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                    Unieke ID
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                    Ref. Rubix
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                    Ref. Fabrikant
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase">
                    EAN
                  </th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2 text-sm">{row.naam}</td>
                    <td className="px-4 py-2 text-sm font-mono">
                      {row.unieke_id}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {row.referentie_rubix || "-"}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {row.referentie_fabrikant || "-"}
                    </td>
                    <td className="px-4 py-2 text-sm">{row.ean || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center space-x-4 mt-4">
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#ffd700] hover:bg-opacity-90 disabled:bg-gray-400 transition-colors"
              style={{ color: "#051e50" }}
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#051e50] mr-2"></div>
                  Importeren...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Import Starten
                </>
              )}
            </button>

            <button
              onClick={resetImport}
              disabled={isImporting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Annuleren
            </button>
          </div>
        </div>
      )}

      {/* Import results */}
      {importResult && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-[#051e50]">
            Import Resultaten
          </h3>

          {/* Success summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Succesvol geïmporteerd: {importResult.success} artikelen
                </h3>
              </div>
            </div>
          </div>

          {/* Duplicates */}
          {importResult.duplicates.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                Duplicaten overgeslagen ({importResult.duplicates.length})
              </h4>
              <div className="text-sm text-yellow-700 space-y-1">
                {importResult.duplicates.map((dup, index) => (
                  <div key={index}>
                    Rij {dup.row}: {dup.unieke_id} bestaat al
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {importResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Fouten ({importResult.errors.length})
              </h4>
              <div className="text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                {importResult.errors.map((error, index) => (
                  <div key={index}>
                    Rij {error.row}: {error.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={resetImport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Nieuwe Import
          </button>
        </div>
      )}
    </div>
  );
}
