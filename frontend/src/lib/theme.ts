export type ThemeMode = "light" | "dark"

export function getStoredTheme(): ThemeMode | null {
  const stored = window.localStorage.getItem("bsms_theme")
  if (stored === "light" || stored === "dark") return stored
  return null
}

export function getPreferredTheme(): ThemeMode {
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark"
  }
  return "light"
}

export function getInitialTheme(): ThemeMode {
  return getStoredTheme() ?? getPreferredTheme()
}

export function applyTheme(theme: ThemeMode) {
  const root = window.document.documentElement
  root.classList.toggle("dark", theme === "dark")
  window.localStorage.setItem("bsms_theme", theme)
}

export function toggleTheme(current: ThemeMode): ThemeMode {
  const nextTheme = current === "dark" ? "light" : "dark"
  applyTheme(nextTheme)
  return nextTheme
}
