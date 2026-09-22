"use client"

import * as React from "react"

interface DevModeContextType {
  isDevMode: boolean
  toggleDevMode: () => void
  selectedTab: "all" | "commits" | "prs" | "branches"
  setSelectedTab: (tab: "all" | "commits" | "prs" | "branches") => void
}

const DevModeContext = React.createContext<DevModeContextType>({
  isDevMode: false,
  toggleDevMode: () => {},
  selectedTab: "all",
  setSelectedTab: () => {},
})

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const [isDevMode, setIsDevMode] = React.useState<boolean>(false)
  const [selectedTab, setSelectedTab] = React.useState<"all" | "commits" | "prs" | "branches">("all")

  // Restore user preference from localStorage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("workbook_changelog_dev_mode")
      if (saved === "true") {
        setIsDevMode(true)
      }
    } catch {
      // Ignore
    }
  }, [])

  const toggleDevMode = React.useCallback(() => {
    setIsDevMode((prev) => {
      const next = !prev
      try {
        localStorage.setItem("workbook_changelog_dev_mode", String(next))
      } catch {
        // Ignore
      }
      return next
    })
  }, [])

  return (
    <DevModeContext.Provider value={{ isDevMode, toggleDevMode, selectedTab, setSelectedTab }}>
      {children}
    </DevModeContext.Provider>
  )
}

export function useDevMode() {
  return React.useContext(DevModeContext)
}
