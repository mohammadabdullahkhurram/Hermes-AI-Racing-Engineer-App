export const fmtTime = (s: number | null | undefined): string => {
  if (!s && s !== 0) return "--:--.---";
  const min = Math.floor(s / 60);
  const sec = (s % 60).toFixed(3).padStart(6, "0");
  return `${min}:${sec}`;
};

export const fmtDelta = (s: number | string): string => {
  if (s === 0 || s === "REF") return s === "REF" ? "REF" : "±0.000";
  const sign = (s as number) > 0 ? "+" : "";
  return `${sign}${(s as number).toFixed(3)}s`;
};

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(Math.max(v, min), max);

export const parseStyles = (styleStr: string): React.CSSProperties => {
  const obj: Record<string, string> = {};
  styleStr.split(";").filter(Boolean).forEach(pair => {
    const [k, ...v] = pair.split(":");
    if (k && v.length) {
      const key = k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      obj[key] = v.join(":").trim();
    }
  });
  return obj as unknown as React.CSSProperties;
};
