"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Artikel } from "@/lib/types";
import BulkExport from "@/components/bulk-export";
import BulkImport from "@/components/bulk-import";

export default function BulkPage() {
  const [activeTab, setActiveTab] = useState<"import" | "export">("export");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#ffd700] border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#051e50] flex items-center">
                <img
                  src="/RUBIX_logo_blue.svg"
                  alt="Rubix"
                  className="h-[30px] w-[106px] mr-3"
                />
                Bulk Import/Export
              </h1>
              <p className="text-[#051e50] mt-1">
                Bulk operaties voor artikelen en veiligheidsbladen
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="text-[#051e50] hover:text-[#051e50] font-medium"
              >
                Terug naar Home
              </a>
              <a
                href="/test-supabase"
                className="text-[#051e50] hover:text-[#051e50] font-medium"
              >
                Test Database
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("export")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "export"
                    ? "border-[#051e50] text-[#051e50]"
                    : "border-transparent text-gray-500 hover:text-[#051e50]"
                }`}
              >
                Export Data
              </button>
              <button
                onClick={() => setActiveTab("import")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "import"
                    ? "border-[#051e50] text-[#051e50]"
                    : "border-transparent text-gray-500 hover:text-[#051e50]"
                }`}
              >
                Import Data
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "export" ? <BulkExport /> : <BulkImport />}
          </div>
        </div>

        {/* Info section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-900">
            Instructies
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-blue-800">Export:</h4>
              <ul className="text-blue-700 text-sm space-y-1 ml-4">
                <li>• Download alle artikelen als CSV bestand</li>
                <li>• Inclusief alle metadata en referenties</li>
                <li>
                  • Kan geopend worden in Excel of andere spreadsheet
                  programma's
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800">Import:</h4>
              <ul className="text-blue-700 text-sm space-y-1 ml-4">
                <li>• Upload een CSV bestand met artikelen</li>
                <li>• Vereiste kolommen: naam, unieke_id</li>
                <li>
                  • Optionele kolommen: referentie_rubix, referentie_fabrikant,
                  ean
                </li>
                <li>• Duplicaten worden automatisch gedetecteerd</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
