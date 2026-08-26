import React from 'react';

interface HospitalLogoProps {
  className?: string;
  size?: number | string;
}

export default function HospitalLogo({ className = "w-16 h-16", size = 64 }: HospitalLogoProps) {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size} 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      id="hospital-logo-svg"
    >
      {/* Outer circular shadow effect */}
      <circle cx="100" cy="100" r="98" fill="none" stroke="#e2e8f0" strokeWidth="1" />
      
      {/* Teal Blue Outer Ring with Radiant Gradient */}
      <circle cx="100" cy="100" r="92" fill="#009db4" />
      <circle cx="100" cy="100" r="92" fill="url(#tealHospitalGrad)" />
      
      {/* Curved Text Definitions */}
      <defs>
        <linearGradient id="tealHospitalGrad" x1="100" y1="8" x2="100" y2="192" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0ea5e9" />
          <stop offset="0.5" stopColor="#009fbd" />
          <stop offset="1" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="goldHospitalGrad" x1="100" y1="52" x2="100" y2="148" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#eab308" />
          <stop offset="0.5" stopColor="#ca8a04" />
          <stop offset="1" stopColor="#854d0e" />
        </linearGradient>
        
        {/* Arc Path for top curved text (Arabic reads RTL, so path is set accordingly) */}
        <path id="topTextArc" d="M 23,100 A 77,77 0 0,1 177,100" fill="none" />
        {/* Arc Path for bottom curved text */}
        <path id="bottomTextArc" d="M 177,100 A 77,77 0 0,1 23,100" fill="none" />
      </defs>

      {/* Decorative Golden Separation Circles */}
      <circle cx="24" cy="100" r="4" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" />
      <circle cx="176" cy="100" r="4" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" />
      
      {/* Arabic Curved Header: "مستشفى الفرح الأهلي" */}
      <text fill="#ffffff" fontSize="16.5" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="-0.2">
        <textPath href="#topTextArc" startOffset="50%" textAnchor="middle">
          مستشفى الفرح الأهلي
        </textPath>
      </text>

      {/* English Curved Footer: "AL FARAH PRIVATE HOSPITAL" */}
      <text fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="'Inter', system-ui, sans-serif" letterSpacing="0.8">
        <textPath href="#bottomTextArc" startOffset="50%" textAnchor="middle">
          AL FARAH PRIVATE HOSPITAL
        </textPath>
      </text>

      {/* Inner White Circle Medallion Backdrop with Golden Border */}
      <circle cx="100" cy="100" r="62" fill="#ffffff" stroke="url(#goldHospitalGrad)" strokeWidth="3" />

      {/* Center Medical & Healing Tree + Heartbeat Pulse wave */}
      <g transform="translate(10, 8)">
        {/* stylized Gold/Bronze Leaves on the left branch */}
        <circle cx="68" cy="74" r="2.5" fill="#ca8a04" />
        <circle cx="74" cy="66" r="3" fill="#ca8a04" />
        <circle cx="82" cy="62" r="3" fill="#eab308" />
        <circle cx="92" cy="60" r="2.5" fill="#eab308" />
        
        {/* stylized Gold/Bronze Leaves on the right branch */}
        <circle cx="112" cy="60" r="2.5" fill="#eab308" />
        <circle cx="121" cy="63" r="3" fill="#eab308" />
        <circle cx="129" cy="67" r="3" fill="#ca8a04" />
        <circle cx="134" cy="74" r="2.5" fill="#ca8a04" />

        {/* Celebrating Human Figures forming the tree branches */}
        {/* Left branch figure */}
        <path d="M 85,98 C 85,82 72,76 78,72 C 84,68 90,82 92,90" stroke="url(#goldHospitalGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="75" cy="70" r="4" fill="#ca8a04" />

        {/* Right branch figure */}
        <path d="M 115,98 C 115,82 128,76 122,72 C 116,68 110,82 108,90" stroke="url(#goldHospitalGrad)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="125" cy="70" r="4" fill="#ca8a04" />

        {/* Center Main figure */}
        <path d="M 98,98 Q 98,75 102,64 Q 102,60 98,62" stroke="url(#goldHospitalGrad)" strokeWidth="3" strokeLinecap="round" fill="none" />
        <circle cx="100" cy="56" r="4.5" fill="#ca8a04" />

        {/* Tree Trunk Base roots */}
        <path d="M 95,98 L 95,110 L 105,110 L 105,98 Z M 80,98 L 120,98 L 100,86 Z" fill="url(#goldHospitalGrad)" />

        {/* Golden EKG Pulse Beat running elegantly through the roots and base */}
        <path 
          d="M 50,102 H 72 L 78,88 L 84,118 L 88,94 L 92,104 H 108 L 112,94 L 116,110 L 120,98 C 124,102 134,102 142,102 L 152,102" 
          stroke="url(#goldHospitalGrad)" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none" 
        />
      </g>
    </svg>
  );
}
