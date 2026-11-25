import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (p: P) => ({
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
  ...p,
});

export const Check = (p: P) => <svg {...base(p)}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
export const Cross = (p: P) => <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>;
export const Half = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" />
  </svg>
);
export const ArrowUp = (p: P) => <svg {...base(p)}><path d="M12 19V5M6 11l6-6 6 6" /></svg>;
export const ArrowDown = (p: P) => <svg {...base(p)}><path d="M12 5v14M6 13l6 6 6-6" /></svg>;
export const Pointer = (p: P) => (
  <svg {...base(p)} strokeWidth={0}>
    <path d="M12 2.5l7 17.5-7-4.2-7 4.2z" fill="currentColor" />
  </svg>
);
export const Target = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);
export const Lock = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
export const MapIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" />
    <path d="M9 4v14M15 6v14" />
  </svg>
);
export const Help = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 0 1 4.8 1c0 1.7-2.3 2-2.3 3.5M12 17h.01" />
  </svg>
);
export const Bars = (p: P) => <svg {...base(p)}><path d="M5 20v-6M12 20V5M19 20v-10" /></svg>;
export const Sun = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
export const Moon = (p: P) => <svg {...base(p)}><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>;
export const SearchIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-4-4" />
  </svg>
);
export const Close = Cross;
export const Share = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 15V3M7 8l5-5 5 5" />
    <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
  </svg>
);
export const Enter = (p: P) => <svg {...base(p)}><path d="M19 5v6a3 3 0 0 1-3 3H6M9 10l-4 4 4 4" /></svg>;
export const Speech = (p: P) => <svg {...base(p)}><path d="M4 5h16v11H9l-5 4z" /></svg>;
export const Cloth = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="16" height="16" rx="1" />
    <path d="M4 10h16M4 15h16M10 4v16" />
  </svg>
);
export const Bowl = (p: P) => <svg {...base(p)}><path d="M3 11h18a9 9 0 0 1-18 0zM9 7c0-1.5 1-1.5 1-3M14 7c0-1.5 1-1.5 1-3" /></svg>;
export const Drum = (p: P) => (
  <svg {...base(p)}>
    <ellipse cx="12" cy="7" rx="7" ry="3" />
    <path d="M5 7v10c0 1.7 3.1 3 7 3s7-1.3 7-3V7" />
  </svg>
);
export const Diamond = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3l9 9-9 9-9-9z" />
    <circle cx="12" cy="12" r="2.5" />
  </svg>
);
export const Logo = (p: P) => (
  <svg width={28} height={20} viewBox="0 0 28 20" aria-hidden {...p}>
    <circle cx="10" cy="10" r="8" fill="var(--color-cobalt)" />
    <circle cx="18" cy="10" r="7" fill="none" stroke="var(--color-ink)" strokeWidth="3" />
  </svg>
);
