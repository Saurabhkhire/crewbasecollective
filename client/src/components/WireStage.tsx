/** Hero wire network — traveling pulse lights via stroke-dashoffset. */
export function WireStage() {
  return (
    <div className="wire-stage" aria-hidden="true">
      <svg viewBox="0 0 1200 620" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="cbcWireGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#083d65" />
            <stop offset="50%" stopColor="#08f4df" />
            <stop offset="100%" stopColor="#0c82c2" />
          </linearGradient>
          <filter id="cbcPulseGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="cbcNodeGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g fill="none" stroke="url(#cbcWireGrad)" strokeWidth="1.35" vectorEffect="nonScalingStroke">
          <path className="wire-line" d="M-40 420 C180 390 270 170 485 310 S820 410 1240 120" />
          <path className="wire-line" d="M-20 500 C220 480 295 240 520 350 S900 300 1240 180" />
          <path className="wire-line" d="M-60 345 C230 330 270 460 515 300 S860 145 1260 260" />
          <path className="wire-line" d="M-10 275 C240 240 340 420 560 250 S950 220 1240 70" />
          <path className="wire-line" d="M-40 570 C270 510 350 310 610 430 S940 520 1260 310" />
          <path className="wire-line" d="M-30 210 C230 190 320 350 560 215 S920 130 1240 360" />
          <path className="wire-line wire-line--faint" d="M0 450 C280 370 310 520 600 310 S900 160 1200 210" />
          <path className="wire-line wire-line--faint" d="M0 330 C250 260 390 410 640 270 S920 390 1200 300" />
          <path className="wire-line wire-line--faint" d="M0 530 C290 560 430 380 680 450 S1000 240 1200 150" />
        </g>

        <g
          fill="none"
          stroke="#dffffb"
          strokeWidth="3.2"
          strokeLinecap="round"
          filter="url(#cbcPulseGlow)"
        >
          <path className="wire-pulse" d="M-40 420 C180 390 270 170 485 310 S820 410 1240 120" />
          <path className="wire-pulse wire-pulse--2" d="M-20 500 C220 480 295 240 520 350 S900 300 1240 180" />
          <path className="wire-pulse wire-pulse--3" d="M-60 345 C230 330 270 460 515 300 S860 145 1260 260" />
          <path className="wire-pulse wire-pulse--4" d="M-10 275 C240 240 340 420 560 250 S950 220 1240 70" />
          <path className="wire-pulse wire-pulse--5" d="M-40 570 C270 510 350 310 610 430 S940 520 1260 310" />
          <path className="wire-pulse wire-pulse--6" d="M-30 210 C230 190 320 350 560 215 S920 130 1240 360" />
        </g>

        <g fill="#09f7df" filter="url(#cbcNodeGlow)">
          <circle className="wire-node" cx="470" cy="300" r="3.5" />
          <circle className="wire-node" cx="650" cy="342" r="4" />
          <circle className="wire-node" cx="790" cy="293" r="3" />
          <circle className="wire-node" cx="930" cy="224" r="4" />
          <circle className="wire-node" cx="1050" cy="183" r="3.5" />
          <circle className="wire-node" cx="570" cy="248" r="3" />
          <circle className="wire-node" cx="845" cy="394" r="3.5" />
        </g>
      </svg>
    </div>
  );
}
