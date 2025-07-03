"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Artikel } from "@/lib/types";
import ArtikelCard from "@/components/artikel-card";
import ArtikelForm from "@/components/artikel-form";

export default function AdminPage() {
  const [artikelen, setArtikelen] = useState<Artikel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadArtikelen();
  }, []);

  async function loadArtikelen() {
    setError(null);
    try {
      console.log("Loading artikelen...");

      // Test basic connection first
      const { data: testData, error: testError } = await supabase
        .from("artikelen")
        .select("count", { count: "exact", head: true });

      if (testError) {
        console.error("Test query failed:", testError);
        const errorMsg = `Database verbinding mislukt: ${testError.message || "Onbekende fout"}`;
        setError(errorMsg);
        return;
      }

      console.log("Test query successful, loading full data...");

      const { data, error } = await supabase
        .from("artikelen")
        .select("*")
        .order("created_at", { ascending: false });

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Beheer artikelen en veiligheidsbladen
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {showForm ? "Annuleren" : "Nieuw Artikel"}
          </button>
        </div>

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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Artikelen laden...</span>
          </div>
        ) : error ? null : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {artikelen.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-lg">
                  Nog geen artikelen toegevoegd
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Voeg je eerste artikel toe
                </button>
              </div>
            ) : (
              artikelen.map((artikel) => (
                <ArtikelCard
                  key={artikel.id}
                  artikel={artikel}
                  onUpdate={loadArtikelen}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
