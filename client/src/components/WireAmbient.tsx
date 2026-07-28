/** Soft site-wide wire network — faint so text stays readable. */
export function WireAmbient() {
  return (
    <div className="wire-ambient" aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cbcAmbientGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#083d65" />
            <stop offset="45%" stopColor="#08f4df" />
            <stop offset="100%" stopColor="#0c82c2" />
          </linearGradient>
          <filter id="cbcAmbientPulse" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="cbcAmbientNode" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g fill="none" stroke="url(#cbcAmbientGrad)" strokeWidth="1.1" vectorEffect="nonScalingStroke">
          <path className="wire-line" d="M-80 180 C220 120 380 320 620 200 S1000 80 1520 240" />
          <path className="wire-line" d="M-60 480 C280 420 420 620 700 500 S1100 380 1500 560" />
          <path className="wire-line wire-line--faint" d="M-40 720 C300 680 480 780 760 640 S1120 720 1500 780" />
          <path className="wire-line wire-line--faint" d="M200 -40 C360 200 280 420 520 560 S900 700 1280 920" />
          <path className="wire-line" d="M900 -60 C980 180 860 360 1100 500 S1300 700 1480 860" />
        </g>

        <g
          fill="none"
          stroke="#dffffb"
          strokeWidth="2.4"
          strokeLinecap="round"
          filter="url(#cbcAmbientPulse)"
        >
          <path className="wire-pulse" d="M-80 180 C220 120 380 320 620 200 S1000 80 1520 240" />
          <path
            className="wire-pulse wire-pulse--3"
            d="M-60 480 C280 420 420 620 700 500 S1100 380 1500 560"
          />
          <path
            className="wire-pulse wire-pulse--5"
            d="M200 -40 C360 200 280 420 520 560 S900 700 1280 920"
          />
        </g>

        <g fill="#09f7df" filter="url(#cbcAmbientNode)">
          <circle className="wire-node" cx="420" cy="240" r="2.5" />
          <circle className="wire-node" cx="700" cy="500" r="3" />
          <circle className="wire-node" cx="980" cy="180" r="2.5" />
          <circle className="wire-node" cx="1100" cy="500" r="2.8" />
          <circle className="wire-node" cx="560" cy="580" r="2.2" />
        </g>
      </svg>
    </div>
  );
}
