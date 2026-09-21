import { ThemeToggle } from "@/components/theme-toggle"
import { formatDate } from "@/lib/utils"
import changelogData from "@/data/changelog.json"

interface MediaItem {
  type: "image" | "video"
  url: string
  alt?: string
}

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
  media?: MediaItem
  highlights?: string[]
  sections: ChangelogSection[]
}

export default function HomePage() {
  const sortedChangelogs = (changelogData as ChangelogEntry[]).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="min-h-screen bg-background relative">
      {/* Header */}
      <div className="border-b border-border/50">
        <div className="max-w-5xl mx-auto relative">
          <div className="p-4 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Workbook ERP</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Product Updates & Release Changelog</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-5xl mx-auto px-6 lg:px-10 pt-10">
        <div className="relative">
          {sortedChangelogs.map((changelog) => {
            const date = new Date(changelog.date)
            const formattedDate = formatDate(date)

            return (
              <div key={changelog.id} className="relative">
                <div className="flex flex-col md:flex-row gap-y-6">
                  {/* Left side - Date & Version */}
                  <div className="md:w-48 flex-shrink-0">
                    <div className="md:sticky md:top-8 pb-10">
                      <time className="text-sm font-medium text-muted-foreground block mb-3">
                        {formattedDate}
                      </time>

                      {changelog.version && (
                        <div className="inline-flex relative z-10 items-center justify-center px-2.5 py-1 text-foreground border border-border rounded-lg text-xs font-bold bg-muted/40">
                          {changelog.version}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side - Content */}
                  <div className="flex-1 md:pl-8 relative pb-12">
                    {/* Vertical timeline line */}
                    <div className="hidden md:block absolute top-2 left-0 w-px h-full bg-border">
                      {/* Timeline dot */}
                      <div className="hidden md:block absolute -translate-x-1/2 size-3 bg-primary rounded-full z-10" />
                    </div>

                    <div className="space-y-6">
                      <div className="relative z-10 flex flex-col gap-2">
                        <h2 className="text-2xl font-semibold tracking-tight text-balance">
                          {changelog.title}
                        </h2>

                        {changelog.description && (
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {changelog.description}
                          </p>
                        )}

                        {/* Tags */}
                        {changelog.tags && changelog.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {changelog.tags.map((tag: string) => (
                              <span
                                key={tag}
                                className="h-6 w-fit px-2.5 text-xs font-medium bg-muted text-muted-foreground rounded-full border flex items-center justify-center"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Media Display (Assets folder images / videos) */}
                      {changelog.media && (
                        <div className="rounded-xl overflow-hidden border border-border/80 bg-muted/20 my-4">
                          {changelog.media.type === "video" ? (
                            <video
                              src={changelog.media.url}
                              controls
                              className="w-full h-auto max-h-[420px] object-cover"
                            />
                          ) : (
                            <img
                              src={changelog.media.url}
                              alt={changelog.media.alt || changelog.title}
                              className="w-full h-auto max-h-[420px] object-cover"
                            />
                          )}
                        </div>
                      )}

                      {/* Sections */}
                      <div className="space-y-6 pt-2">
                        {changelog.sections.map((section, idx) => (
                          <div key={idx} className="space-y-3">
                            <h3 className="text-lg font-semibold tracking-tight">
                              {section.heading}
                            </h3>
                            <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/90 leading-relaxed">
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
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
