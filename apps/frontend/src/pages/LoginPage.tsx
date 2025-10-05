import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

export default function LoginPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(tab === 'register' ? 'register' : 'login');
  const [isRegistrationSuccess, setIsRegistrationSuccess] = useState(false);

  useEffect(() => {
    if (tab === 'register') {
      setActiveTab('register');
    } else {
      setActiveTab('login');
    }
    // Reset registration success when changing tabs
    setIsRegistrationSuccess(false);
  }, [tab]);

  const handleTabChange = (newTab: 'login' | 'register') => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
    setIsRegistrationSuccess(false);
  };

  const handleRegistrationSuccess = () => {
    setIsRegistrationSuccess(true);
  };

  const handleBackToLogin = () => {
    setIsRegistrationSuccess(false);
    setActiveTab('login');
    setSearchParams({ tab: 'login' });
  };

  const getTabContent = () => {
    if (activeTab === 'login') {
      return {
        title: 'Zaloguj się do konta',
        content: <LoginForm />,
      };
    }

    if (activeTab === 'register') {
      if (isRegistrationSuccess) {
        return {
          title: 'Konto utworzone pomyślnie!',
          content: (
            <div className="px-6 text-center space-y-6">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <svg
                    className="w-10 h-10 text-black"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">Witamy!</h3>
                <p className="text-white/70">
                  Twoje konto zostało pomyślnie utworzone. Możesz teraz zalogować się swoimi danymi.
                </p>
              </div>
              <button
                onClick={handleBackToLogin}
                className="w-full h-12 bg-white text-black hover:bg-white/90 font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Powrót do logowania
              </button>
            </div>
          ),
        };
      }
      return {
        title: 'Utwórz konto',
        content: <RegisterForm onSuccess={handleRegistrationSuccess} />,
      };
    }

    return { title: '', content: null };
  };

  const { title, content } = getTabContent();

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex justify-center pt-32">
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-black"></div>

      <div className="relative z-10 w-full max-w-md space-y-8 px-4">
        {/* Header */}
        <div className="text-center flex flex-col justify-end pb-3">
          <h2 className="text-4xl font-bold text-white leading-tight drop-shadow-2xl">{title}</h2>
        </div>

        {/* Tab Navigation */}
        {!isRegistrationSuccess && (
          <div className="flex justify-center">
            <div className="bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/20 shadow-2xl">
              <button
                className={`px-8 py-3 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
                onClick={() => handleTabChange('login')}
              >
                Logowanie
              </button>
              <button
                className={`px-8 py-3 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-white text-black shadow-lg scale-105'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
                onClick={() => handleTabChange('register')}
              >
                Rejestracja
              </button>
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8">{content}</div>
      </div>
    </div>
  );
}
