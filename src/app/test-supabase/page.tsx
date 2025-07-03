"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ConnectionStatus {
  connected: boolean;
  error?: string;
  details?: any;
}

export default function TestSupabasePage() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
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
          return;
        }

        // Test ook de database verbinding door alle tabellen op te halen
        const { data: tables, error: tablesError } = await supabase
          .from("information_schema.tables")
          .select("table_name")
          .eq("table_schema", "public")
          .limit(10);

        if (tablesError) {
          // Probeer een alternatieve methode als information_schema niet werkt
          const { data: fallbackData, error: fallbackError } =
            await supabase.rpc("version");

          if (fallbackError) {
            setStatus({
              connected: true,
              details:
                "Verbinding succesvol! (Database query beperkt, maar verbinding werkt)",
              error: `Tabel info niet toegankelijk: ${tablesError.message}`,
            });
          } else {
            setStatus({
              connected: true,
              details: "Verbinding succesvol! Database is bereikbaar.",
            });
          }
        } else {
          const tableCount = tables?.length || 0;
          setStatus({
            connected: true,
            details: `Verbinding succesvol! ${tableCount} publieke tabellen gevonden.`,
          });
        }
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
