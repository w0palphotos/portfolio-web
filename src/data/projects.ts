export interface Project {
  id: string
  title: string
  description: string
  link: string | null
  imageUrl: string | null
  tags: string[]
  stars?: number
}

// Curated from github.com/w0palphotos (active) and github.com/w0pal (archive),
// respecting pinned repos and stars. Coursework/practice repos are left out.
// `description` holds an i18n key (see src/i18n); titles are repo names.
export const projects: Project[] = [
  {
    id: 'x17blake-linux',
    title: 'x17blake-linux',
    description: 'projects.desc.x17blake',
    link: 'https://github.com/w0palphotos/x17blake-linux',
    imageUrl: null,
    tags: ['Python', 'Linux', 'HID', 'Reverse Engineering'],
    stars: 4,
  },
  {
    id: 'snowsky-tiny-a-oss',
    title: 'snowsky-tiny-a-oss',
    description: 'projects.desc.snowsky',
    link: 'https://github.com/w0palphotos/snowsky-tiny-a-oss',
    imageUrl: null,
    tags: ['Python', 'Linux', 'HID', 'Reverse Engineering'],
    stars: 2,
  },
  {
    id: 'homelab',
    title: 'homelab',
    description: 'projects.desc.homelab',
    link: 'https://github.com/w0pal/homelab',
    imageUrl: null,
    tags: ['Docker', 'Linux', 'GitOps', 'Self-hosted'],
  },
  {
    id: 'dyslexialens-ds',
    title: 'DyslexiaLens (Data Science)',
    description: 'projects.desc.dyslexia',
    link: 'https://github.com/DyslexiaLens/DyslexiaLens_DS',
    imageUrl: null,
    tags: ['Jupyter', 'Data Science', 'AI'],
  },
  {
    id: 'pdf-to-png24-svg',
    title: 'PDF to PNG-24/SVG',
    description: 'projects.desc.pdf',
    link: 'https://pdftopng24-svg.vercel.app/',
    imageUrl: null,
    tags: ['Next.js', 'Vercel'],
  },
  {
    id: 'integrated-token',
    title: 'IntegratedToken',
    description: 'projects.desc.token',
    link: 'https://integratedtoken.vercel.app/',
    imageUrl: null,
    tags: ['Next.js', 'Ethers', 'Metamask', 'Web3'],
  },
  {
    id: 'survey-lebaran-2026',
    title: 'Website Survey Lebaran 2026',
    description: 'projects.desc.survey',
    link: 'https://survey-sederhana.vercel.app/',
    imageUrl: null,
    tags: ['Next.js', 'Vercel', 'Railway'],
  },
  {
    id: 'cachyos-kernel-deb',
    title: 'cachyos-kernel-deb',
    description: 'projects.desc.cachyos',
    link: 'https://github.com/w0pal/cachyos-kernel-deb',
    imageUrl: null,
    tags: ['Shell', 'Linux', 'Kernel'],
  },
  {
    id: 'linux-troubleshooter',
    title: 'linux-troubleshooter',
    description: 'projects.desc.troubleshooter',
    link: 'https://github.com/w0pal/linux-troubleshooter',
    imageUrl: null,
    tags: ['Shell', 'Linux', 'AI'],
    stars: 1,
  },
  {
    id: 'docker-hadoop-bigdata',
    title: 'docker-hadoop-bigdata',
    description: 'projects.desc.hadoop',
    link: 'https://github.com/w0pal/docker-hadoop-bigdata',
    imageUrl: null,
    tags: ['Docker', 'Hadoop', 'Big Data'],
  },
  {
    id: 'enkripsi-ecc-aes',
    title: 'enkripsi-ecc-aes',
    description: 'projects.desc.enkripsi',
    link: 'https://github.com/w0pal/enkripsi-ecc-aes',
    imageUrl: null,
    tags: ['Python', 'Cryptography', 'AES', 'ECC'],
  },
  {
    id: 'iot-finalproject',
    title: 'IoT Smart Door Lock',
    description: 'projects.desc.iot',
    link: 'https://github.com/w0pal/iot-finalproject',
    imageUrl: null,
    tags: ['ESP32', 'IoT', 'MQTT'],
  },
  {
    id: 'zshrc',
    title: 'zshrc',
    description: 'projects.desc.zshrc',
    link: 'https://github.com/w0pal/zshrc',
    imageUrl: null,
    tags: ['Shell', 'Linux', 'Dotfiles'],
  },
]
