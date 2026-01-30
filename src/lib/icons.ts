// Centralized icon imports to reduce bundle size
// Only import the icons we actually use

export {
  // Navigation icons
  Home,
  Plus,
  Coins,
  ArrowRightLeft,
  Eye,
  Flame,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  
  // UI icons
  Loader2,
  CheckCircle,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Copy,
  LogOut,
  User,
  Zap,
  Filter,
  
  // Dashboard icons
  TrendingUp,
  Users,
  Shield,
  Activity,
  ArrowRight,
  
  // Theme icons
  Moon,
  Sun,
  
  // Form icons
  Search,
  
  // Status icons
  TrendingDown,
  Clock,
  
  // Additional icons as needed
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Info,
  Settings,
  Trash2,
  Target,
} from 'lucide-react'

// Icon component type for consistency
export type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: string | number }>