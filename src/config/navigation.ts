import {
  Folder,
  FileText,
  User,
  History,
  Activity,
  TerminalSquare,
  type LucideIcon,
} from 'lucide-vue-next'

export interface NavLink {
  href: string
  label: string
  icon: LucideIcon
}

export const navLinks: NavLink[] = [
  { href: '/projects', label: 'nav.projects', icon: Folder },
  { href: '/blog', label: 'nav.blog', icon: FileText },
  { href: '/about', label: 'nav.about', icon: User },
  { href: '/bio', label: 'nav.bio', icon: History },
  { href: '/now', label: 'nav.now', icon: Activity },
  { href: '/terminal', label: 'nav.terminal', icon: TerminalSquare },
]
