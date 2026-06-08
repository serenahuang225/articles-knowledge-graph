export type TimePeriod = "golden" | "day" | "night";

export interface TimeTheme {
  id: TimePeriod;
  label: string;
  gradient: string;
  surface: string;
  surfaceMuted: string;
  fg: string;
  fgMuted: string;
  border: string;
  accent: string;
  accentHover: string;
  accentFg: string;
  highlight: string;
  highlightBg: string;
  highlightHover: string;
  tag: string;
  tagBg: string;
  tagFg: string;
  graphArticle: string;
  graphTag: string;
  graphLink: string;
  graphBg: string;
  danger: string;
  dangerFg: string;
}

/** ~1 hour around typical sunrise (6–7) and sunset (5–7), local time. */
export function getTimePeriod(date = new Date()): TimePeriod {
  const hour = date.getHours();

  if ((hour >= 5 && hour < 8) || (hour >= 17 && hour < 20)) {
    return "golden";
  }

  if (hour >= 8 && hour < 17) {
    return "day";
  }

  return "night";
}

export const TIME_THEMES: Record<TimePeriod, TimeTheme> = {
  golden: {
    id: "golden",
    label: "Desert Sunset",
    gradient: "linear-gradient(160deg, #D08C60 0%, #B58463 50%, #997b66 100%)",
    surface: "rgba(255, 247, 240, 0.94)",
    surfaceMuted: "rgba(255, 236, 220, 0.82)",
    fg: "#3D2920",
    fgMuted: "#6B4F3A",
    border: "rgba(151, 123, 102, 0.4)",
    accent: "#B58463",
    accentHover: "#A07050",
    accentFg: "#FFFAF5",
    highlight: "#D08C60",
    highlightBg: "rgba(208, 140, 96, 0.28)",
    highlightHover: "rgba(208, 140, 96, 0.42)",
    tag: "#8B5E3C",
    tagBg: "rgba(181, 132, 99, 0.35)",
    tagFg: "#3D2920",
    graphArticle: "#C47145",
    graphTag: "#8B6B52",
    graphLink: "rgba(61, 41, 32, 0.28)",
    graphBg: "rgba(255, 247, 240, 0.55)",
    danger: "#B54A3A",
    dangerFg: "#FFFAF5",
  },
  day: {
    id: "day",
    label: "Forest Canopy",
    gradient: "linear-gradient(160deg, #8A9A5B 0%, #9CAF88 50%, #556B2F 100%)",
    surface: "rgba(245, 250, 242, 0.94)",
    surfaceMuted: "rgba(236, 244, 228, 0.82)",
    fg: "#243018",
    fgMuted: "#445832",
    border: "rgba(85, 107, 47, 0.35)",
    accent: "#6B7F4A",
    accentHover: "#556B2F",
    accentFg: "#F5FAF0",
    highlight: "#8A9A5B",
    highlightBg: "rgba(138, 154, 91, 0.28)",
    highlightHover: "rgba(138, 154, 91, 0.42)",
    tag: "#556B2F",
    tagBg: "rgba(156, 175, 136, 0.45)",
    tagFg: "#243018",
    graphArticle: "#6B8E4E",
    graphTag: "#556B2F",
    graphLink: "rgba(36, 48, 24, 0.25)",
    graphBg: "rgba(245, 250, 242, 0.5)",
    danger: "#9E4A3A",
    dangerFg: "#F5FAF0",
  },
  night: {
    id: "night",
    label: "Coffee & Cream",
    gradient: "linear-gradient(160deg, #F5F2EB 0%, #C9A683 50%, #4A3B32 100%)",
    surface: "rgba(245, 242, 235, 0.94)",
    surfaceMuted: "rgba(237, 228, 216, 0.88)",
    fg: "#4A3B32",
    fgMuted: "#6B5748",
    border: "rgba(74, 59, 50, 0.28)",
    accent: "#8B6B4F",
    accentHover: "#6B5340",
    accentFg: "#F5F2EB",
    highlight: "#C9A683",
    highlightBg: "rgba(201, 166, 131, 0.35)",
    highlightHover: "rgba(201, 166, 131, 0.5)",
    tag: "#6B5340",
    tagBg: "rgba(201, 166, 131, 0.4)",
    tagFg: "#4A3B32",
    graphArticle: "#A67C52",
    graphTag: "#6B5340",
    graphLink: "rgba(74, 59, 50, 0.3)",
    graphBg: "rgba(245, 242, 235, 0.45)",
    danger: "#8B4035",
    dangerFg: "#F5F2EB",
  },
};

export function applyTimeTheme(period: TimePeriod) {
  const theme = TIME_THEMES[period];
  const root = document.documentElement;

  root.dataset.theme = period;
  root.style.setProperty("--theme-gradient", theme.gradient);
  root.style.setProperty("--theme-surface", theme.surface);
  root.style.setProperty("--theme-surface-muted", theme.surfaceMuted);
  root.style.setProperty("--theme-fg", theme.fg);
  root.style.setProperty("--theme-fg-muted", theme.fgMuted);
  root.style.setProperty("--theme-border", theme.border);
  root.style.setProperty("--theme-accent", theme.accent);
  root.style.setProperty("--theme-accent-hover", theme.accentHover);
  root.style.setProperty("--theme-accent-fg", theme.accentFg);
  root.style.setProperty("--theme-highlight", theme.highlight);
  root.style.setProperty("--theme-highlight-bg", theme.highlightBg);
  root.style.setProperty("--theme-highlight-hover", theme.highlightHover);
  root.style.setProperty("--theme-tag", theme.tag);
  root.style.setProperty("--theme-tag-bg", theme.tagBg);
  root.style.setProperty("--theme-tag-fg", theme.tagFg);
  root.style.setProperty("--theme-graph-article", theme.graphArticle);
  root.style.setProperty("--theme-graph-tag", theme.graphTag);
  root.style.setProperty("--theme-graph-link", theme.graphLink);
  root.style.setProperty("--theme-graph-bg", theme.graphBg);
  root.style.setProperty("--theme-danger", theme.danger);
  root.style.setProperty("--theme-danger-fg", theme.dangerFg);
}
