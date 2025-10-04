export default function AnimatedMap() {
  return (
    <div className="absolute inset-0 z-0">
      <svg
        viewBox="0 0 1600 1000"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Camera panning animation - slow and smooth */}
        <animateTransform
          attributeName="viewBox"
          attributeType="XML"
          type="translate"
          values="0 0; 40 25; 80 50; 120 70; 160 80; 120 70; 80 50; 40 25; 0 0"
          dur="35s"
          repeatCount="indefinite"
        />

        <defs>
          {/* Elliptical fade mask */}
          <mask id="fadeMask">
            <ellipse cx="800" cy="500" rx="750" ry="480" fill="url(#fadeGradient)"/>
          </mask>
          <radialGradient id="fadeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white"/>
            <stop offset="55%" stopColor="white"/>
            <stop offset="80%" stopColor="#999"/>
            <stop offset="100%" stopColor="black"/>
          </radialGradient>
        </defs>

        {/* Map content with mask */}
        <g mask="url(#fadeMask)">
          {/* Background - dark gray like Google Maps dark mode */}
          <rect width="3200" height="2000" x="-800" y="-500" fill="#242424"/>
          
          {/* City blocks - representing buildings/areas */}
          <rect x="100" y="100" width="220" height="170" fill="#181818" rx="2"/>
          <rect x="380" y="80" width="200" height="210" fill="#181818" rx="2"/>
          <rect x="640" y="120" width="240" height="180" fill="#181818" rx="2"/>
          <rect x="940" y="90" width="210" height="190" fill="#181818" rx="2"/>
          <rect x="1200" y="110" width="220" height="180" fill="#181818" rx="2"/>
          
          <rect x="80" y="360" width="230" height="200" fill="#181818" rx="2"/>
          <rect x="370" y="340" width="210" height="210" fill="#181818" rx="2"/>
          <rect x="640" y="360" width="220" height="190" fill="#181818" rx="2"/>
          <rect x="920" y="350" width="230" height="200" fill="#181818" rx="2"/>
          <rect x="1200" y="340" width="210" height="210" fill="#181818" rx="2"/>
          
          <rect x="100" y="640" width="210" height="180" fill="#181818" rx="2"/>
          <rect x="370" y="630" width="220" height="200" fill="#181818" rx="2"/>
          <rect x="640" y="650" width="230" height="170" fill="#181818" rx="2"/>
          <rect x="930" y="640" width="220" height="180" fill="#181818" rx="2"/>
          <rect x="1200" y="630" width="210" height="200" fill="#181818" rx="2"/>
          
          {/* Main roads - realistic Google Maps style */}
          {/* Horizontal main roads */}
          <rect x="-100" y="300" width="2200" height="26" fill="#3a3a3a" rx="1"/>
          <line x1="-100" y1="313" x2="2100" y2="313" stroke="#686820" strokeWidth="1" strokeDasharray="25,18" opacity="0.6"/>
          
          <rect x="-100" y="580" width="2200" height="26" fill="#3a3a3a" rx="1"/>
          <line x1="-100" y1="593" x2="2100" y2="593" stroke="#686820" strokeWidth="1" strokeDasharray="25,18" opacity="0.6"/>
          
          {/* Vertical main roads */}
          <rect x="340" y="-100" width="26" height="1400" fill="#3a3a3a" rx="1"/>
          <line x1="353" y1="-100" x2="353" y2="1300" stroke="#686820" strokeWidth="1" strokeDasharray="25,18" opacity="0.6"/>
          
          <rect x="620" y="-100" width="26" height="1400" fill="#3a3a3a" rx="1"/>
          <line x1="633" y1="-100" x2="633" y2="1300" stroke="#686820" strokeWidth="1" strokeDasharray="25,18" opacity="0.6"/>
          
          <rect x="900" y="-100" width="26" height="1400" fill="#3a3a3a" rx="1"/>
          <line x1="913" y1="-100" x2="913" y2="1300" stroke="#686820" strokeWidth="1" strokeDasharray="25,18" opacity="0.6"/>
          
          <rect x="1180" y="-100" width="26" height="1400" fill="#3a3a3a" rx="1"/>
          <line x1="1193" y1="-100" x2="1193" y2="1300" stroke="#686820" strokeWidth="1" strokeDasharray="25,18" opacity="0.6"/>
          
          {/* Secondary roads */}
          <rect x="-100" y="160" width="2200" height="16" fill="#323232" rx="0.5"/>
          <rect x="-100" y="740" width="2200" height="16" fill="#323232" rx="0.5"/>
          <rect x="180" y="-100" width="16" height="1400" fill="#323232" rx="0.5"/>
          <rect x="760" y="-100" width="16" height="1400" fill="#323232" rx="0.5"/>
          <rect x="1340" y="-100" width="16" height="1400" fill="#323232" rx="0.5"/>
          
          {/* Moving vehicles - realistic traffic along roads */}
          {/* Horizontal traffic on main road 1 */}
          <circle r="3" fill="#4fc3f7">
            <animateMotion dur="12s" repeatCount="indefinite">
              <mpath href="#road1"/>
            </animateMotion>
          </circle>
          <circle r="3" fill="#66bb6a">
            <animateMotion dur="15s" repeatCount="indefinite" begin="2s">
              <mpath href="#road1"/>
            </animateMotion>
          </circle>
          <circle r="3" fill="#ffa726">
            <animateMotion dur="13s" repeatCount="indefinite" begin="5s">
              <mpath href="#road1"/>
            </animateMotion>
          </circle>
          <circle r="3" fill="#ef5350">
            <animateMotion dur="14s" repeatCount="indefinite" begin="8s">
              <mpath href="#road1"/>
            </animateMotion>
          </circle>
          
          {/* Horizontal traffic on main road 2 */}
          <circle r="3" fill="#42a5f5">
            <animateMotion dur="11s" repeatCount="indefinite">
              <mpath href="#road2"/>
            </animateMotion>
          </circle>
          <circle r="3" fill="#66bb6a">
            <animateMotion dur="13s" repeatCount="indefinite" begin="3s">
              <mpath href="#road2"/>
            </animateMotion>
          </circle>
          <circle r="3" fill="#ffca28">
            <animateMotion dur="12s" repeatCount="indefinite" begin="6s">
              <mpath href="#road2"/>
            </animateMotion>
          </circle>
          
          {/* Vertical traffic on road 3 */}
          <circle r="3" fill="#7e57c2">
            <animateMotion dur="10s" repeatCount="indefinite">
              <mpath href="#road3"/>
            </animateMotion>
          </circle>
          <circle r="3" fill="#26a69a">
            <animateMotion dur="12s" repeatCount="indefinite" begin="2s">
              <mpath href="#road3"/>
            </animateMotion>
          </circle>
          <circle r="3" fill="#ec407a">
            <animateMotion dur="11s" repeatCount="indefinite" begin="5s">
              <mpath href="#road3"/>
            </animateMotion>
          </circle>
          
          {/* Vertical traffic on road 4 */}
          <circle r="3" fill="#5c6bc0">
            <animateMotion dur="13s" repeatCount="indefinite">
              <mpath href="#road4"/>
            </animateMotion>
          </circle>
          <circle r="3" fill="#26c6da">
            <animateMotion dur="11s" repeatCount="indefinite" begin="3s">
              <mpath href="#road4"/>
            </animateMotion>
          </circle>
          <circle r="3" fill="#ffa726">
            <animateMotion dur="14s" repeatCount="indefinite" begin="7s">
              <mpath href="#road4"/>
            </animateMotion>
          </circle>
          
          {/* Vertical traffic on road 5 */}
          <circle r="3" fill="#ab47bc">
            <animateMotion dur="12s" repeatCount="indefinite">
              <mpath href="#road5"/>
            </animateMotion>
          </circle>
          <circle r="3" fill="#29b6f6">
            <animateMotion dur="10s" repeatCount="indefinite" begin="4s">
              <mpath href="#road5"/>
            </animateMotion>
          </circle>
          
          {/* Vertical traffic on road 6 */}
          <circle r="3" fill="#8d6e63">
            <animateMotion dur="11s" repeatCount="indefinite">
              <mpath href="#road6"/>
            </animateMotion>
          </circle>
          <circle r="3" fill="#78909c">
            <animateMotion dur="13s" repeatCount="indefinite" begin="5s">
              <mpath href="#road6"/>
            </animateMotion>
          </circle>
          
          {/* Reverse direction traffic */}
          <circle r="3" fill="#ff7043">
            <animateMotion dur="14s" repeatCount="indefinite">
              <mpath href="#road1rev"/>
            </animateMotion>
          </circle>
          <circle r="3" fill="#9ccc65">
            <animateMotion dur="12s" repeatCount="indefinite" begin="4s">
              <mpath href="#road1rev"/>
            </animateMotion>
          </circle>
          <circle r="3" fill="#42a5f5">
            <animateMotion dur="13s" repeatCount="indefinite">
              <mpath href="#road2rev"/>
            </animateMotion>
          </circle>
          <circle r="3" fill="#ffa726">
            <animateMotion dur="11s" repeatCount="indefinite" begin="2s">
              <mpath href="#road2rev"/>
            </animateMotion>
          </circle>
          
          <circle r="3" fill="#ce93d8">
            <animateMotion dur="12s" repeatCount="indefinite">
              <mpath href="#road3rev"/>
            </animateMotion>
          </circle>
          <circle r="3" fill="#80deea">
            <animateMotion dur="10s" repeatCount="indefinite" begin="3s">
              <mpath href="#road3rev"/>
            </animateMotion>
          </circle>
          
          <circle r="3" fill="#ffab40">
            <animateMotion dur="13s" repeatCount="indefinite">
              <mpath href="#road4rev"/>
            </animateMotion>
          </circle>
          <circle r="3" fill="#a1887f">
            <animateMotion dur="11s" repeatCount="indefinite" begin="5s">
              <mpath href="#road4rev"/>
            </animateMotion>
          </circle>
          
          {/* Hidden paths for vehicle movement */}
          <path id="road1" d="M -100 308 L 2100 308" fill="none"/>
          <path id="road2" d="M -100 588 L 2100 588" fill="none"/>
          <path id="road3" d="M 353 -100 L 353 1300" fill="none"/>
          <path id="road4" d="M 633 -100 L 633 1300" fill="none"/>
          <path id="road5" d="M 913 -100 L 913 1300" fill="none"/>
          <path id="road6" d="M 1193 -100 L 1193 1300" fill="none"/>
          
          {/* Reverse paths */}
          <path id="road1rev" d="M 2100 318 L -100 318" fill="none"/>
          <path id="road2rev" d="M 2100 598 L -100 598" fill="none"/>
          <path id="road3rev" d="M 360 1300 L 360 -100" fill="none"/>
          <path id="road4rev" d="M 640 1300 L 640 -100" fill="none"/>
        </g>
      </svg>
    </div>
  );
}

