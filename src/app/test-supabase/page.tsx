"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ConnectionStatus {
  connected: boolean;
  error?: string;
  details?: any;
}

interface TableTestResult {
  name: string;
  accessible: boolean;
  error?: string;
  needsRLS?: boolean;
}

export default function TestSupabasePage() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [tableTests, setTableTests] = useState<TableTestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function testConnection() {
      try {
        // Test de verbinding door de auth sessie op te halen
        const { data: authData, error: authError } =
          await supabase.auth.getSession();

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
            const { data, error } = await supabase
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
