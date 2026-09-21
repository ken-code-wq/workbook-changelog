import { formatDate } from "@/lib/utils"
import changelogData from "@/data/changelog.json"
import { TimelineScrubber } from "@/components/timeline-scrubber"
import { SiteHeader } from "@/components/site-header"

interface ChangelogSection {
  heading: string
  items: string[]
}

interface ChangelogEntry {
  id: string
  title: string
  description?: string
  date: string
  version?: string
  tags?: string[]
  highlights?: string[]
  sections: ChangelogSection[]
}

export default function HomePage() {
  const sortedChangelogs = (changelogData as ChangelogEntry[]).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      {/* Floating Sticky Header (matching Cursor layout) */}
      <SiteHeader />

      {/* Interactive Timeline Scrubber */}
      <TimelineScrubber
        items={sortedChangelogs.map((item) => ({
          id: item.id,
          title: item.title,
          date: item.date,
          description: item.description,
          highlights: item.highlights,
        }))}
      />

      {/* Hero Intro */}
      <div className="max-w-4xl mx-auto px-6 lg:px-10 pt-12 pb-6 text-left">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Changelog
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
          New updates, features, and improvements shipped to Workbook ERP.
        </p>
      </div>

      {/* Timeline */}
      <div className="max-w-4xl mx-auto px-6 lg:px-10 pb-20">
        <div className="relative">
          {sortedChangelogs.map((changelog) => {
            const date = new Date(changelog.date)
            const formattedDate = formatDate(date)

            return (
              <article id={changelog.id} key={changelog.id} className="relative scroll-mt-24">
                <div className="flex flex-col md:flex-row gap-y-6">
                  {/* Left side - Date & Version */}
                  <div className="md:w-44 flex-shrink-0">
                    <div className="md:sticky md:top-20 pb-10">
                      <time className="text-sm font-semibold text-muted-foreground block mb-2 tracking-tight">
                        {formattedDate}
                      </time>

                      {changelog.version && (
                        <div className="inline-flex relative z-10 items-center justify-center px-2.5 py-0.5 text-foreground border border-border rounded-md text-xs font-bold bg-muted/40">
                          {changelog.version}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side - Content */}
                  <div className="flex-1 md:pl-8 relative pb-14">
                    {/* Vertical timeline line */}
                    <div className="hidden md:block absolute top-2 left-0 w-px h-full bg-border/70">
                      {/* Timeline dot */}
                      <div className="hidden md:block absolute -translate-x-1/2 size-2.5 bg-primary/90 rounded-full z-10" />
                    </div>

                    <div className="space-y-5">
                      <div className="relative z-10 flex flex-col gap-2">
                        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground text-balance">
                          {changelog.title}
                        </h2>

                        {changelog.description && (
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {changelog.description}
                          </p>
                        )}

                        {/* Tags */}
                        {changelog.tags && changelog.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {changelog.tags.map((tag: string) => (
                              <span
                                key={tag}
                                className="h-5.5 w-fit px-2.5 text-[11px] font-medium bg-muted text-muted-foreground rounded-full border flex items-center justify-center"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Sections */}
                      <div className="space-y-5 pt-2">
                        {changelog.sections.map((section, idx) => (
                          <div key={idx} className="space-y-2.5">
                            <h3 className="text-base font-semibold tracking-tight text-foreground">
                              {section.heading}
                            </h3>
                            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-foreground/85 leading-relaxed">
                              {section.items.map((item, itemIdx) => (
                                <li key={itemIdx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}
