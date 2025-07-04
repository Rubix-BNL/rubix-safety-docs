"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ConnectionStatus {
  connected: boolean;
  error?: string;
  details?: unknown;
}

interface TableTestResult {
  name: string;
  accessible: boolean;
  error?: string;
  needsRLS?: boolean;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

export default function TestSupabasePage() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [tableTests, setTableTests] = useState<TableTestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<{ [key: string]: unknown[] }>({});
  const [inspectingTables, setInspectingTables] = useState(false);
  const [tableSchemas, setTableSchemas] = useState<{
    [key: string]: ColumnInfo[];
  }>({});
  const [loadingSchemas, setLoadingSchemas] = useState(false);
  const [buckets, setBuckets] = useState<unknown[]>([]);
  const [loadingBuckets, setLoadingBuckets] = useState(false);

  useEffect(() => {
    async function testConnection() {
      try {
        // Test de verbinding door de auth sessie op te halen
        const { error: authError } = await supabase.auth.getSession();

        if (authError) {
          setStatus({
            connected: false,
            error: authError.message,
            details: authError,
          });
          setLoading(false);
          return;
        }

        setStatus({
          connected: true,
          details: "Basis verbinding succesvol!",
        });

        // Test specifieke tabellen
        const tablesToTest = ["artikelen", "veiligheidsbladen"];
        const tableResults: TableTestResult[] = [];

        for (const tableName of tablesToTest) {
          try {
            const { error } = await supabase
              .from(tableName)
              .select("*")
              .limit(1);

            if (error) {
              if (
                error.message.includes("permission denied") ||
                error.message.includes("RLS")
              ) {
                tableResults.push({
                  name: tableName,
                  accessible: false,
                  needsRLS: true,
                  error: "RLS policy vereist voor toegang",
                });
              } else if (error.message.includes("does not exist")) {
                tableResults.push({
                  name: tableName,
                  accessible: false,
                  error: "Tabel bestaat niet",
                });
              } else {
                tableResults.push({
                  name: tableName,
                  accessible: false,
                  error: error.message,
                });
              }
            } else {
              tableResults.push({
                name: tableName,
                accessible: true,
              });
            }
          } catch (err: any) {
            tableResults.push({
              name: tableName,
              accessible: false,
              error: err.message || "Onbekende fout",
            });
          }
        }

        setTableTests(tableResults);
      } catch (err: any) {
        setStatus({
          connected: false,
          error: err.message || "Onbekende fout",
          details: err,
        });
      } finally {
        setLoading(false);
      }
    }

    testConnection();
  }, []);

  async function inspectTables() {
    setInspectingTables(true);
    const data: { [key: string]: any[] } = {};

    const tablesToInspect = ["artikelen", "veiligheidsbladen"];

    for (const tableName of tablesToInspect) {
      try {
        const { data: tableData, error } = await supabase
          .from(tableName)
          .select("*")
          .limit(5);

        if (!error && tableData) {
          data[tableName] = tableData;
        } else {
          data[tableName] = [];
        }
      } catch (err) {
        data[tableName] = [];
      }
    }

    setTableData(data);
    setInspectingTables(false);
  }

  async function inspectSchemas() {
    setLoadingSchemas(true);
    const schemas: { [key: string]: ColumnInfo[] } = {};

    const tablesToInspect = ["artikelen", "veiligheidsbladen"];

    for (const tableName of tablesToInspect) {
      try {
        console.log(`Inspecting schema for table: ${tableName}`);

        // Method 1: Try information_schema
        let schemaData = null;
        let error = null;

        try {
          const result = await supabase
            .from("information_schema.columns")
            .select("column_name, data_type, is_nullable, column_default")
            .eq("table_schema", "public")
            .eq("table_name", tableName)
            .order("ordinal_position");

          schemaData = result.data;
          error = result.error;
          console.log(`Information schema result for ${tableName}:`, {
            data: schemaData,
            error,
          });
        } catch (infoError) {
          console.log(`Information schema failed for ${tableName}:`, infoError);
        }

        if (!error && schemaData && schemaData.length > 0) {
          schemas[tableName] = schemaData;
        } else {
          console.log(`Trying fallback method for ${tableName}`);

          // Method 2: Try to get actual data and extract structure
          const { data: sampleData, error: sampleError } = await supabase
            .from(tableName)
            .select("*")
            .limit(1);

          if (!sampleError && sampleData && sampleData.length > 0) {
            // Extract column names from actual data
            const columns = Object.keys(sampleData[0]).map((col) => ({
              column_name: col,
              data_type:
                typeof sampleData[0][col] === "string"
                  ? "text"
                  : typeof sampleData[0][col] === "number"
                    ? "numeric"
                    : sampleData[0][col] instanceof Date
                      ? "timestamp"
                      : sampleData[0][col] === null
                        ? "unknown"
                        : "unknown",
              is_nullable: sampleData[0][col] === null ? "YES" : "NO",
              column_default: null,
            }));
            schemas[tableName] = columns;
            console.log(`Fallback successful for ${tableName}:`, columns);
          } else {
            console.log(`Sample data failed for ${tableName}:`, sampleError);

            // Method 3: Try empty select to get error with column info
            try {
              const { error: emptyError } = await supabase
                .from(tableName)
                .select("*")
                .limit(0);

              if (!emptyError) {
                // If no error but no data, we can't determine structure
                schemas[tableName] = [
                  {
                    column_name: "Tabel bestaat maar is leeg",
                    data_type: "unknown",
                    is_nullable: "unknown",
                    column_default: null,
                  },
                ];
              } else {
                console.log(`Empty select error for ${tableName}:`, emptyError);
                schemas[tableName] = [];
              }
            } catch (emptyErr) {
              console.log(`Empty select failed for ${tableName}:`, emptyErr);
              schemas[tableName] = [];
            }
          }
        }
      } catch (err) {
        console.error(`Complete error for ${tableName}:`, err);
        schemas[tableName] = [];
      }
    }

    console.log("Final schemas:", schemas);
    setTableSchemas(schemas);
    setLoadingSchemas(false);
  }

  async function inspectBuckets() {
    setLoadingBuckets(true);
    try {
      console.log("Testing storage bucket access...");

      // Test direct toegang tot safety-docs bucket
      const { data: files, error } = await supabase.storage
        .from("safety-docs")
        .list("", { limit: 1 });

      if (error) {
        console.error("Error accessing safety-docs bucket:", error);
        setBuckets([
          {
            name: "safety-docs",
            accessible: false,
            error: error.message,
            id: "test",
            created_at: new Date().toISOString(),
          },
        ]);
      } else {
        console.log("Safety-docs bucket accessible, files:", files);
        setBuckets([
          {
            name: "safety-docs",
            accessible: true,
            files: files?.length || 0,
            id: "safety-docs",
            created_at: new Date().toISOString(),
            public: true, // Assume public based on successful access
          },
        ]);
      }
    } catch (err: any) {
      console.error("Bucket test failed:", err);
      setBuckets([
        {
          name: "safety-docs",
          accessible: false,
          error: err.message || "Onbekende fout",
          id: "test",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoadingBuckets(false);
    }
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          Supabase Verbinding Test
        </h1>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Verbindingsstatus
          </h2>

          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-gray-600">Verbinding testen...</span>
            </div>
          ) : status ? (
            <div>
              <div
                className={`flex items-center mb-3 ${
                  status.connected ? "text-green-600" : "text-red-600"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full mr-3 ${
                    status.connected ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="font-medium">
                  {status.connected ? "Verbonden" : "Niet verbonden"}
                </span>
              </div>

              {status.details && (
                <p className="text-gray-600 mb-3">{status.details}</p>
              )}

              {status.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-red-800 font-medium">Fout:</p>
                  <p className="text-red-700">{status.error}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-600">Onbekende status</p>
          )}
        </div>

        {tableTests.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Tabel Toegankelijkheid
            </h2>
            <div className="space-y-3">
              {tableTests.map((test) => (
                <div
                  key={test.name}
                  className={`flex items-center justify-between p-3 rounded ${
                    test.accessible
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`w-3 h-3 rounded-full mr-3 ${
                        test.accessible ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span className="font-medium">{test.name}</span>
                  </div>
                  <div className="text-sm">
                    {test.accessible ? (
                      <span className="text-green-700">Toegankelijk</span>
                    ) : (
                      <span className="text-red-700">
                        {test.needsRLS
                          ? "RLS policy vereist"
                          : "Niet toegankelijk"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {tableTests.some((t) => t.needsRLS) && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">
                  RLS Policy Instellen
                </h3>
                <p className="text-yellow-700 text-sm mb-3">
                  Je tabellen hebben RLS (Row Level Security) ingeschakeld maar
                  geen policies. Voeg deze policies toe in je Supabase
                  dashboard:
                </p>
                <div className="bg-yellow-100 rounded p-3 text-sm font-mono">
                  <div className="mb-2">-- Voor artikelen tabel:</div>
                  <div className="mb-2">
                    ALTER TABLE artikelen ENABLE ROW LEVEL SECURITY;
                  </div>
                  <div className="mb-4">
                    CREATE POLICY "Allow public read access" ON artikelen FOR
                    SELECT USING (true);
                  </div>

                  <div className="mb-2">-- Voor veiligheidsbladen tabel:</div>
                  <div className="mb-2">
                    ALTER TABLE veiligheidsbladen ENABLE ROW LEVEL SECURITY;
                  </div>
                  <div>
                    CREATE POLICY "Allow public read access" ON
                    veiligheidsbladen FOR SELECT USING (true);
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {Object.keys(tableData).length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Tabel Data Inspectie
            </h2>
            {Object.entries(tableData).map(([tableName, rows]) => (
              <div key={tableName} className="mb-6">
                <h3 className="text-lg font-medium mb-3 text-gray-700 capitalize">
                  {tableName} ({rows.length} records)
                </h3>
                {rows.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded">
                      <thead className="bg-gray-100">
                        <tr>
                          {Object.keys(rows[0]).map((column) => (
                            <th
                              key={column}
                              className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, index) => (
                          <tr key={index} className="border-b">
                            {Object.values(row).map((value: any, cellIndex) => (
                              <td
                                key={cellIndex}
                                className="px-4 py-2 text-sm text-gray-600"
                              >
                                {typeof value === "object" && value !== null
                                  ? JSON.stringify(value)
                                  : String(value || "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Geen data gevonden</p>
                )}
              </div>
            ))}
          </div>
        )}

        {Object.keys(tableSchemas).length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Tabel Schema's
            </h2>
            {Object.entries(tableSchemas).map(([tableName, columns]) => (
              <div key={tableName} className="mb-6">
                <h3 className="text-lg font-medium mb-3 text-gray-700 capitalize">
                  {tableName} Schema ({columns.length} kolommen)
                </h3>
                {columns.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                            Kolom Naam
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                            Data Type
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                            Nullable
                          </th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                            Default
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {columns.map((column, index) => (
                          <tr key={index} className="border-b">
                            <td className="px-4 py-2 text-sm font-mono text-gray-800">
                              {column.column_name}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {column.data_type}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              <span
                                className={`px-2 py-1 rounded text-xs ${
                                  column.is_nullable === "YES"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {column.is_nullable === "YES" ? "Ja" : "Nee"}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600 font-mono">
                              {column.column_default || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">
                    Schema niet beschikbaar
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {buckets.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Storage Buckets
            </h2>
            {buckets[0]?.error ? (
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <p className="text-red-800 font-medium">
                  Fout bij ophalen buckets:
                </p>
                <p className="text-red-700 text-sm">{buckets[0].error}</p>
              </div>
            ) : buckets.length === 0 ? (
              <p className="text-gray-500 italic">
                Geen storage buckets gevonden
              </p>
            ) : (
              <div className="space-y-3">
                {buckets.map((bucket, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {bucket.name}
                        </h3>
                        <p className="text-sm text-gray-600">ID: {bucket.id}</p>
                        {bucket.public && (
                          <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            Publiek
                          </span>
                        )}
                        {!bucket.public && (
                          <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                            Privé
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Gemaakt:{" "}
                        {new Date(bucket.created_at).toLocaleDateString(
                          "nl-NL",
                        )}
                      </div>
                    </div>
                    {bucket.name === "safety-docs" && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <p className="text-green-800 text-sm font-medium">
                          ✓ Dit is de bucket die de applicatie gebruikt!
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                {!buckets.some((b) => b.name === "safety-docs") && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                    <p className="text-yellow-800 font-medium">
                      ⚠️ Bucket "safety-docs" niet gevonden
                    </p>
                    <p className="text-yellow-700 text-sm mt-1">
                      De applicatie verwacht een bucket genaamd
                      &quot;safety-docs&quot; voor het opslaan van
                      veiligheidsbladen. Je kunt deze aanmaken in je Supabase
                      dashboard onder Storage &gt; Buckets.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-900">
            Configuratie Checklist
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-center">
              <span className="text-blue-600 mr-2">✓</span>
              Supabase client geïnstalleerd (@supabase/supabase-js)
            </li>
            <li className="flex items-center">
              <span className="text-blue-600 mr-2">✓</span>
              Client configuratie aangemaakt (src/lib/supabase.ts)
            </li>
            <li className="flex items-center">
              <span className="text-blue-600 mr-2">•</span>
              Environment variabelen ingesteld in .env.local
            </li>
            <li className="flex items-center">
              <span className="text-blue-600 mr-2">•</span>
              NEXT_PUBLIC_SUPABASE_URL ingevuld
            </li>
            <li className="flex items-center">
              <span className="text-blue-600 mr-2">•</span>
              NEXT_PUBLIC_SUPABASE_ANON_KEY ingevuld
            </li>
          </ul>
        </div>

        <div className="mt-8">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Opnieuw testen
          </button>
          <button
            onClick={inspectTables}
            disabled={inspectingTables || !status?.connected}
            className="ml-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {inspectingTables ? "Tabellen onderzoeken..." : "Bekijk Tabel Data"}
          </button>
          <button
            onClick={inspectSchemas}
            disabled={loadingSchemas || !status?.connected}
            className="ml-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {loadingSchemas ? "Schema laden..." : "Bekijk Schema's"}
          </button>
          <button
            onClick={inspectBuckets}
            disabled={loadingBuckets || !status?.connected}
            className="ml-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {loadingBuckets ? "Buckets laden..." : "Bekijk Storage Buckets"}
          </button>
          <a
            href="/"
            className="ml-4 text-blue-600 hover:text-blue-800 font-medium"
          >
            Terug naar home
          </a>
        </div>
      </div>
    </div>
  );
}
