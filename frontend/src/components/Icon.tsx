import Svg, { Circle, Path, Polygon, Polyline, Rect } from "react-native-svg";

type El =
  | ["p", string]
  | ["c", number, number, number]
  | ["r", number, number, number, number, number]
  | ["l", string]
  | ["g", string];

const ICONS = {
  shield: { fill: true, els: [["p", "M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5 4.5-1.35 8-6.25 8-11.5V6l-8-4z"]] },
  clock: { els: [["c", 12, 12, 9], ["l", "12 7 12 12 15 15"]] },
  user: { els: [["c", 12, 8, 4], ["p", "M5.5 20a6.5 6.5 0 0113 0"]] },
  plus: { els: [["p", "M12 5v14M5 12h14"]] },
  bell: { els: [["p", "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"]] },
  copy: { els: [["r", 9, 9, 13, 13, 2], ["p", "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"]] },
  check: { els: [["l", "20 6 9 17 4 12"]] },
  deposit: { els: [["p", "M12 4v16m8-8H4"]] },
  transfer: { els: [["p", "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"]] },
  withdraw: { els: [["p", "M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z"], ["p", "M12 9v6m-2.5-2.5L12 15l2.5-2.5"]] },
  cash: { els: [["r", 2, 6, 20, 12, 3], ["c", 12, 12, 2.5], ["p", "M6 12h.01M18 12h.01"]] },
  arrowIn: { els: [["p", "M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25"]] },
  arrowOut: { els: [["p", "M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"]] },
  chevronLeft: { els: [["p", "M15.75 19.5L8.25 12l7.5-7.5"]] },
  chevronRight: { els: [["p", "M8.25 4.5l7.5 7.5-7.5 7.5"]] },
  sliders: { els: [["p", "M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"]] },
  search: { els: [["p", "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"]] },
  vault: { els: [["r", 3, 3, 18, 18, 3], ["c", 12, 12, 3], ["p", "M12 9v1m0 4v1m-3-3h1m4 0h1"]] },
  safe: { els: [["p", "M12 2l7 3v6c0 5-3.5 9.5-7 11-3.5-1.5-7-6-7-11V5l7-3z"], ["c", 12, 11, 2]] },
  heart: { els: [["p", "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"]] },
  plane: { els: [["p", "M12 19l9 2-9-18-9 18 9-2zm0 0v-8"]] },
  gift: { els: [["l", "20 12 20 22 4 22 4 12"], ["r", 2, 7, 20, 5, 1], ["p", "M12 22V7"], ["p", "M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"], ["p", "M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"]] },
  users: { els: [["p", "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"], ["c", 9, 7, 4], ["p", "M23 21v-2a4 4 0 0 0-3-3.87"], ["p", "M16 3.13a4 4 0 0 1 0 7.75"]] },
  ticket: { els: [["p", "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"], ["p", "M7 7h.01"]] },
  link: { els: [["p", "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"], ["p", "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"]] },
  share: { els: [["c", 18, 5, 3], ["c", 6, 12, 3], ["c", 18, 19, 3], ["p", "M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"]] },
  help: { els: [["c", 12, 12, 10], ["p", "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"], ["p", "M12 17h.01"]] },
  trendUp: { els: [["l", "23 6 13.5 15.5 8.5 10.5 1 18"], ["l", "17 6 23 6 23 12"]] },
  zap: { els: [["g", "13 2 3 14 12 14 11 22 21 10 12 10 13 2"]] },
  dollar: { els: [["p", "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"]] },
  x: { els: [["p", "M18 6L6 18M6 6l12 12"]] },
  globe: { els: [["c", 12, 12, 10], ["p", "M2 12h20"], ["p", "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"]] },
  key: { els: [["p", "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"]] },
  lock: { els: [["r", 3, 11, 18, 11, 2], ["p", "M7 11V7a5 5 0 0 1 10 0v4"]] },
  unlock: { els: [["r", 3, 11, 18, 11, 2], ["p", "M7 11V7a5 5 0 0 1 9.9-1"]] },
  logout: { els: [["p", "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"], ["l", "16 17 21 12 16 7"], ["p", "M21 12H9"]] },
  eye: { els: [["p", "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"], ["c", 12, 12, 3]] },
  refresh: { els: [["l", "23 4 23 10 17 10"], ["l", "1 20 1 14 7 14"], ["p", "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"]] },
  alert: { els: [["p", "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"], ["p", "M12 9v4M12 17h.01"]] },
  checkCircle: { els: [["p", "M22 11.08V12a10 10 0 1 1-5.93-9.14"], ["l", "22 4 12 14.01 9 11.01"]] },
  external: { els: [["p", "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"], ["l", "15 3 21 3 21 9"], ["p", "M10 14L21 3"]] },
  layers: { els: [["g", "12 2 2 7 12 12 22 7 12 2"], ["l", "2 17 12 22 22 17"], ["l", "2 12 12 17 22 12"]] },
  star: { els: [["g", "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"]] },
  qr: { els: [["p", "M7 3H5a2 2 0 0 0-2 2v2m0 10v2a2 2 0 0 0 2 2h2m10-18h2a2 2 0 0 1 2 2v2m0 10v2a2 2 0 0 1-2 2h-2M9 9h6v6H9z"]] },
  wallet: { els: [["p", "M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"], ["p", "M4 6v12c0 1.1.9 2 2 2h14v-4"], ["p", "M18 12a2 2 0 0 0 0 4h4v-4z"]] },
  clipboard: { els: [["p", "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"], ["r", 8, 2, 8, 4, 1]] },
  backspace: { els: [["p", "M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"], ["p", "M18 9l-6 6M12 9l6 6"]] },
  sparkles: { els: [["p", "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"], ["p", "M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"]] },
  calendar: { els: [["r", 3, 4, 18, 18, 2], ["p", "M16 2v4M8 2v4M3 10h18"]] },
  more: { els: [["c", 12, 5, 1], ["c", 12, 12, 1], ["c", 12, 19, 1]] },
  trash: { els: [["p", "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"], ["p", "M10 11v6M14 11v6"]] },
} satisfies Record<string, { fill?: boolean; els: El[] }>;

export type IconName = keyof typeof ICONS;

type Props = { name: IconName; size?: number; color: string; strokeWidth?: number; filled?: boolean };

export function Icon({ name, size = 24, color, strokeWidth = 2, filled }: Props) {
  const def = ICONS[name] as { fill?: boolean; els: El[] };
  const solid = filled ?? def.fill ?? false;
  const common = {
    stroke: solid ? "none" : color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: solid ? color : "none",
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {def.els.map((el, i) => {
        switch (el[0]) {
          case "p":
            return <Path key={i} d={el[1]} {...common} />;
          case "c":
            return <Circle key={i} cx={el[1]} cy={el[2]} r={el[3]} {...common} />;
          case "r":
            return <Rect key={i} x={el[1]} y={el[2]} width={el[3]} height={el[4]} rx={el[5]} {...common} />;
          case "l":
            return <Polyline key={i} points={el[1]} {...common} fill="none" />;
          case "g":
            return <Polygon key={i} points={el[1]} {...common} />;
        }
        return null;
      })}
    </Svg>
  );
}
