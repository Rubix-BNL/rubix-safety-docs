"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Artikel, Veiligheidsblad, TALEN } from "@/lib/types";
import VeiligheidsbladUpload from "@/components/veiligheidsblad-upload";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ArtikelCardProps {
  artikel: Artikel;
  onUpdate?: () => void;
}

export default function ArtikelCard({ artikel, onUpdate }: ArtikelCardProps) {
  const [veiligheidsbladen, setVeiligheidsbladen] = useState<Veiligheidsblad[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVeiligheidsbladen();
  }, [artikel.id, loadVeiligheidsbladen]);

  async function loadVeiligheidsbladen() {
    try {
      const { data, error } = await supabase
        .from("veiligheidsbladen")
        .select("*")
        .eq("artikel_id", artikel.id)
        .order("id", { ascending: false });

      if (error) {
        console.error("Error loading veiligheidsbladen:", error);
        return;
      }

      setVeiligheidsbladen(data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  function getLatestVeiligheidsbladForTaal(taal: string) {
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
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <Card className="overflow-hidden">
      {/* Artikel Header */}
      <CardHeader className="border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {artikel.naam}
        </h3>

        <div className="space-y-1 text-sm text-gray-600">
          <p>
            <span className="font-medium">Unieke ID:</span> {artikel.unieke_id}
          </p>
          {artikel.referentie_rubix && (
            <p>
              <span className="font-medium">Ref. Rubix:</span>{" "}
              {artikel.referentie_rubix}
            </p>
          )}
          {artikel.referentie_fabrikant && (
            <p>
              <span className="font-medium">Ref. Fabrikant:</span>{" "}
              {artikel.referentie_fabrikant}
            </p>
          )}
          {artikel.ean && (
            <p>
              <span className="font-medium">EAN:</span> {artikel.ean}
            </p>
          )}
        </div>
      </CardHeader>

      {/* Veiligheidsbladen Section */}
      <CardContent className="pt-6">
        <h4 className="text-md font-semibold text-gray-900 mb-4">
          Veiligheidsbladen
        </h4>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Laden...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {TALEN.map((taal) => {
              const latestVeiligheidsblad = getLatestVeiligheidsbladForTaal(
                taal.code,
              );

              return (
                <div
                  key={taal.code}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800"
                      >
                        {taal.code}
                      </Badge>
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        {taal.naam}
                      </span>
                    </div>

                    {latestVeiligheidsblad && (
                      <div className="text-xs text-gray-500">
                        v{latestVeiligheidsblad.versie} •{" "}
                        {formatDate(latestVeiligheidsblad.geupload_op)}
                      </div>
                    )}
                  </div>

                  {latestVeiligheidsblad ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm text-gray-700">
                          {latestVeiligheidsblad.bestandsnaam}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            console.log(
                              "Storage path:",
                              latestVeiligheidsblad.storage_path,
                            );

                            // Try signed URL for better compatibility
                            const { data: signedUrl, error } =
                              await supabase.storage
                                .from("safety-docs")
                                .createSignedUrl(
                                  latestVeiligheidsblad.storage_path,
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
                                  latestVeiligheidsblad.storage_path,
                                ).data.publicUrl;
                              console.log("Using public URL:", publicUrl);
                              window.open(publicUrl, "_blank");
                            } else {
                              console.log(
                                "Using signed URL:",
                                signedUrl.signedUrl,
                              );
                              window.open(signedUrl.signedUrl, "_blank");
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 h-auto p-1"
                        >
                          Bekijken
                        </Button>
                        <VeiligheidsbladUpload
                          artikelId={artikel.id}
                          taal={taal.code}
                          currentVersion={latestVeiligheidsblad?.versie}
                          onUploadSuccess={loadVeiligheidsbladen}
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-green-600 hover:text-green-800 h-auto p-1"
                            >
                              Update
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <VeiligheidsbladUpload
                      artikelId={artikel.id}
                      taal={taal.code}
                      onUploadSuccess={loadVeiligheidsbladen}
                      trigger={
                        <button className="w-full border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg py-2 px-4 text-sm text-gray-600 hover:text-gray-700 transition-colors">
                          + Upload veiligheidsblad
                        </button>
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
