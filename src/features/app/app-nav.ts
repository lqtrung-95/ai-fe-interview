import { BookOpen, Clock, Code2, Database, LayoutDashboard, Settings, Zap } from 'lucide-react';

export const APP_NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/practice/new', label: 'Practice', icon: Zap },
  { href: '/study-plan', label: 'Study Plan', icon: BookOpen },
  { href: '/question-bank', label: 'Question Bank', icon: Database },
  { href: '/coding-challenges', label: 'Coding Challenges', icon: Code2 },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/settings', label: 'Settings', icon: Settings },
] as const;

export function isAppNavActive(pathname: string, href: string) {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
}

export function formatAppDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
}
