// About page content. Prose fields are i18n keys (see src/i18n); structural
// data (names, specs, links, orgs) stays literal.
//
// NOTE: machines were seeded from existing documented sources (homelab
// README, the RAM-overclocking Medium post, live fastfetch). Confirm them
// and fill in the EliteBook specs. Experience/education come from the public
// LinkedIn profile (linkedin.com/in/w0pal).

export interface MachineSpec {
  label: string
  value: string
}

export interface Machine {
  name: string
  role: string
  retired?: boolean
  specs: MachineSpec[]
  note?: string
}

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

export const machines: Machine[] = [
  {
    name: 'HP EliteDesk 800 G3 DM 35W',
    role: 'about.role.homelab',
    specs: [
      { label: 'CPU', value: 'Intel Core i5-7500T (4 cores) @ 3.30 GHz' },
      { label: 'RAM', value: '8 GiB DDR4' },
      { label: 'Storage', value: '240 GB NVMe SSD' },
      { label: 'OS', value: 'Alpine Linux' },
    ],
    note: 'about.note.eliteDesk',
  },
  {
    name: 'HP EliteBook',
    role: 'about.role.daily',
    specs: [
      { label: 'OS', value: 'Fedora Silverblue' },
    ],
    note: 'about.specsPending',
  },
  {
    name: 'Ryzen desktop (first build)',
    role: 'about.role.firstBuild',
    specs: [
      { label: 'CPU', value: 'AMD Ryzen 5' },
      { label: 'Board', value: 'ASRock A320M-HDV R4.0' },
      { label: 'RAM', value: 'V-Gen DDR4 2400 MT/s, overclocked to 3600 MT/s CL18' },
    ],
    note: 'about.note.firstBuild',
  },
  {
    name: 'ZTE B860H',
    role: 'about.role.formerServer',
    retired: true,
    specs: [
      { label: 'SoC', value: 'Amlogic p212 (4 cores @ 1.51 GHz)' },
      { label: 'RAM', value: '1.75 GiB' },
      { label: 'Storage', value: '58 GB SD + 6.5 GB eMMC' },
      { label: 'OS', value: 'Armbian' },
    ],
    note: 'about.note.zte',
  },
]

export const journey: JourneyEntry[] = [
  { year: '2020', text: 'about.journeyText.y2020' },
  { year: '2023', text: 'about.journeyText.y2023linux' },
  { year: '2023', text: 'about.journeyText.y2023uni' },
  { year: null, text: 'about.journeyText.photo' },
  { year: '2026', text: 'about.journeyText.y2026' },
  { year: 'now', text: 'about.journeyText.now' },
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
