"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Artikel } from "@/lib/types";

interface ArtikelFormProps {
  onSuccess: (artikel: Artikel) => void;
  onCancel: () => void;
}

export default function ArtikelForm({ onSuccess, onCancel }: ArtikelFormProps) {
  const [formData, setFormData] = useState({
    unieke_id: "",
    naam: "",
    referentie_rubix: "",
    referentie_fabrikant: "",
    ean: "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const { data, error } = await supabase
        .from("artikelen")
        .insert([formData])
        .select()
        .single();

      if (error) {
        console.error("Error saving artikel:", error);
        alert(
          `❌ Opslaan mislukt\n\nHet artikel kon niet worden opgeslagen in de database.\n\nFoutmelding: ${error.message}\n\nControleer uw gegevens en probeer het opnieuw.`,
        );
        return;
      }

      onSuccess(data);
    } catch (err) {
      console.error("Error:", err);
      alert(
        "❌ Onverwachte fout\n\nEr is een onverwachte fout opgetreden bij het verwerken van uw verzoek.\n\nProbeer het opnieuw of neem contact op met de beheerder.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Naam *
          </label>
          <input
            type="text"
            name="naam"
            value={formData.naam}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Artikelnaam"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unieke ID *
          </label>
          <input
            type="text"
            name="unieke_id"
            value={formData.unieke_id}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Uniek artikel ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Referentie Rubix
          </label>
          <input
            type="text"
            name="referentie_rubix"
            value={formData.referentie_rubix}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Rubix referentie"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Referentie Fabrikant
          </label>
          <input
            type="text"
            name="referentie_fabrikant"
            value={formData.referentie_fabrikant}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Fabrikant referentie"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            EAN Code
          </label>
          <input
            type="text"
            name="ean"
            value={formData.ean}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="EAN/Barcode"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
        >
          Annuleren
        </button>
        <button
          type="submit"
          disabled={saving || !formData.naam || !formData.unieke_id}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
        >
          {saving ? "Opslaan..." : "Artikel Toevoegen"}
        </button>
      </div>
    </form>
  );
}
