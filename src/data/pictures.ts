// Screenshot archive, grouped by quarter. `alt` holds an i18n key;
// structural fields (files, sizes) stay literal.

export interface Picture {
  src: string
  alt: string
  width: number
  height: number
  portrait?: boolean
  note?: string
}

export interface PictureGroup {
  quarter: string
  items: Picture[]
}

export const pictureGroups: PictureGroup[] = [
  {
    quarter: 'Q4 2026',
    items: [
      { src: '/pictures/linux-setup-2026-11-21.webp', alt: 'pictures.alt.q4_2026_pc', width: 1920, height: 1080 },
      { src: '/pictures/linux-setup-2026-11-20.webp', alt: 'pictures.alt.q4_2026_homelab', width: 1366, height: 768 },
      { src: '/pictures/linux-setup-2026-10-28.webp', alt: 'pictures.alt.q4_2026_laptop', width: 1920, height: 1080 },
      {
        src: '/pictures/smartphone-2026-11-21.webp',
        alt: 'pictures.alt.q4_2026_phone',
        width: 1080,
        height: 2340,
        portrait: true,
        note: 'pictures.phoneNote',
      },
    ],
  },
  {
    quarter: 'Q3 2026',
    items: [
      { src: '/pictures/q3-2026-laptop.webp', alt: 'pictures.alt.q3_2026_laptop', width: 1920, height: 1080 },
    ],
  },
  {
    quarter: 'Q2 2026',
    items: [
      { src: '/pictures/q2-2026-laptop.webp', alt: 'pictures.alt.q2_2026_laptop', width: 1920, height: 1080 },
    ],
  },
  {
    quarter: 'Q1 2026',
    items: [
      { src: '/pictures/q1-2026-pc.webp', alt: 'pictures.alt.q1_2026_pc', width: 1920, height: 1080 },
      { src: '/pictures/q1-2026-smartphone.webp', alt: 'pictures.alt.q1_2026_phone', width: 1776, height: 1184 },
    ],
  },
  {
    quarter: 'Q4 2025',
    items: [
      { src: '/pictures/q4-2025-pc.webp', alt: 'pictures.alt.q4_2025_pc', width: 1920, height: 1080 },
    ],
  },
  {
    quarter: 'Q3 2025',
    items: [
      { src: '/pictures/q3-2025-laptop.webp', alt: 'pictures.alt.q3_2025_laptop', width: 1600, height: 1000 },
    ],
  },
  {
    quarter: 'Q2 2025',
    items: [
      {
        src: '/pictures/q2-2025-smartphone.webp',
        alt: 'pictures.alt.q2_2025_phone',
        width: 1080,
        height: 2340,
        portrait: true,
      },
      { src: '/pictures/q2-2025-laptop.webp', alt: 'pictures.alt.q2_2025_laptop', width: 1600, height: 1000 },
    ],
  },
  {
    quarter: 'Q3 2024',
    items: [
      { src: '/pictures/q3-2024-laptop.webp', alt: 'pictures.alt.q3_2024_laptop', width: 1600, height: 1000 },
    ],
  },
]
