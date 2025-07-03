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
    naam: "",
    omschrijving: "",
    leverancier: "",
    artikelnummer: "",
    ean_code: "",
    referentie_nummer: "",
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
        alert("Fout bij opslaan: " + error.message);
        return;
      }

      onSuccess(data);
    } catch (err) {
      console.error("Error:", err);
      alert("Er is een fout opgetreden");
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
            Leverancier
          </label>
          <input
            type="text"
            name="leverancier"
            value={formData.leverancier}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Leverancier naam"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Artikelnummer
          </label>
          <input
            type="text"
            name="artikelnummer"
            value={formData.artikelnummer}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Intern artikelnummer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            EAN Code
          </label>
          <input
            type="text"
            name="ean_code"
            value={formData.ean_code}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="EAN/Barcode"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Referentienummer
          </label>
          <input
            type="text"
            name="referentie_nummer"
            value={formData.referentie_nummer}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Externe referentie"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Omschrijving
        </label>
        <textarea
          name="omschrijving"
          value={formData.omschrijving}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Beschrijving van het artikel"
        />
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
          disabled={saving || !formData.naam}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
        >
          {saving ? "Opslaan..." : "Artikel Toevoegen"}
        </button>
      </div>
    </form>
  );
}
