import { Link, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from '@/components/ui/Menubar';
import { Button } from './ui/Button';

export default function Header() {
  const { userData } = useContext(AuthContext);
  const navigate = useNavigate();

  const initial = (userData?.email?.[0] || 'U').toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="flex items-center px-4 sm:px-6 lg:px-8 py-2">
        <div className="w-48 flex items-center">
          <Link
            to={'/'}
            className="flex items-center"
          >
            <img
              src="/logo.svg"
              alt="CzyDojade Logo"
              className="h-8 w-48 filter brightness-0 invert"
            />
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-end">
          {userData ? (
            <div className="flex justify-end">
              <Menubar className="rounded-none space-x-0 border-none bg-transparent data-[state=open]:bg-transparent">
                <MenubarMenu>
                  <MenubarTrigger
                    omitOpenBg
                    className="h-10 w-10 rounded-full overflow-hidden bg-gray-800 ring-2 ring-gray-600 hover:ring-white transition-all duration-300 p-0 cursor-pointer hover:scale-105 border-0 focus:outline-none data-[state=open]:bg-gray-800"
                  >
                    <span className="h-full w-full flex items-center justify-center text-sm font-semibold text-white">
                      {initial}
                    </span>
                  </MenubarTrigger>
                  <MenubarContent className="bg-gray-900 border-white/10">
                    <MenubarItem
                      onClick={() => {
                        navigate('/logout');
                      }}
                      className="pt-2 text-gray-300 hover:text-white hover:bg-gray-800 cursor-pointer flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Wyloguj
                    </MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate('/login')}
                className="text-sm text-gray-300 hover:text-white transition-colors px-3"
              >
                Zaloguj
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/login?tab=register')}
                className="text-sm bg-white text-black hover:bg-gray-200 transition-all duration-300 font-semibold rounded-lg shadow-lg hover:shadow-xl hover:scale-105 px-4"
              >
                Rejestracja
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
