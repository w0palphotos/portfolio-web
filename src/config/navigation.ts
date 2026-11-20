import {
  Home,
  Folder,
  FileText,
  User,
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
  { href: '/', label: 'nav.home', icon: Home },
  { href: '/projects', label: 'nav.projects', icon: Folder },
  { href: '/blog', label: 'nav.blog', icon: FileText },
  { href: '/about', label: 'nav.about', icon: User },
  { href: '/now', label: 'nav.now', icon: Activity },
  { href: '/terminal', label: 'nav.terminal', icon: TerminalSquare },
]
