"use client";

import { useState } from "react";

/**
 * Renders the organization logo from /public/brand/logo.png when present,
 * falling back to an initials badge until the real asset is added.
 */
export default function OrgLogo({ size = 48 }: { size?: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
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
      alt="شعار منظمة رياض النجاح للتنمية المستدامة"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full bg-white object-contain shadow-sm"
      onError={() => setFailed(true)}
    />
  );
}
