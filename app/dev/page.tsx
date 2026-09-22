import { SiteHeader } from "@/components/site-header"
import { DevStudioClient } from "@/components/dev-studio-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Developer Studio — Git Telemetry & Repository Tree",
  description: "Explore the Workbook ERP commit tree, pull requests, branches, and diff telemetry in a GitKraken-inspired view.",
}

export default function DevPage() {
  return (
    <div className="min-h-screen bg-[#090D14] flex flex-col">
      <SiteHeader />
      <DevStudioClient />
    </div>
  )
}
