"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { siteConfig } from "@/lib/site"
import { GitGraph, Sparkles } from "lucide-react"

export function SiteHeader() {
  const pathname = usePathname()
  const isDev = pathname === "/dev"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-14 items-center justify-between">
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <Link
            href={siteConfig.links.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 font-bold tracking-tight text-foreground transition-opacity hover:opacity-90"
          >
            <div className="relative h-6 w-auto flex items-center">
              <Image
                src="/assets/logo_alone.svg"
                alt="Workbook Logo"
                width={26}
                height={26}
                priority
                className="h-6 w-auto object-contain dark:hidden"
              />
              <Image
                src="/assets/logo_alone_white.svg"
                alt="Workbook Logo"
                width={26}
                height={26}
                priority
                className="h-6 w-auto object-contain hidden dark:block"
              />
            </div>
            <div className="ml-1 flex flex-col gap-0.5 leading-none">
              <span className="text-xl font-bold tracking-tight text-foreground">
                Workbook
              </span>
            </div>
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
              className={`flex items-center gap-1.5 transition-colors ${
                !isDev ? "font-semibold text-foreground" : "hover:text-foreground"
              }`}
            >
              <Sparkles className="size-3" />
              <span>Changelog</span>
            </Link>
            <Link
              href="/dev"
              className={`flex items-center gap-1.5 transition-colors ${
                isDev ? "font-semibold text-emerald-500" : "hover:text-foreground"
              }`}
            >
              <GitGraph className="size-3" />
              <span>Dev Studio</span>
            </Link>
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Dedicated Dev Page Quick Switch */}
          <Link
            href={isDev ? "/" : "/dev"}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
              isDev
                ? "bg-foreground text-background shadow-sm"
                : "border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/70"
            }`}
          >
            {isDev ? (
              <>
                <Sparkles className="size-3" />
                <span>Public View</span>
              </>
            ) : (
              <>
                <GitGraph className="size-3.5 text-emerald-500" />
                <span>Dev Mode</span>
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </>
            )}
          </Link>

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
            className="hidden md:inline-flex items-center justify-center rounded-full border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
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
