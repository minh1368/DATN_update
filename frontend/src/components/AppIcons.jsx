// Shared SVG icons used by App screens. Kept here so App.jsx stays focused on page state and flows.

export function PasswordVisibilityIcon({ visible }) {
  return visible ? (
    <svg className="password-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.25 12s3.5-6 9.75-6 9.75 6 9.75 6-3.5 6-9.75 6-9.75-6-9.75-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg className="password-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
      <path d="M9.88 5.18A10.56 10.56 0 0 1 12 5c6.25 0 9.75 7 9.75 7a17.16 17.16 0 0 1-2.8 3.62" />
      <path d="M6.61 6.61C3.76 8.42 2.25 12 2.25 12s3.5 7 9.75 7a9.87 9.87 0 0 0 4.34-.99" />
    </svg>
  );
}

export function BackArrowIcon() {
  return (
    <svg className="auth-back-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m14.5 5-7 7 7 7" />
      <path d="M8 12h10" />
    </svg>
  );
}

export function PaymentActionIcon({ type }) {
  if (type === "edit") {
    return (
      <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4.5 19.5h4.2L18.6 9.6a2 2 0 0 0 0-2.8l-1.4-1.4a2 2 0 0 0-2.8 0L4.5 15.3v4.2Z" />
        <path d="m13.2 6.6 4.2 4.2" />
      </svg>
    );
  }

  if (type === "check") {
    return (
      <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12.5 9.2 17 19 7" />
      </svg>
    );
  }

  if (type === "reject") {
    return (
      <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 7l10 10M17 7 7 17" />
      </svg>
    );
  }

  if (type === "money") {
    return (
      <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="6.5" width="17" height="11" rx="2.2" />
        <path d="M6.8 9.2c1.2 0 2.2-1 2.2-2.2M17.2 9.2c-1.2 0-2.2-1-2.2-2.2M6.8 14.8c1.2 0 2.2 1 2.2 2.2M17.2 14.8c-1.2 0-2.2 1-2.2 2.2" />
        <circle cx="12" cy="12" r="2.4" />
      </svg>
    );
  }

  if (type === "return") {
    return (
      <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.5 14.5h11l1.6-4.2a2 2 0 0 0-1.9-2.7H8.8a2 2 0 0 0-1.9 1.4L5.5 14.5" />
        <path d="M5.5 14.5v2.8h13v-2.8" />
        <circle cx="8.4" cy="17.4" r="1.2" />
        <circle cx="15.6" cy="17.4" r="1.2" />
        <path d="M9.5 5.2H5.8a2.8 2.8 0 0 0 0 5.6H8" />
        <path d="M7 8.6 9.2 11 7 13.2" />
      </svg>
    );
  }

  if (type === "refund") {
    return (
      <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.5 7.5h8a4.5 4.5 0 0 1 0 9H7" />
        <path d="M7.5 7.5 4.8 10.2 7.5 13" />
        <path d="M12 10.2v4.2" />
        <path d="M10.4 11.2c.4-.6 1-.9 1.8-.9 1 0 1.8.5 1.8 1.3 0 .9-.8 1.2-1.8 1.5-.9.2-1.6.5-1.6 1.2 0 .8.8 1.2 1.8 1.2.8 0 1.5-.3 2-.9" />
      </svg>
    );
  }

  if (type === "view") {
    return (
      <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M2.8 12s3.4-5.8 9.2-5.8S21.2 12 21.2 12s-3.4 5.8-9.2 5.8S2.8 12 2.8 12Z" />
        <circle cx="12" cy="12" r="2.8" />
      </svg>
    );
  }

  if (type === "invoice") {
    return (
      <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 3.8h10.5L20 7.3v16.5l-2.6-1.4-2.6 1.4-2.6-1.4-2.6 1.4-2.6-1.4L4 23.8V5.8a2 2 0 0 1 2-2Z" />
        <path d="M16.5 3.8v3.7H20" />
        <path d="M8 10h8M8 13h8M8 16h4.8" />
      </svg>
    );
  }

  if (type === "sign") {
    return (
      <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 19.5h14" />
        <path d="M6.5 15.5c2.7-5.9 5.1-7.7 7.1-5.3 1.1 1.3-.4 3.6-2.2 3.6-1.3 0-1.9-.9-1.4-2.2" />
        <path d="M13.7 14.2c1.1-1 2.2-1.3 3.3-.8 1 .5 1.8.3 2.5-.5" />
        <path d="m15.5 4.7 1.8-1.8 3.1 3.1-1.8 1.8" />
        <path d="m15.5 4.7-4.2 4.2-.6 2.5 2.5-.6 4.2-4.2" />
      </svg>
    );
  }

  if (type === "contract") {
    return (
      <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.5 3.8h8.2L19 8.1v12.1a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V5.8a2 2 0 0 1 2-2Z" />
        <path d="M14.7 3.8v4.4H19" />
        <path d="M8 11.3h6.5M8 14.3h4.5" />
        <path d="M15.8 17.2h4.4M18 15v4.4" />
      </svg>
    );
  }

  return (
    <svg className="table-action-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4.5 7h15" />
      <path d="M9.5 7V4.8h5V7" />
      <path d="M7 7l1 12.2c.1 1 1 1.8 2 1.8h4c1 0 1.9-.8 2-1.8L17 7" />
      <path d="M10.5 11v6M13.5 11v6" />
    </svg>
  );
}

export function DashboardNavIcon({ type }) {
  const paths = {
    summary: (
      <>
        <path d="M4 11.2 12 4l8 7.2" />
        <path d="M6.4 10.3v9.2h11.2v-9.2" />
        <path d="M10 19.5v-5h4v5" />
      </>
    ),
    cars: (
      <>
        <path d="M5.4 14.5h13.2l-1.4-4.2a2.1 2.1 0 0 0-2-1.4H8.8a2.1 2.1 0 0 0-2 1.4L5.4 14.5Z" />
        <path d="M4.5 14.5v3.3h15v-3.3" />
        <circle cx="8" cy="17.7" r="1.1" />
        <circle cx="16" cy="17.7" r="1.1" />
      </>
    ),
    customers: (
      <>
        <circle cx="9" cy="8.4" r="2.8" />
        <path d="M4.5 19c.6-3.3 2.5-5.2 5.5-5.2s4.9 1.9 5.5 5.2" />
        <path d="M15.2 10.8a2.4 2.4 0 1 0 0-4.8" />
        <path d="M16.2 14.2c1.8.4 3 1.8 3.5 4.8" />
      </>
    ),
    requests: (
      <>
        <path d="M6.5 4.5h11v15h-11Z" />
        <path d="M9 8h6M9 11.5h6M9 15h3.5" />
      </>
    ),
    contracts: (
      <>
        <path d="M6.5 3.8h8.5l3.5 3.6v12.8h-12Z" />
        <path d="M15 3.8v3.6h3.5" />
        <path d="M9 11h6M9 14h6M9 17h3.5" />
      </>
    ),
    payments: (
      <>
        <rect x="4" y="6.5" width="16" height="11" rx="2" />
        <circle cx="12" cy="12" r="2.4" />
        <path d="M7 9.2c1 0 1.8-.8 1.8-1.8M17 14.8c-1 0-1.8.8-1.8 1.8" />
      </>
    ),
    users: (
      <>
        <path d="M12 12a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
        <path d="M5.5 19.2c.8-3.5 3.1-5.3 6.5-5.3s5.7 1.8 6.5 5.3" />
        <path d="M18.5 6.5v3.5M20.25 8.25h-3.5" />
      </>
    ),
  };

  return (
    <svg className="dashboard-tab-icon" viewBox="0 0 24 24" aria-hidden="true">
      {paths[type] || paths.summary}
    </svg>
  );
}

export function HomeSectionIcon({ type, className = "" }) {
  const icons = {
    selfDrive: (
      <>
        <path d="M4 14.2 5.6 9.5A3 3 0 0 1 8.4 7.5h7.2a3 3 0 0 1 2.8 2l1.6 4.7" />
        <path d="M5 14h14v4.2a1.3 1.3 0 0 1-1.3 1.3H16a1.3 1.3 0 0 1-1.3-1.3v-.7H9.3v.7A1.3 1.3 0 0 1 8 19.5H6.3A1.3 1.3 0 0 1 5 18.2V14Z" />
        <path d="M7.2 14.2h2M14.8 14.2h2M8 7.5l1-2h6l1 2" />
      </>
    ),
    chauffeur: (
      <>
        <circle cx="12" cy="7" r="3" />
        <path d="M6.2 20c.7-4.2 2.6-6.2 5.8-6.2s5.1 2 5.8 6.2" />
        <path d="M8.8 14.8 12 18l3.2-3.2" />
      </>
    ),
    enterprise: (
      <>
        <path d="M5 20V5.8A1.8 1.8 0 0 1 6.8 4h7.4A1.8 1.8 0 0 1 16 5.8V20" />
        <path d="M16 10h2.2A1.8 1.8 0 0 1 20 11.8V20M4 20h17" />
        <path d="M8 8h2M12 8h1M8 11h2M12 11h1M8 14h2M12 14h1" />
      </>
    ),
    route: (
      <>
        <path d="M6.5 18.5c2.7-2.5 8.3 1.2 10.8-1.7 2.7-3.2-4.5-5.4-2.1-8.5 1-1.3 2.7-1.8 4.2-1.8" />
        <circle cx="5.5" cy="18.5" r="2.2" />
        <circle cx="18.5" cy="6.5" r="2.2" />
        <path d="M9 6h.1M6 10h.1M12 12h.1" />
      </>
    ),
    sedan: (
      <>
        <path d="M3.7 13.7 5.5 9.6a3 3 0 0 1 2.8-1.8h7.4a3 3 0 0 1 2.8 1.8l1.8 4.1" />
        <path d="M5 13.5h14.2v4.4H5z" />
        <circle cx="8" cy="18" r="1.8" />
        <circle cx="16.2" cy="18" r="1.8" />
      </>
    ),
    van: (
      <>
        <path d="M4 7h9.2a2 2 0 0 1 2 2v1.4h2.2L20 14v3.5H4V7Z" />
        <path d="M15.2 10.4V14H20M7 10h2.5M11 10h1.3" />
        <circle cx="7.2" cy="17.5" r="1.8" />
        <circle cx="16.5" cy="17.5" r="1.8" />
      </>
    ),
    limousine: (
      <>
        <path d="M3.5 14.2h17v3.5h-17z" />
        <path d="M5.8 14.2 8 9.2h8l2.2 5" />
        <path d="M8.4 11.4h7.2M7 17.7h10" />
        <circle cx="7.2" cy="17.8" r="1.5" />
        <circle cx="16.8" cy="17.8" r="1.5" />
      </>
    ),
    bus: (
      <>
        <rect x="5" y="4.5" width="14" height="14" rx="2.2" />
        <path d="M7.5 8h9M7.5 11h9M8 18.5v1.5M16 18.5v1.5" />
        <circle cx="8.5" cy="15" r="1.1" />
        <circle cx="15.5" cy="15" r="1.1" />
      </>
    ),
    quote: (
      <>
        <path d="M8.4 6.5c-2.2 1.4-3.4 3.1-3.4 5.4v4.6h5.1v-5H7.6c.1-1.4.9-2.4 2.3-3.2L8.4 6.5Z" />
        <path d="M16.8 6.5c-2.2 1.4-3.4 3.1-3.4 5.4v4.6h5.1v-5H16c.1-1.4.9-2.4 2.3-3.2l-1.5-1.8Z" />
      </>
    ),
    review: (
      <>
        <path d="m12 3.8 2.2 4.4 4.8.7-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8L5 8.9l4.8-.7L12 3.8Z" />
      </>
    ),
    account: (
      <>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5.7 20c.8-4 2.9-6 6.3-6s5.5 2 6.3 6" />
      </>
    ),
    support: (
      <>
        <path d="M5 12a7 7 0 0 1 14 0v3a2.5 2.5 0 0 1-2.5 2.5H15" />
        <path d="M5 12v3.2A1.8 1.8 0 0 0 6.8 17H8v-5H5ZM19 12v5h-3v-5h3Z" />
        <path d="M11 19h3" />
      </>
    ),
    airport: (
      <>
        <path d="M12 3.8v16.4" />
        <path d="M4.4 13.7 12 10l7.6 3.7v2.1L12 13.7l-7.6 2.1v-2.1Z" />
        <path d="m9.1 20.2 2.9-2 2.9 2M9.5 6.5 12 4l2.5 2.5" />
      </>
    ),
    customService: (
      <>
        <rect x="4.5" y="5" width="15" height="11" rx="2.2" />
        <path d="M8 19h8M10 16v3M14 16v3M8 9.2h3.1M8 12h6.8" />
        <path d="m17.4 8.4 1.1 1.1-2.9 2.9-1.6.5.5-1.6 2.9-2.9Z" />
      </>
    ),
    history: (
      <>
        <path d="M12 7v5l3.4 2" />
        <path d="M5.3 8.5A8 8 0 1 1 4 13" />
        <path d="M4 5.8v3.4h3.4" />
      </>
    ),
    mission: (
      <>
        <circle cx="12" cy="12" r="7.5" />
        <circle cx="12" cy="12" r="3.8" />
        <path d="M12 3.5V6M20.5 12H18M12 18v2.5M6 12H3.5" />
      </>
    ),
    trust: (
      <>
        <path d="M12 3.7 18.5 6v5.2c0 4.2-2.5 7.2-6.5 8.9-4-1.7-6.5-4.7-6.5-8.9V6L12 3.7Z" />
        <path d="m8.7 12.1 2.2 2.2 4.6-5" />
      </>
    ),
    safety: (
      <>
        <path d="M6 15.8V9.5l6-3.8 6 3.8v6.3" />
        <path d="M8.5 20h7M9.2 15.8c.6-1.4 1.5-2.1 2.8-2.1s2.2.7 2.8 2.1" />
        <circle cx="12" cy="10.7" r="2.1" />
      </>
    ),
    partnership: (
      <>
        <path d="M8.5 12.8 6.8 11a2.2 2.2 0 0 1 0-3.1 2.2 2.2 0 0 1 3.1 0l1.1 1.1" />
        <path d="m15.5 11.2 1.7 1.8a2.2 2.2 0 0 1 0 3.1 2.2 2.2 0 0 1-3.1 0L13 15" />
        <path d="m9.5 15.2 5-6.4" />
      </>
    ),
    gps: (
      <>
        <path d="M12 21s6-5.2 6-10.2a6 6 0 1 0-12 0C6 15.8 12 21 12 21Z" />
        <circle cx="12" cy="10.8" r="2.3" />
      </>
    ),
    fuel: (
      <>
        <path d="M7 20V5.5A1.5 1.5 0 0 1 8.5 4h5A1.5 1.5 0 0 1 15 5.5V20" />
        <path d="M6 20h10M9 8h4M15 8.5l3 3V18a1.5 1.5 0 0 0 3 0v-3.8" />
        <path d="M18 11.5h2" />
      </>
    ),
    team: (
      <>
        <circle cx="12" cy="7.2" r="2.8" />
        <circle cx="6.8" cy="10.2" r="2.2" />
        <circle cx="17.2" cy="10.2" r="2.2" />
        <path d="M6 20c.7-3.6 2.7-5.4 6-5.4s5.3 1.8 6 5.4" />
        <path d="M2.8 18.5c.5-2.4 1.8-3.7 4-3.8M17.2 14.7c2.2.1 3.5 1.4 4 3.8" />
      </>
    ),
    star: (
      <path d="m12 3.8 2.2 4.45 4.9.72-3.55 3.46.84 4.88L12 15l-4.39 2.31.84-4.88L4.9 8.97l4.9-.72L12 3.8Z" />
    ),
  };

  return (
    <span className={`home-section-icon home-section-icon-${type} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 24 24">{icons[type]}</svg>
    </span>
  );
}


