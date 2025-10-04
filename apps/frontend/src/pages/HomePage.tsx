import { Link } from 'react-router-dom';
import AnimatedMap from '../components/AnimatedMap';

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      {/* Full Screen Animated Map */}
      <AnimatedMap />

      {/* Dark overlay for better text visibility */}
      <div className="absolute inset-0 z-5 bg-gradient-to-b from-black/40 via-black/50 to-black/60"></div>

      {/* Content Overlay */}
      <div className="relative z-20 min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 tracking-tight drop-shadow-2xl">
            Czydojade
            </h1>
          <p className="text-xl md:text-3xl text-white mb-10 font-light drop-shadow-lg">
            Sprawdź czy dojedziesz
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button className="px-10 py-4 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105">
              Rozpocznij podróż
            </button>
            <Link 
              to="/about"
              className="px-10 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:text-gray-800 transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 text-center"
            >
              Dowiedz się więcej
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
