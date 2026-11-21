// About page content. Prose fields are i18n keys (see src/i18n); structural
// data (names, specs, links, orgs) stays literal.
//
// NOTE: machines were seeded from existing documented sources (homelab
// README, the RAM-overclocking Medium post, live fastfetch). Confirm them
// and fill in the EliteBook specs. Journey, experience, and education live in
// src/data/bio.ts.

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

export const machines: Machine[] = [
  {
    name: 'HP EliteBook 845 G8',
    role: 'about.role.daily',
    specs: [
      { label: 'CPU', value: 'AMD Ryzen 5 PRO 5650U' },
      { label: 'RAM', value: '16 GB DDR4-3200 (1×16 GB)' },
      { label: 'Storage', value: '256 GB NVMe SSD' },
      { label: 'OS', value: 'Fedora 44 with niri + dankmaterialshell' },
    ],
  },
  {
    name: 'PC (first build)',
    role: 'about.role.firstBuild',
    specs: [
      { label: 'CPU', value: 'AMD Ryzen 5 3500X' },
      { label: 'RAM', value: '2×8 GB DDR4-2400, overclocked to 3200 MT/s CL16' },
      { label: 'Storage', value: '512 GB M.2 SATA SSD + 512 GB SATA SSD' },
      { label: 'GPU', value: 'AMD Radeon RX 570 8 GB (MSI GAMING X)' },
      { label: 'Board', value: 'ASRock A320M-HDV R4.0' },
    ],
    note: 'about.note.firstBuild',
  },
]

