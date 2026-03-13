import { useEffect, useState } from "react";

export default function ArchitectureDiagram() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <svg
        viewBox="0 0 800 600"
        className="w-full h-auto rounded-xl"
        style={{ background: "linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 100%)" }}
      >
        <defs>
          <linearGradient id="registryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9945FF" />
            <stop offset="100%" stopColor="#14F195" />
          </linearGradient>

          <linearGradient id="agentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2d2d4a" />
            <stop offset="100%" stopColor="#1a1a2e" />
          </linearGradient>

          <linearGradient id="meshGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14F195" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#9945FF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#14F195" stopOpacity="0.3" />
          </linearGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background grid */}
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff08" strokeWidth="0.5" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* ===== Solana Devnet Registry ===== */}
        <g transform="translate(200, 30)">
          <rect
            x="0" y="0" width="400" height="140" rx="12"
            fill="none" stroke="url(#registryGradient)" strokeWidth="2" filter="url(#glow)"
          >
            <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite" />
          </rect>

          <rect x="2" y="2" width="396" height="136" rx="10" fill="#0d0d1a" fillOpacity="0.9" />

          <text x="200" y="35" textAnchor="middle" fill="#14F195" fontSize="16" fontWeight="bold" fontFamily="monospace">
            Solana Devnet (ClawNet Registry)
          </text>

          {/* PDA tags */}
          <g transform="translate(30, 55)">
            <rect x="0" y="0" width="100" height="30" rx="6" fill="#9945FF" fillOpacity="0.2" stroke="#9945FF" strokeWidth="1">
              <animate attributeName="fill-opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite" />
            </rect>
            <text x="50" y="20" textAnchor="middle" fill="#9945FF" fontSize="11" fontFamily="monospace">AgentAccount</text>
            <text x="50" y="55" textAnchor="middle" fill="#888" fontSize="10" fontFamily="monospace">PDA ×3</text>

            <rect x="130" y="0" width="100" height="30" rx="6" fill="#14F195" fillOpacity="0.2" stroke="#14F195" strokeWidth="1">
              <animate attributeName="fill-opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite" begin="0.5s" />
            </rect>
            <text x="180" y="20" textAnchor="middle" fill="#14F195" fontSize="11" fontFamily="monospace">SkillAccount</text>
            <text x="180" y="55" textAnchor="middle" fill="#888" fontSize="10" fontFamily="monospace">PDA ×5</text>

            <rect x="260" y="0" width="100" height="30" rx="6" fill="#00D4AA" fillOpacity="0.2" stroke="#00D4AA" strokeWidth="1">
              <animate attributeName="fill-opacity" values="0.2;0.4;0.2" dur="3s" repeatCount="indefinite" begin="1s" />
            </rect>
            <text x="310" y="20" textAnchor="middle" fill="#00D4AA" fontSize="11" fontFamily="monospace">CallRecord</text>
            <text x="310" y="55" textAnchor="middle" fill="#888" fontSize="10" fontFamily="monospace">PDA ×N</text>
          </g>
        </g>

        {/* ===== USDC flow lines ===== */}
        {/* Left USDC */}
        <path d="M 320 170 L 320 220 L 180 280" fill="none" stroke="#2775CA" strokeWidth="2" strokeDasharray="5,5" opacity="0.6" />
        <text x="240" y="210" fill="#2775CA" fontSize="11" fontFamily="monospace" fontWeight="bold">x402 USDC</text>
        <circle r="5" fill="#2775CA" filter="url(#glow)">
          <animateMotion dur="2s" repeatCount="indefinite">
            <mpath href="#path1" />
          </animateMotion>
        </circle>
        <path id="path1" d="M 320 170 L 320 220 L 180 280" fill="none" stroke="none" />

        {/* Right USDC */}
        <path d="M 480 170 L 480 220 L 620 280" fill="none" stroke="#2775CA" strokeWidth="2" strokeDasharray="5,5" opacity="0.6" />
        <text x="520" y="210" fill="#2775CA" fontSize="11" fontFamily="monospace" fontWeight="bold">x402 USDC</text>
        <circle r="5" fill="#2775CA" filter="url(#glow)">
          <animateMotion dur="2s" repeatCount="indefinite" begin="0.5s">
            <mpath href="#path2" />
          </animateMotion>
        </circle>
        <path id="path2" d="M 480 170 L 480 220 L 620 280" fill="none" stroke="none" />

        {/* Center line */}
        <path d="M 400 170 L 400 280" fill="none" stroke="#444" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />

        {/* ===== Agent Alpha ===== */}
        <g transform="translate(80, 290)">
          <rect x="0" y="0" width="160" height="130" rx="10" fill="url(#agentGradient)" stroke="#9945FF" strokeWidth="2">
            <animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
          </rect>
          <rect x="0" y="0" width="160" height="130" rx="10" fill="none" stroke="#9945FF" strokeWidth="2">
            <animate attributeName="stroke-width" values="2;4;2" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          </rect>

          <text x="80" y="30" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="monospace">Agent Alpha</text>
          <text x="80" y="50" textAnchor="middle" fill="#888" fontSize="11" fontFamily="monospace">:3402</text>

          <rect x="20" y="65" width="120" height="22" rx="4" fill="#9945FF" fillOpacity="0.3">
            <animate attributeName="fill-opacity" values="0.3;0.5;0.3" dur="1.5s" repeatCount="indefinite" />
          </rect>
          <text x="80" y="81" textAnchor="middle" fill="#c4a5ff" fontSize="10" fontFamily="monospace">code-review</text>

          <rect x="20" y="95" width="120" height="22" rx="4" fill="#9945FF" fillOpacity="0.3">
            <animate attributeName="fill-opacity" values="0.3;0.5;0.3" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
          </rect>
          <text x="80" y="111" textAnchor="middle" fill="#c4a5ff" fontSize="10" fontFamily="monospace">gen-tests</text>
        </g>

        {/* ===== Agent Beta ===== */}
        <g transform="translate(320, 290)">
          <rect x="0" y="0" width="160" height="130" rx="10" fill="url(#agentGradient)" stroke="#14F195" strokeWidth="2">
            <animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" begin="0.3s" />
          </rect>
          <rect x="0" y="0" width="160" height="130" rx="10" fill="none" stroke="#14F195" strokeWidth="2">
            <animate attributeName="stroke-width" values="2;4;2" dur="2s" repeatCount="indefinite" begin="0.3s" />
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="0.3s" />
          </rect>

          <text x="80" y="30" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="monospace">Agent Beta</text>
          <text x="80" y="50" textAnchor="middle" fill="#888" fontSize="11" fontFamily="monospace">:3403</text>

          <rect x="20" y="65" width="120" height="22" rx="4" fill="#14F195" fillOpacity="0.3">
            <animate attributeName="fill-opacity" values="0.3;0.5;0.3" dur="1.5s" repeatCount="indefinite" begin="0.5s" />
          </rect>
          <text x="80" y="81" textAnchor="middle" fill="#7fffd4" fontSize="10" fontFamily="monospace">summarize</text>

          <rect x="20" y="95" width="120" height="22" rx="4" fill="#14F195" fillOpacity="0.3">
            <animate attributeName="fill-opacity" values="0.3;0.5;0.3" dur="1.5s" repeatCount="indefinite" begin="0.8s" />
          </rect>
          <text x="80" y="111" textAnchor="middle" fill="#7fffd4" fontSize="10" fontFamily="monospace">extract</text>
        </g>

        {/* ===== Agent Gamma ===== */}
        <g transform="translate(560, 290)">
          <rect x="0" y="0" width="160" height="130" rx="10" fill="url(#agentGradient)" stroke="#00D4AA" strokeWidth="2">
            <animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" begin="0.6s" />
          </rect>
          <rect x="0" y="0" width="160" height="130" rx="10" fill="none" stroke="#00D4AA" strokeWidth="2">
            <animate attributeName="stroke-width" values="2;4;2" dur="2s" repeatCount="indefinite" begin="0.6s" />
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" begin="0.6s" />
          </rect>

          <text x="80" y="30" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="monospace">Agent Gamma</text>
          <text x="80" y="50" textAnchor="middle" fill="#888" fontSize="11" fontFamily="monospace">:3404</text>

          <rect x="20" y="65" width="120" height="22" rx="4" fill="#00D4AA" fillOpacity="0.3">
            <animate attributeName="fill-opacity" values="0.3;0.5;0.3" dur="1.5s" repeatCount="indefinite" begin="1s" />
          </rect>
          <text x="80" y="81" textAnchor="middle" fill="#7fffd4" fontSize="10" fontFamily="monospace">translate</text>
        </g>

        {/* ===== Agent interconnections ===== */}
        {/* Alpha <-> Beta */}
        <g>
          <line x1="240" y1="355" x2="320" y2="355" stroke="#666" strokeWidth="2" />
          <polygon points="245,350 240,355 245,360" fill="#666" />
          <polygon points="315,350 320,355 315,360" fill="#666" />
          <circle r="3" fill="#14F195" filter="url(#glow)">
            <animate attributeName="cx" values="245;315" dur="1s" repeatCount="indefinite" />
            <animate attributeName="cy" values="355;355" dur="1s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
          </circle>
          <circle r="3" fill="#9945FF" filter="url(#glow)">
            <animate attributeName="cx" values="315;245" dur="1s" repeatCount="indefinite" begin="0.5s" />
            <animate attributeName="cy" values="355;355" dur="1s" repeatCount="indefinite" begin="0.5s" />
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.5s" />
          </circle>
        </g>

        {/* Beta <-> Gamma */}
        <g>
          <line x1="480" y1="355" x2="560" y2="355" stroke="#666" strokeWidth="2" />
          <polygon points="485,350 480,355 485,360" fill="#666" />
          <polygon points="555,350 560,355 555,360" fill="#666" />
          <circle r="3" fill="#00D4AA" filter="url(#glow)">
            <animate attributeName="cx" values="485;555" dur="1s" repeatCount="indefinite" begin="0.3s" />
            <animate attributeName="cy" values="355;355" dur="1s" repeatCount="indefinite" begin="0.3s" />
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.3s" />
          </circle>
          <circle r="3" fill="#14F195" filter="url(#glow)">
            <animate attributeName="cx" values="555;485" dur="1s" repeatCount="indefinite" begin="0.8s" />
            <animate attributeName="cy" values="355;355" dur="1s" repeatCount="indefinite" begin="0.8s" />
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.8s" />
          </circle>
        </g>

        {/* ===== ClawNet Mesh bottom ===== */}
        <g transform="translate(100, 450)">
          <path d="M 0 30 Q 300 -20 600 30" fill="none" stroke="url(#meshGradient)" strokeWidth="3" strokeLinecap="round">
            <animate attributeName="stroke-dasharray" values="0,1000;1000,0" dur="3s" repeatCount="indefinite" />
          </path>

          <path d="M 50 25 L 150 5 L 300 25 L 450 5 L 550 25" fill="none" stroke="#14F195" strokeWidth="1" opacity="0.4">
            <animate attributeName="stroke-dasharray" values="10,5;5,10;10,5" dur="2s" repeatCount="indefinite" />
          </path>

          <rect x="100" y="45" width="400" height="35" rx="8" fill="none" stroke="#14F195" strokeWidth="1" strokeDasharray="8,4" opacity="0.6">
            <animate attributeName="stroke-dashoffset" values="0;24" dur="1.5s" repeatCount="indefinite" />
          </rect>

          <text x="300" y="70" textAnchor="middle" fill="#14F195" fontSize="14" fontWeight="bold" fontFamily="monospace" filter="url(#glow)">
            ClawNet Mesh
          </text>

          <circle cx="150" cy="65" r="3" fill="#9945FF">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
          </circle>
          <circle cx="300" cy="65" r="3" fill="#14F195">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.33s" />
          </circle>
          <circle cx="450" cy="65" r="3" fill="#00D4AA">
            <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" begin="0.66s" />
          </circle>
        </g>

        {/* ===== Background particles ===== */}
        <g opacity="0.3">
          <circle cx="50" cy="100" r="2" fill="#9945FF">
            <animate attributeName="cy" values="100;80;100" dur="4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="4s" repeatCount="indefinite" />
          </circle>
          <circle cx="750" cy="150" r="2" fill="#14F195">
            <animate attributeName="cy" values="150;130;150" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite" />
          </circle>
          <circle cx="100" cy="500" r="2" fill="#00D4AA">
            <animate attributeName="cy" values="500;480;500" dur="3.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="700" cy="480" r="2" fill="#2775CA">
            <animate attributeName="cy" values="480;460;480" dur="4.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="4.5s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* ===== Data flow particles ===== */}
        <circle r="4" fill="#9945FF" filter="url(#strongGlow)">
          <animateMotion dur="3s" repeatCount="indefinite" begin="0s">
            <mpath href="#dataPath1" />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite" />
        </circle>
        <path id="dataPath1" d="M 300 130 L 300 200 L 160 290" fill="none" />

        <circle r="4" fill="#14F195" filter="url(#strongGlow)">
          <animateMotion dur="3s" repeatCount="indefinite" begin="1s">
            <mpath href="#dataPath2" />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite" begin="1s" />
        </circle>
        <path id="dataPath2" d="M 400 170 L 400 290" fill="none" />

        <circle r="4" fill="#00D4AA" filter="url(#strongGlow)">
          <animateMotion dur="3s" repeatCount="indefinite" begin="2s">
            <mpath href="#dataPath3" />
          </animateMotion>
          <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite" begin="2s" />
        </circle>
        <path id="dataPath3" d="M 500 130 L 500 200 L 640 290" fill="none" />
      </svg>
    </div>
  );
}
