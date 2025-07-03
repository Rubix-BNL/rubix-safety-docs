"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Artikel } from "@/lib/types";
import ArtikelCard from "@/components/artikel-card";
import ArtikelList from "@/components/artikel-list";
import ArtikelForm from "@/components/artikel-form";

export default function HomePage() {
  const [artikelen, setArtikelen] = useState<Artikel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "list">("list");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadArtikelen();
  }, []);

  async function loadArtikelen() {
    setError(null);
    try {
      console.log("Loading artikelen...");

      const { data, error } = await supabase
        .from("artikelen")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error("Full error object:", JSON.stringify(error, null, 2));
        const errorMsg = `Fout bij laden artikelen: ${error.message || "Onbekende fout"}\n\nCode: ${error.code || "N/A"}\nDetails: ${error.details || "N/A"}\nHint: ${error.hint || "N/A"}`;
        setError(errorMsg);
        return;
      }

      console.log("Successfully loaded artikelen:", data);
      setArtikelen(data || []);
    } catch (err: any) {
      console.error("Catch block error:", err);
      const errorMsg = `Onverwachte fout: ${err?.message || err?.toString() || "Onbekende fout"}`;
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  function handleArtikelAdded(newArtikel: Artikel) {
    setArtikelen((prev) => [newArtikel, ...prev]);
    setShowForm(false);
  }

  const filteredArtikelen = artikelen.filter(
    (artikel) =>
      artikel.naam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artikel.unieke_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      artikel.referentie_rubix
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      artikel.referentie_fabrikant
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      artikel.ean?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
                Safety Documentation
              </h1>
              <p className="text-[#051e50] mt-1">
                Veiligheidsbladen en artikel informatie
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/test-supabase"
                className="text-gray-600 hover:text-gray-800 font-medium"
              >
                Test Database
              </a>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {showForm ? "Annuleren" : "Nieuw Artikel"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              Nieuw Artikel Toevoegen
            </h2>
            <ArtikelForm
              onSuccess={handleArtikelAdded}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Fout opgetreden
            </h3>
            <pre className="text-sm text-red-700 whitespace-pre-wrap">
              {error}
            </pre>
            <div className="mt-4">
              <button
                onClick={loadArtikelen}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors mr-4"
              >
                Opnieuw proberen
              </button>
              <a
                href="/test-supabase"
                className="text-red-600 hover:text-red-800 font-medium"
              >
                Test Supabase verbinding
              </a>
            </div>
          </div>
        )}

        {!error && !loading && (
          <>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Zoeken op naam, ID, referenties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">
                  {filteredArtikelen.length} van {artikelen.length} artikelen
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Weergave:</span>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${viewMode === "list" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`p-2 rounded ${viewMode === "cards" ? "bg-blue-100 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Artikelen laden...</span>
              </div>
            ) : filteredArtikelen.length === 0 ? (
              <div className="text-center py-12">
                {searchTerm ? (
                  <p className="text-gray-500 text-lg">
                    Geen artikelen gevonden voor "{searchTerm}"
                  </p>
                ) : (
                  <div>
                    <p className="text-gray-500 text-lg mb-4">
                      Nog geen artikelen toegevoegd
                    </p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Voeg je eerste artikel toe
                    </button>
                  </div>
                )}
              </div>
            ) : viewMode === "list" ? (
              <ArtikelList
                artikelen={filteredArtikelen}
                onUpdate={loadArtikelen}
              />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredArtikelen.map((artikel) => (
                  <ArtikelCard
                    key={artikel.id}
                    artikel={artikel}
                    onUpdate={loadArtikelen}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
