import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-[#051e50] border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <Image
                src="/RUBIX_logo_white.svg"
                alt="Rubix"
                width={106}
                height={30}
                className="h-[30px] w-auto"
              />
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Rubix is uw partner voor industriële onderdelen en diensten. Wij
              zorgen voor veilige en betrouwbare oplossingen voor uw bedrijf.
            </p>
            <p className="text-gray-400 text-xs">
              © {new Date().getFullYear()} Rubix. Alle rechten voorbehouden.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Snelle Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/bulk"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Bulk Import/Export
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://www.rubix.com/nl/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="https://www.rubix.com/nl/support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Technische Support
                </a>
              </li>
              <li>
                <a
                  href="https://www.rubix.com/nl/veiligheid"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-300 hover:text-white text-sm transition-colors"
                >
                  Veiligheidsinformatie
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Border */}
        <div className="border-t border-gray-600 mt-8 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-xs mb-2 sm:mb-0">
              Veiligheidsdocumentatie systeem - Versie 1.0
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.rubix.com/nl/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-300 text-xs transition-colors"
              >
                Privacybeleid
              </a>
              <a
                href="https://www.rubix.com/nl/algemene-voorwaarden"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-300 text-xs transition-colors"
              >
                Algemene Voorwaarden
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
