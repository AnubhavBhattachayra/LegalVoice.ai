import {
  CreditCard,
  User,
  FileText,
  Activity,
  MessageSquare,
  BarChart,
  Search,
  ChevronRight,
  Scroll,
  AlertCircle,
  HelpCircle,
  Inbox,
  File,
  Settings,
  LogOut,
  Home,
  RotateCcw,
  PlusCircle,
  ArrowRight,
  BarChart3,
  ScrollText
} from "lucide-react";

export const Icons = {
  // Dashboard icons
  credit: CreditCard,
  user: User,
  file: FileText,
  activity: Activity,
  message: MessageSquare,
  chart: BarChart,
  search: Search,
  arrowRight: ArrowRight,
  contract: Scroll,
  alert: AlertCircle,
  help: HelpCircle,
  inbox: Inbox,
  settings: Settings,
  logout: LogOut,
  home: Home,
  refresh: RotateCcw,
  add: PlusCircle,
  
  // Custom SVG icons
  empty: (props: any) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <path d="M6 13h.01" />
      <path d="M10 13h.01" />
      <path d="M14 13h.01" />
      <path d="M18 13h.01" />
    </svg>
  ),
}; 