const base = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const IconDashboard = (p) => (<svg {...base} {...p}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>);
export const IconChart = (p) => (<svg {...base} {...p}><path d="M3 3v18h18" /><path d="M8 17v-5M12 17V8M16 17v-3" /></svg>);
export const IconHistory = (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);
export const IconUser = (p) => (<svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>);
export const IconLogout = (p) => (<svg {...base} {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></svg>);
export const IconThermo = (p) => (<svg {...base} {...p}><path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z" /></svg>);
export const IconDrop = (p) => (<svg {...base} {...p}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /></svg>);
export const IconSun = (p) => (<svg {...base} {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>);
export const IconBulb = (p) => (<svg {...base} {...p}><path d="M9 18h6M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z" /></svg>);
export const IconLock = (p) => (<svg {...base} {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>);
export const SortIcon = ({ dir }) => (
  <svg width="8" height="10" viewBox="0 0 8 10" aria-hidden="true" className="sort-icon">
    <path d="M4 0L8 4H0z" fill={dir === 'asc' ? 'var(--accent)' : 'currentColor'} opacity={dir === 'asc' ? 1 : 0.35} />
    <path d="M4 10L0 6h8z" fill={dir === 'desc' ? 'var(--accent)' : 'currentColor'} opacity={dir === 'desc' ? 1 : 0.35} />
  </svg>
);
