"use client";

import { useEffect, useState } from "react";

/**
 * Renders the org logo: an admin-uploaded one from OrgSettings if set,
 * falling back to /public/brand/logo.png, falling back further to an
 * initials badge until either is available.
 */
export default function OrgLogo({ size = 48 }: { size?: number }) {
  const [customLogo, setCustomLogo] = useState<string | null | undefined>(undefined);
  const [staticFailed, setStaticFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/org-settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setCustomLogo(data?.settings?.logoDataUrl ?? null);
      })
      .catch(() => {
        if (!cancelled) setCustomLogo(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (customLogo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={customLogo}
        alt="شعار المنصة"
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full bg-white object-contain shadow-sm"
      />
    );
  }

  if (staticFailed) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-blue shadow-sm"
      >
        ر.ن
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logo.png"
      alt="شعار المنصة"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full bg-white object-contain shadow-sm"
      onError={() => setStaticFailed(true)}
    />
  );
}
