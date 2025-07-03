"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

interface DocumentFile {
  file: File;
  artikelId: string;
  taal: string;
  versie: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface ParsedFileName {
  artikelId: string;
  taal: string;
  versie: string;
  extensie: string;
  isValid: boolean;
  error?: string;
}

export default function BulkDocumentUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function parseFileName(fileName: string): ParsedFileName {
    // Remove extension first
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex === -1) {
      return {
        artikelId: "",
        taal: "",
        versie: "",
        extensie: "",
        isValid: false,
        error: "Geen bestandsextensie gevonden",
      };
    }

    const nameWithoutExt = fileName.substring(0, lastDotIndex);
    const extensie = fileName.substring(lastDotIndex + 1).toLowerCase();

    // Check if extension is valid
    if (!["pdf", "doc", "docx"].includes(extensie)) {
      return {
        artikelId: "",
        taal: "",
        versie: "",
        extensie,
        isValid: false,
        error: "Alleen PDF, DOC en DOCX bestanden zijn toegestaan",
      };
    }

    // Parse filename: artikelId_taal_Vversie
    const parts = nameWithoutExt.split("_");
    if (parts.length !== 3) {
      return {
        artikelId: "",
        taal: "",
        versie: "",
        extensie,
        isValid: false,
        error: "Bestandsnaam moet format hebben: {artikel_id}_{taal}_V{versie}",
      };
    }

    const [artikelId, taal, versieString] = parts;

    // Validate version format
    if (
      !versieString.startsWith("V") ||
      !versieString.substring(1).match(/^\d+$/)
    ) {
      return {
        artikelId,
        taal,
        versie: "",
        extensie,
        isValid: false,
        error: "Versie moet format hebben: V{nummer} (bijvoorbeeld V1, V2)",
      };
    }

    const versie = versieString.substring(1);

    // Validate language
    if (!["NL", "EN", "FR", "DE"].includes(taal.toUpperCase())) {
      return {
        artikelId,
        taal,
        versie,
        extensie,
        isValid: false,
        error: "Taal moet zijn: NL, EN, FR of DE",
      };
    }

    return {
      artikelId,
      taal: taal.toUpperCase(),
      versie,
      extensie,
      isValid: true,
    };
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".zip")) {
      alert(
        "❌ Verkeerd bestandstype\n\nAlleen ZIP bestanden zijn toegestaan voor bulk upload.\n\nPak uw PDF/DOC bestanden in een ZIP bestand.",
      );
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert(
        "❌ Bestand te groot\n\nHet ZIP bestand mag maximaal 50MB zijn.\n\nComprimeer uw bestanden of splits ze op in kleinere ZIP bestanden.",
      );
      return;
    }

    setSelectedFile(file);
    setDocuments([]);
    await processZipFile(file);
  }

  async function processZipFile(file: File) {
    setIsProcessing(true);

    try {
      // Import JSZip dynamically
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      const zipData = await zip.loadAsync(file);
      const documentFiles: DocumentFile[] = [];

      // Process each file in the ZIP
      for (const [fileName, zipEntry] of Object.entries(zipData.files)) {
        if (zipEntry.dir) continue; // Skip directories

        const parsed = parseFileName(fileName);
        const fileBlob = await zipEntry.async("blob");
        const documentFile = new File([fileBlob], fileName, {
          type: fileBlob.type,
        });

        documentFiles.push({
          file: documentFile,
          artikelId: parsed.artikelId,
          taal: parsed.taal,
          versie: parsed.versie,
          status: parsed.isValid ? "pending" : "error",
          error: parsed.error,
        });
      }

      setDocuments(documentFiles);
    } catch (error: any) {
      alert(
        `❌ ZIP bestand fout\n\nHet ZIP bestand kon niet worden gelezen.\n\nFoutmelding: ${error.message}\n\nZorg ervoor dat het een geldig ZIP bestand is.`,
      );
    } finally {
      setIsProcessing(false);
    }
  }

  async function validateArticles() {
    const artikelIds = [
      ...new Set(
        documents.filter((d) => d.status === "pending").map((d) => d.artikelId),
      ),
    ];

    if (artikelIds.length === 0) return;

    try {
      const { data: existingArtikelen, error } = await supabase
        .from("artikelen")
        .select("unieke_id")
        .in("unieke_id", artikelIds);

      if (error) throw error;

      const existingIds = new Set(
        existingArtikelen?.map((a) => a.unieke_id) || [],
      );

      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.status !== "pending") return doc;

          if (!existingIds.has(doc.artikelId)) {
            return {
              ...doc,
              status: "error" as const,
              error: `Artikel ID '${doc.artikelId}' bestaat niet in de database`,
            };
          }

          return doc;
        }),
      );
    } catch (error: any) {
      alert(
        `❌ Validatie fout\n\nKon artikel IDs niet valideren.\n\nFoutmelding: ${error.message}`,
      );
    }
  }

  async function uploadDocuments() {
    const validDocuments = documents.filter((d) => d.status === "pending");

    if (validDocuments.length === 0) {
      alert(
        "ℹ️ Geen geldige documenten\n\nEr zijn geen geldige documenten gevonden om te uploaden.\n\nControleer de bestandsnamen en probeer opnieuw.",
      );
      return;
    }

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const doc of validDocuments) {
      try {
        // Update status to uploading
        setDocuments((prev) =>
          prev.map((d) =>
            d.file.name === doc.file.name
              ? { ...d, status: "uploading" as const }
              : d,
          ),
        );

        const fileExtension = doc.file.name.split(".").pop();
        const fileName = `veiligheidsblad.${fileExtension}`;

        // Upload to versioned path
        const versionPath = `veiligheidsbladen/${doc.artikelId}/${doc.taal}/V${doc.versie}/${fileName}`;
        const latestPath = `veiligheidsbladen/${doc.artikelId}/${doc.taal}/latest/${fileName}`;

        // Upload versioned file
        const { error: versionError } = await supabase.storage
          .from("safety-docs")
          .upload(versionPath, doc.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (versionError) {
          throw new Error(`Version upload: ${versionError.message}`);
        }

        // Upload to latest folder
        await supabase.storage
          .from("safety-docs")
          .upload(latestPath, doc.file, {
            cacheControl: "3600",
            upsert: true,
          });

        // Save to database
        const { error: dbError } = await supabase
          .from("veiligheidsbladen")
          .insert({
            artikel_id: doc.artikelId,
            taal: doc.taal,
            versie: parseInt(doc.versie),
            storage_path: versionPath,
            bestandsnaam: doc.file.name,
            geupload_op: new Date().toISOString(),
          });

        if (dbError) {
          throw new Error(`Database: ${dbError.message}`);
        }

        // Update status to success
        setDocuments((prev) =>
          prev.map((d) =>
            d.file.name === doc.file.name
              ? { ...d, status: "success" as const }
              : d,
          ),
        );

        successCount++;
      } catch (error: any) {
        // Update status to error
        setDocuments((prev) =>
          prev.map((d) =>
            d.file.name === doc.file.name
              ? {
                  ...d,
                  status: "error" as const,
                  error: error.message,
                }
              : d,
          ),
        );

        errorCount++;
      }
    }

    setIsUploading(false);

    if (successCount > 0 && errorCount === 0) {
      alert(
        `✅ Upload voltooid\n\n${successCount} veiligheidsbladen zijn succesvol geüpload.\n\nAlle documenten zijn beschikbaar in de applicatie.`,
      );
    } else if (successCount > 0 && errorCount > 0) {
      alert(
        `⚠️ Upload gedeeltelijk voltooid\n\n✅ Succesvol: ${successCount} documenten\n❌ Mislukt: ${errorCount} documenten\n\nControleer de foutmeldingen hieronder voor details.`,
      );
    } else {
      alert(
        `❌ Upload mislukt\n\nGeen enkel document kon worden geüpload.\n\nControleer de foutmeldingen hieronder voor details.`,
      );
    }
  }

  function downloadExampleZip() {
    // Create example files content
    const exampleFiles = [
      {
        name: "ART001_NL_V1.pdf",
        content: "Voorbeeld Nederlands veiligheidsblad voor artikel ART001",
      },
      {
        name: "ART001_EN_V1.pdf",
        content: "Example English safety data sheet for article ART001",
      },
      {
        name: "ART002_NL_V2.pdf",
        content: "Voorbeeld Nederlands veiligheidsblad voor artikel ART002",
      },
      {
        name: "README.txt",
        content: `Voorbeeld ZIP bestand voor bulk document upload

Naamconventie:
{artikel_id}_{taal}_V{versie}.{extensie}

Voorbeelden:
- ART001_NL_V1.pdf
- ART002_EN_V2.docx
- CHEM001_DE_V3.pdf

Ondersteunde talen: NL, EN, FR, DE
Ondersteunde bestanden: PDF, DOC, DOCX
Maximum bestandsgrootte: 50MB per ZIP

Vervang deze voorbeeldbestanden door uw eigen PDF/DOC documenten.`,
      },
    ];

    // Create ZIP using JSZip
    import("jszip").then(({ default: JSZip }) => {
      const zip = new JSZip();

      exampleFiles.forEach(({ name, content }) => {
        zip.file(name, content);
      });

      zip.generateAsync({ type: "blob" }).then((content) => {
        const url = window.URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = "voorbeeld-veiligheidsbladen.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      });
    });
  }

  const validDocsCount = documents.filter((d) => d.status === "pending").length;
  const errorDocsCount = documents.filter((d) => d.status === "error").length;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-blue-900">
          Bulk Document Upload
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-blue-800">Instructies:</h4>
            <ul className="text-blue-700 text-sm space-y-1 ml-4">
              <li>• Pack uw PDF/DOC veiligheidsbladen in een ZIP bestand</li>
              <li>
                • Gebruik de naamconventie:{" "}
                <code className="bg-blue-100 px-1 rounded">
                  {"{artikel_id}_{taal}_V{versie}.{extensie}"}
                </code>
              </li>
              <li>
                • Voorbeeld:{" "}
                <code className="bg-blue-100 px-1 rounded">
                  ART001_NL_V1.pdf
                </code>
              </li>
              <li>• Ondersteunde talen: NL, EN, FR, DE</li>
              <li>• Maximum ZIP grootte: 50MB</li>
            </ul>
          </div>
          <Button
            onClick={downloadExampleZip}
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            📥 Download Voorbeeld ZIP
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8">
        <div className="text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!selectedFile ? (
            <div>
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Upload ZIP bestand met veiligheidsbladen
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Sleep een ZIP bestand hierheen of klik om te selecteren
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#051e50] hover:bg-[#051e50]/90"
              >
                Selecteer ZIP bestand
              </Button>
            </div>
          ) : (
            <div>
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {selectedFile.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mr-4"
              >
                Ander bestand kiezen
              </Button>
            </div>
          )}
        </div>
      </div>

      {isProcessing && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
            <span className="text-yellow-800">ZIP bestand verwerken...</span>
          </div>
        </div>
      )}

      {documents.length > 0 && !isProcessing && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Gevonden documenten ({documents.length})
                </h3>
                <p className="text-sm text-gray-500">
                  ✅ Geldig: {validDocsCount} | ❌ Fouten: {errorDocsCount}
                </p>
              </div>
              <div className="space-x-3">
                <Button
                  onClick={validateArticles}
                  variant="outline"
                  disabled={validDocsCount === 0}
                >
                  Valideer Artikel IDs
                </Button>
                <Button
                  onClick={uploadDocuments}
                  disabled={validDocsCount === 0 || isUploading}
                  className="bg-[#051e50] hover:bg-[#051e50]/90"
                >
                  {isUploading
                    ? "Uploaden..."
                    : `Upload ${validDocsCount} documenten`}
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="p-4 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{doc.file.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Artikel: {doc.artikelId} | Taal: {doc.taal} | Versie:{" "}
                      {doc.versie}
                    </div>
                    {doc.error && (
                      <div className="text-xs text-red-600 mt-1">
                        ❌ {doc.error}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    {doc.status === "pending" && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Wachtend
                      </span>
                    )}
                    {doc.status === "uploading" && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Uploaden...
                      </span>
                    )}
                    {doc.status === "success" && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Succesvol
                      </span>
                    )}
                    {doc.status === "error" && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ❌ Fout
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
