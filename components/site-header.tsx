import Image from "next/image"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { siteConfig } from "@/lib/site"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex h-14 items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <Link
            href={siteConfig.links.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
          >
            <Image
              src="/assets/logo_alone.svg"
              alt="Workbook Logo"
              width={26}
              height={26}
              priority
              className="h-6 w-auto object-contain"
            />
            <span className="text-base font-extrabold tracking-wider uppercase">
              WORKBOOK
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-xs font-medium text-muted-foreground">
            <Link
              href={siteConfig.links.website}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Product
            </Link>
            <Link
              href={`${siteConfig.links.website}#pricing`}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
            <Link
              href={siteConfig.links.parentCompany}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-foreground"
            >
              Company
            </Link>
            <Link
              href="/"
              className="font-semibold text-foreground"
            >
              Changelog
            </Link>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            href={siteConfig.links.signIn}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
          >
            Sign in
          </Link>

          <Link
            href={siteConfig.links.contactSales}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            Contact sales
          </Link>

          <Link
            href={siteConfig.links.signIn}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-foreground px-3.5 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 shadow-sm"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}
