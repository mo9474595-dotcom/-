const PATHS: Record<string, string> = {
  mail: "M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Zm2.2.2 6.8 5.4 6.8-5.4",
  lock: "M6 11V8a6 6 0 1 1 12 0v3M5 11h14v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9Zm7 4.5v2",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0",
  userPlus: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 9a6 6 0 0 1 12 0M19 8v6M16 11h6",
  shield: "M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 3",
  clockHistory: "M4 12a8 8 0 1 0 3-6.3M4 4v4h4M12 8v4l3 2",
  users: "M9 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 8a6 6 0 0 1 12 0M17 6.5a3 3 0 1 1 0 6M20 20a5.5 5.5 0 0 0-4-5.3",
  graduationCap: "m12 3 10 5-10 5L2 8l10-5Zm-6 8v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4",
  teacher: "M12 8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7 13c0-4-3.1-7-7-7s-7 3-7 7M15 3.5c1.7.5 2.9 2 2.9 4S16.7 11 15 11.5",
  home: "m3 11 9-8 9 8M5 10v10h14V10",
  clipboard: "M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Zm-3 2h12v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6Zm3 6h6M9 15h6",
  trash: "M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13",
  cloud: "M7 18a4.5 4.5 0 0 1-1-8.9 5.5 5.5 0 0 1 10.7-1.7A4 4 0 0 1 17 18H7Z",
  bell: "M12 4a5 5 0 0 0-5 5v3.5L5 15h14l-2-2.5V9a5 5 0 0 0-5-5Zm-2 13a2 2 0 0 0 4 0",
  power: "M12 3v8M6.3 7a8 8 0 1 0 11.4 0",
  laptop: "M5 5h14v9H5V5Zm-2 12h18l-1.5 2.5h-15L3 17Z",
  key: "M14.5 3a5.5 5.5 0 1 0 3.9 9.4L21 15l-2 2-1.5-1.5L16 17l-2-2 1.6-1.6A5.5 5.5 0 0 0 14.5 3Zm0 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-9-9h18M12 3a13 13 0 0 1 0 18 13 13 0 0 1 0-18Z",
  headset: "M4 13a8 8 0 0 1 16 0M4 13v4a2 2 0 0 0 2 2h1v-7H5a1 1 0 0 0-1 1Zm16 0v4a2 2 0 0 1-2 2h-1v-7h2a1 1 0 0 1 1 1Zm-3 6a2 2 0 0 1-2 2h-2",
  bulb: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3 11.2c.6.4 1 1 1 1.8h4c0-.8.4-1.4 1-1.8A6 6 0 0 0 12 3Z",
  folder: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z",
  calendarCheck: "M4 5h16v15H4V5Zm0 5h16M8 3v4M16 3v4M9 15l2 2 4-4",
  scale: "M12 3v18M4 8h16M4 8l-2 6a3 3 0 0 0 6 0l-2-6Zm16 0l-2 6a3 3 0 0 0 6 0l-2-6ZM8 21h8",
  check: "M5 12l5 5L20 7",
  save: "M5 4h11l3 3v13H5V4Zm3 0v5h8V4M8 13h8v7H8v-7Z",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm9 2-4.3-4.3",
};

export default function Icon({
  name,
  size = 20,
  className = "",
}: {
  name: keyof typeof PATHS;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
