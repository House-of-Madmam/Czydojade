import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Heart, Facebook, Instagram } from 'lucide-react';
import { Button } from './ui/Button';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer
      className="bg-black border-t border-white/10 text-white py-16 mt-auto"
      aria-label="Footer"
    >
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row lg:justify-center lg:items-center gap-8 lg:gap-10">
        <div className="flex justify-center items-center lg:w-1/3 min-h-[80px] lg:min-h-[120px]">
          <Link
            to="/"
            className="flex items-center mb-4 transform hover:scale-105 transition-transform duration-300"
          >
            <img src="/logo.svg" alt="CzyDojade Logo" className="h-16 w-auto filter brightness-0 invert" />
          </Link>
        </div>

        <div className="w-full flex justify-center md:w-1/3 md:flex md:justify-end">

        <div className="flex flex-row gap-16">

            {/* Account Section */}
            <div>
              <h3 className="text-lg font-bold mb-5 text-white">Konto</h3>
              <div className="flex flex-col gap-4">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="text-sm text-gray-400 hover:text-white transition-colors justify-start p-0 h-auto"
                >
                  Zaloguj
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate('/login?tab=register')}
                  className="text-sm text-gray-400 hover:text-white transition-colors justify-start p-0 h-auto"
                >
                  Rejestracja
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate('/about#faq')}
                  className="text-sm text-gray-400 hover:text-white transition-colors justify-start p-0 h-auto"
                >
                  FAQ
                </Button>
              </div>
            </div>

            {/* Contact Section */}
            <div>
              <h3 className="text-lg font-bold mb-4 text-white">Kontakt</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-400">
                  <Mail className="h-4 w-4 text-white" />
                  <a
                    href="mailto:kontakt@czydojade.pl"
                    className="hover:text-white transition-colors"
                  >
                    kontakt@czydojade.pl
                  </a>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <Phone className="h-4 w-4 text-white" />
                  <a
                    href="tel:+48123456789"
                    className="hover:text-white transition-colors"
                  >
                    +48 123 456 789
                  </a>
                </div>
                <div className="flex items-center gap-3 text-gray-400">
                  <MapPin className="h-4 w-4 text-white" />
                  <a
                    href="https://maps.google.com/?q=Cracow, Poland"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Cracow, Poland
                  </a>
                </div>
                <div className="flex items-center gap-4 pt-3">
                  <a
                    href="https://facebook.com/czydojade"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a
                    href="https://instagram.com/czydojade"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="text-gray-400 hover:text-white transition-all duration-300 hover:scale-110"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 mt-12 pt-8 text-center">
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
          <span>© 2025 CzyDojade. All rights reserved.</span>
          <Heart className="h-4 w-4 text-white animate-pulse" />
        </div>
      </div>
    </footer>
  );
}
