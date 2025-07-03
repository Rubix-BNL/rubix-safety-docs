"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Taal } from "@/lib/types";

interface VeiligheidsbladUploadProps {
  artikelId: string;
  taal: Taal;
  currentVersion?: string;
  onUploadSuccess: () => void;
  trigger: React.ReactNode;
}

export default function VeiligheidsbladUpload({
  artikelId,
  taal,
  currentVersion,
  onUploadSuccess,
  trigger,
}: VeiligheidsbladUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newVersion, setNewVersion] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openModal() {
    // Generate next version number
    if (currentVersion) {
      const currentNum = parseFloat(currentVersion);
      const nextNum = Math.floor(currentNum) + 1;
      setNewVersion(`${nextNum}.0`);
    } else {
      setNewVersion("1.0");
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setSelectedFile(null);
    setNewVersion("");
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (
        !file.type.includes("pdf") &&
        !file.type.includes("word") &&
        !file.type.includes("document")
      ) {
        alert("Alleen PDF en Word documenten zijn toegestaan");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("Bestand mag maximaal 10MB zijn");
        return;
      }

      setSelectedFile(file);
    }
  }

  async function handleUpload() {
    if (!selectedFile || !newVersion) return;

    setIsUploading(true);

    try {
      // Create file paths
      const fileExtension = selectedFile.name.split(".").pop();
      const fileName = `veiligheidsblad.${fileExtension}`;
      const versionPath = `veiligheidsbladen/${artikelId}/${taal}/V${newVersion}/${fileName}`;
      const latestPath = `veiligheidsbladen/${artikelId}/${taal}/latest/${fileName}`;

      // Upload versioned file
      const { error: versionError } = await supabase.storage
        .from("safety-docs")
        .upload(versionPath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (versionError) {
        console.error("Error uploading versioned file:", versionError);
        console.error(
          "Full error object:",
          JSON.stringify(versionError, null, 2),
        );
        alert(
          `Fout bij uploaden: ${versionError.message || "Onbekende fout"}\n\nDetails: ${versionError.error || versionError.statusText || "Geen extra details"}\n\nMogelijke oorzaak: Supabase Storage bucket bestaat niet of geen toegang`,
        );
        return;
      }

      // Upload to latest folder (overwrite existing)
      const { error: latestError } = await supabase.storage
        .from("safety-docs")
        .upload(latestPath, selectedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (latestError) {
        console.error("Error uploading latest file:", latestError);
        console.error(
          "Latest file error details:",
          JSON.stringify(latestError, null, 2),
        );
        // Continue anyway, versioned upload succeeded
      }

      // Get public URLs
      const { data: versionUrl } = supabase.storage
        .from("safety-docs")
        .getPublicUrl(versionPath);

      // Save to database
      const { error: dbError } = await supabase
        .from("veiligheidsbladen")
        .insert({
          artikel_id: artikelId,
          taal: taal,
          versie: newVersion,
          storage_path: versionPath,
          bestandsnaam: selectedFile.name,
          geupload_op: new Date().toISOString(),
        });

      if (dbError) {
        console.error("Error saving to database:", dbError);
        console.error(
          "Database error details:",
          JSON.stringify(dbError, null, 2),
        );
        alert(
          `Fout bij opslaan in database: ${dbError.message || "Onbekende fout"}\n\nCode: ${dbError.code || "N/A"}\nDetails: ${dbError.details || "N/A"}`,
        );
        return;
      }

      onUploadSuccess();
      closeModal();
    } catch (err: any) {
      console.error("Upload error:", err);
      alert(
        `Er is een onverwachte fout opgetreden: ${err?.message || err?.toString() || "Onbekende fout"}`,
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      <div onClick={openModal} className="cursor-pointer">
        {trigger}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Veiligheidsblad Uploaden ({taal})
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Versie
                </label>
                <input
                  type="text"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="bijv. 1.0, 2.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bestand
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  PDF of Word document, max 10MB
                </p>
              </div>

              {selectedFile && (
                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <strong>Geselecteerd:</strong> {selectedFile.name}(
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeModal}
                disabled={isUploading}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-md transition-colors"
              >
                Annuleren
              </button>
              <button
                onClick={handleUpload}
                disabled={isUploading || !selectedFile || !newVersion}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
              >
                {isUploading ? "Uploaden..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
