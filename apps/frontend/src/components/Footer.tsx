import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Heart, Facebook, Instagram } from 'lucide-react';
import { Button } from './ui/Button';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer
      className="bg-slate-800 text-white py-14 mt-auto"
      aria-label="Footer"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:justify-center md:items-center gap-10">
        <div className="flex justify-center items-center md:w-1/3 min-h-[120px]">
          <Link
            to="/"
            className="flex items-center mb-4"
          >
            <img src="/logo.svg" alt="CzyDojade Logo" className="h-16 w-auto filter brightness-0 invert" />
          </Link>
        </div>

        <div className="md:w-1/3 md:flex md:justify-end">

          <div className="flex flex-row gap-16">

            {/* Account Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Account</h3>
              <div className="flex flex-col gap-3">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="text-sm text-slate-300 hover:text-white transition-colors justify-start p-0 h-auto"
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/login?tab=register')}
                  className="text-sm bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 transition-all duration-300 font-semibold text-white rounded-md w-fit"
                >
                  Sign Up
                </Button>
              </div>
            </div>
            
            {/* Contact Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">Contact</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-slate-300">
                  <Mail className="h-4 w-4 text-teal-400" />
                  <a
                    href="mailto:contact@czydojade.pl"
                    className="hover:text-teal-400 transition-colors"
                  >
                    contact@czydojade.pl
                  </a>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <Phone className="h-4 w-4 text-teal-400" />
                  <a
                    href="tel:+48123456789"
                    className="hover:text-teal-400 transition-colors"
                  >
                    +48 123 456 789
                  </a>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <MapPin className="h-4 w-4 text-teal-400" />
                  <a
                    href="https://maps.google.com/?q=Cracow, Poland"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-teal-400 transition-colors"
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
                    className="text-slate-300 hover:text-teal-400 transition-colors"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                  <a
                    href="https://instagram.com/czydojade"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="text-slate-300 hover:text-teal-400 transition-colors"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>

            
          </div>
        </div>
      </div>

      <div className="border-t border-slate-700 mt-10 pt-6 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-300 text-sm">
          <span>© 2025 CzyDojade. All rights reserved.</span>
          <Heart className="h-4 w-4 text-teal-400" />
        </div>
      </div>
    </footer>
  );
}
