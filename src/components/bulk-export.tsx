"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Artikel, Veiligheidsblad } from "@/lib/types";

export default function BulkExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<
    "artikelen" | "veiligheidsbladen" | "alles"
  >("artikelen");

  function convertToCSV(data: any[], filename: string) {
    if (data.length === 0) return "";

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma or quote
            if (
              typeof value === "string" &&
              (value.includes(",") || value.includes('"'))
            ) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || "";
          })
          .join(","),
      ),
    ].join("\n");

    return csvContent;
  }

  function downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function exportArtikelen() {
    try {
      const { data, error } = await supabase
        .from("artikelen")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        alert(
          "ℹ️ Geen gegevens beschikbaar\n\nEr zijn momenteel geen artikelen in de database om te exporteren.\n\nVoeg eerst artikelen toe voordat u kunt exporteren.",
        );
        return;
      }

      // Clean data for export
      const exportData = data.map((artikel) => ({
        unieke_id: artikel.unieke_id,
        naam: artikel.naam,
        referentie_rubix: artikel.referentie_rubix || "",
        referentie_fabrikant: artikel.referentie_fabrikant || "",
        ean: artikel.ean || "",
        created_at: artikel.created_at,
        updated_at: artikel.updated_at,
      }));

      const csvContent = convertToCSV(exportData, "artikelen.csv");
      const timestamp = new Date().toISOString().split("T")[0];
      downloadCSV(csvContent, `artikelen_export_${timestamp}.csv`);

      return data.length;
    } catch (error: any) {
      console.error("Export error:", error);
      throw error;
    }
  }

  async function exportVeiligheidsbladen() {
    try {
      const { data, error } = await supabase
        .from("veiligheidsbladen")
        .select(
          `
          *,
          artikelen:artikel_id (
            unieke_id,
            naam
          )
        `,
        )
        .order("geupload_op", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        alert(
          "ℹ️ Geen gegevens beschikbaar\n\nEr zijn momenteel geen veiligheidsbladen in de database om te exporteren.\n\nUpload eerst veiligheidsbladen voordat u kunt exporteren.",
        );
        return;
      }

      // Clean data for export
      const exportData = data.map((vb) => ({
        veiligheidsblad_id: vb.id,
        artikel_unieke_id: vb.artikelen?.unieke_id || "",
        artikel_naam: vb.artikelen?.naam || "",
        taal: vb.taal,
        versie: vb.versie,
        bestandsnaam: vb.bestandsnaam,
        storage_path: vb.storage_path,
        geupload_op: vb.geupload_op,
      }));

      const csvContent = convertToCSV(exportData, "veiligheidsbladen.csv");
      const timestamp = new Date().toISOString().split("T")[0];
      downloadCSV(csvContent, `veiligheidsbladen_export_${timestamp}.csv`);

      return data.length;
    } catch (error: any) {
      console.error("Export error:", error);
      throw error;
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      let exportedCount = 0;

      if (exportType === "artikelen") {
        exportedCount = (await exportArtikelen()) || 0;
        alert(
          `✅ Export voltooid\n\n${exportedCount} artikelen zijn succesvol geëxporteerd naar een CSV bestand.\n\nHet bestand is automatisch gedownload naar uw Downloads map.`,
        );
      } else if (exportType === "veiligheidsbladen") {
        exportedCount = (await exportVeiligheidsbladen()) || 0;
        alert(
          `✅ Export voltooid\n\n${exportedCount} veiligheidsbladen zijn succesvol geëxporteerd naar een CSV bestand.\n\nHet bestand is automatisch gedownload naar uw Downloads map.`,
        );
      } else if (exportType === "alles") {
        const artikelCount = (await exportArtikelen()) || 0;
        const vbCount = (await exportVeiligheidsbladen()) || 0;
        alert(
          `✅ Export voltooid\n\nSuccesvol geëxporteerd:\n• ${artikelCount} artikelen\n• ${vbCount} veiligheidsbladen\n\nBeide bestanden zijn automatisch gedownload naar uw Downloads map.`,
        );
      }
    } catch (error: any) {
      console.error("Export failed:", error);
      alert(
        `❌ Export mislukt\n\nEr is een fout opgetreden tijdens het exporteren van de gegevens.\n\nFoutmelding: ${error.message || "Onbekende fout"}\n\nProbeer het opnieuw of neem contact op met de beheerder.`,
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#051e50] mb-4">
          Data Exporteren
        </h2>
        <p className="text-gray-600 mb-6">
          Exporteer je data als CSV bestanden die je kunt openen in Excel of
          andere spreadsheet programma's.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#051e50] mb-2">
            Wat wil je exporteren?
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="exportType"
                value="artikelen"
                checked={exportType === "artikelen"}
                onChange={(e) => setExportType(e.target.value as any)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Alleen artikelen</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="exportType"
                value="veiligheidsbladen"
                checked={exportType === "veiligheidsbladen"}
                onChange={(e) => setExportType(e.target.value as any)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
                Alleen veiligheidsbladen
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="exportType"
                value="alles"
                checked={exportType === "alles"}
                onChange={(e) => setExportType(e.target.value as any)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">
                Alles (aparte bestanden)
              </span>
            </label>
          </div>
        </div>

        <div className="flex items-center space-x-4 pt-4">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#051e50] hover:bg-opacity-90 disabled:bg-gray-400 transition-colors"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exporteren...
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                  />
                </svg>
                Export Starten
              </>
            )}
          </button>

          <div className="text-sm text-gray-500">
            {exportType === "artikelen" && "CSV bestand met alle artikelen"}
            {exportType === "veiligheidsbladen" &&
              "CSV bestand met alle veiligheidsbladen"}
            {exportType === "alles" && "Twee aparte CSV bestanden"}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Let op</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                De geëxporteerde bestanden bevatten gevoelige data. Behandel
                deze bestanden vertrouwelijk en verwijder ze na gebruik.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
