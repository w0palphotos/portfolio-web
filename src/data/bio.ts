// Biography page content. Prose fields are i18n keys (see src/i18n);
// names, orgs, and periods stay literal.

export interface JourneyEntry {
  year: string | null
  text: string
}

export interface ExperienceEntry {
  role: string
  org: string
  period: string
  description?: string
}

export interface EducationEntry {
  school: string
  degree: string
  period: string
}

export const journey: JourneyEntry[] = [
  { year: '2020', text: 'bio.journey.y2020' },
  { year: '2023', text: 'bio.journey.y2023linux' },
  { year: '2023', text: 'bio.journey.y2023docs' },
  { year: '2025', text: 'bio.journey.y2025server' },
  { year: 'Feb - Aug 2026', text: 'bio.journey.y2026' },
]

// Source: linkedin.com/in/w0pal (public profile)
export const experience: ExperienceEntry[] = [
  {
    role: 'about.expRole.gd',
    org: 'PT. Kaldyta Mega Tech',
    period: 'about.period.gd',
    description: 'about.expDesc.gd',
  },
  {
    role: 'about.expRole.repair',
    org: 'PT. Kaldyta Mega Tech',
    period: 'about.period.gd',
    description: 'about.expDesc.repair',
  },
  {
    role: 'about.expRole.ds',
    org: 'Coding Camp powered by DBS Foundation',
    period: 'about.period.ds',
    description: 'about.expDesc.ds',
  },
]

export const education: EducationEntry[] = [
  {
    school: 'Nusa Putra University',
    degree: 'about.eduDegree.uni',
    period: 'about.period.uni',
  },
  {
    school: 'SMAIT Insani',
    degree: 'about.eduDegree.hs',
    period: 'about.period.hs',
  },
]
