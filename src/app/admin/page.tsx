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

  useEffect(() => {
    loadArtikelen();
  }, []);

  async function loadArtikelen() {
    try {
      const { data, error } = await supabase
        .from("artikelen")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading artikelen:", error);
        return;
      }

      setArtikelen(data || []);
    } catch (err) {
      console.error("Error:", err);
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

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Artikelen laden...</span>
          </div>
        ) : (
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
