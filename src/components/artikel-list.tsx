"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Artikel, Veiligheidsblad, TALEN } from "@/lib/types";
import VeiligheidsbladUpload from "@/components/veiligheidsblad-upload";

interface ArtikelListProps {
  artikelen: Artikel[];
  onUpdate: () => void;
}

export default function ArtikelList({ artikelen, onUpdate }: ArtikelListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [veiligheidsbladenMap, setVeiligheidsbladenMap] = useState<{
    [key: string]: Veiligheidsblad[];
  }>({});

  async function loadVeiligheidsbladen(artikelId: string) {
    if (veiligheidsbladenMap[artikelId]) return; // Already loaded

    try {
      const { data, error } = await supabase
        .from("veiligheidsbladen")
        .select("*")
        .eq("artikel_id", artikelId)
        .order("id", { ascending: false });

      if (!error && data) {
        setVeiligheidsbladenMap((prev) => ({
          ...prev,
          [artikelId]: data,
        }));
      }
    } catch (err) {
      console.error("Error loading veiligheidsbladen:", err);
    }
  }

  function toggleExpanded(artikelId: string) {
    if (expandedId === artikelId) {
      setExpandedId(null);
    } else {
      setExpandedId(artikelId);
      loadVeiligheidsbladen(artikelId);
    }
  }

  function getLatestVeiligheidsbladForTaal(artikelId: string, taal: string) {
    const veiligheidsbladen = veiligheidsbladenMap[artikelId] || [];
    return veiligheidsbladen
      .filter((vb) => vb.taal === taal)
      .sort(
        (a, b) =>
          new Date(b.geupload_op).getTime() - new Date(a.geupload_op).getTime(),
      )[0];
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("nl-NL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  async function handleVeiligheidsbladUpdate(artikelId: string) {
    // Clear cache for this artikel
    setVeiligheidsbladenMap((prev) => {
      const updated = { ...prev };
      delete updated[artikelId];
      return updated;
    });

    // Reload veiligheidsbladen for this artikel
    await loadVeiligheidsbladen(artikelId);

    // Also refresh the main artikel list to get any updates
    onUpdate();
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#051e50]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Artikel
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Referenties
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Veiligheidsbladen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Datum
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Acties</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {artikelen.map((artikel) => (
              <React.Fragment key={artikel.id}>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {artikel.naam}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {artikel.unieke_id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 space-y-1">
                      {artikel.referentie_rubix && (
                        <div>Rubix: {artikel.referentie_rubix}</div>
                      )}
                      {artikel.referentie_fabrikant && (
                        <div>Fabrikant: {artikel.referentie_fabrikant}</div>
                      )}
                      {artikel.ean && <div>EAN: {artikel.ean}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-1">
                      {TALEN.map((taal) => {
                        const veiligheidsblad = getLatestVeiligheidsbladForTaal(
                          artikel.id,
                          taal.code,
                        );
                        return (
                          <span
                            key={taal.code}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              veiligheidsblad
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {taal.code}
                            {veiligheidsblad && (
                              <span className="ml-1 text-xs">
                                v{veiligheidsblad.versie}
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(artikel.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => toggleExpanded(artikel.id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      {expandedId === artikel.id ? "Inklappen" : "Details"}
                    </button>
                  </td>
                </tr>

                {expandedId === artikel.id && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">
                          Veiligheidsbladen beheren
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {TALEN.map((taal) => {
                            const veiligheidsblad =
                              getLatestVeiligheidsbladForTaal(
                                artikel.id,
                                taal.code,
                              );

                            return (
                              <div
                                key={taal.code}
                                className="border border-gray-200 rounded-lg p-4 bg-white"
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center">
                                    <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {taal.code}
                                    </span>
                                    <span className="ml-2 text-sm font-medium text-gray-700">
                                      {taal.naam}
                                    </span>
                                  </div>

                                  {veiligheidsblad && (
                                    <div className="text-xs text-gray-500">
                                      v{veiligheidsblad.versie}
                                    </div>
                                  )}
                                </div>

                                {veiligheidsblad ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center">
                                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                      <span className="text-sm text-gray-700 truncate">
                                        {veiligheidsblad.bestandsnaam}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {formatDate(veiligheidsblad.geupload_op)}
                                    </div>
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={async () => {
                                          console.log(
                                            "Storage path:",
                                            veiligheidsblad.storage_path,
                                          );

                                          // Try signed URL for better compatibility
                                          const { data: signedUrl, error } =
                                            await supabase.storage
                                              .from("safety-docs")
                                              .createSignedUrl(
                                                veiligheidsblad.storage_path,
                                                3600,
                                              ); // 1 hour expiry

                                          if (error) {
                                            console.error(
                                              "Error creating signed URL:",
                                              error,
                                            );
                                            // Fallback to public URL
                                            const publicUrl = supabase.storage
                                              .from("safety-docs")
                                              .getPublicUrl(
                                                veiligheidsblad.storage_path,
                                              ).data.publicUrl;
                                            console.log(
                                              "Using public URL:",
                                              publicUrl,
                                            );
                                            window.open(publicUrl, "_blank");
                                          } else {
                                            console.log(
                                              "Using signed URL:",
                                              signedUrl.signedUrl,
                                            );
                                            window.open(
                                              signedUrl.signedUrl,
                                              "_blank",
                                            );
                                          }
                                        }}
                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-[#051e50] hover:bg-opacity-90 transition-colors"
                                      >
                                        Bekijken
                                      </button>
                                      <VeiligheidsbladUpload
                                        artikelId={artikel.id}
                                        taal={taal.code}
                                        currentVersion={veiligheidsblad?.versie}
                                        onUploadSuccess={() =>
                                          handleVeiligheidsbladUpdate(
                                            artikel.id,
                                          )
                                        }
                                        trigger={
                                          <button className="inline-flex items-center px-3 py-1.5 border border-[#ffd700] text-xs font-medium rounded-md text-[#051e50] bg-[#ffd700] hover:bg-opacity-90 transition-colors">
                                            Update
                                          </button>
                                        }
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <VeiligheidsbladUpload
                                    artikelId={artikel.id}
                                    taal={taal.code}
                                    onUploadSuccess={() =>
                                      handleVeiligheidsbladUpdate(artikel.id)
                                    }
                                    trigger={
                                      <button className="w-full border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg py-2 px-3 text-xs text-gray-600 hover:text-gray-700 transition-colors">
                                        + Upload
                                      </button>
                                    }
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
