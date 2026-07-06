/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Sun, Moon, Globe, AlertTriangle, ChevronRight, 
  Loader2, ArrowRight, XCircle, Info 
} from 'lucide-react';

// ==========================================
// BUTTON (বোতাম)
// ==========================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  ...props
}) => {
  const baseStyle = "relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-98 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-emerald-500 text-slate-950 hover:bg-emerald-400 focus:ring-emerald-500 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)]",
    secondary: "bg-cyan-500 text-slate-950 hover:bg-cyan-400 focus:ring-cyan-500 font-bold shadow-[0_0_15px_rgba(6,180,210,0.3)]",
    outline: "border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 focus:ring-slate-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    glass: "glass-panel text-slate-200 hover:text-white hover:bg-white/10 border-white/10"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-sm gap-2",
    lg: "px-6 py-3.5 text-base gap-2.5"
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

// ==========================================
// CARD (কার্ড)
// ==========================================
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  variant?: 'default' | 'glass' | 'outline';
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = true,
  variant = 'default',
  className = '',
  ...props
}) => {
  const baseStyle = "rounded-2xl p-6 overflow-hidden transition-all duration-300";
  
  const variants = {
    default: "bg-[#0c0c0c] border border-white/5 shadow-xl shadow-black/45 text-white",
    glass: "glass-panel text-white",
    outline: "border border-white/10 bg-transparent text-white"
  };

  const hoverStyle = hoverEffect 
    ? "hover:translate-y-[-4px] hover:shadow-2xl hover:border-white/15" 
    : "";

  return (
    <div
      className={`${baseStyle} ${variants[variant]} ${hoverStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// ==========================================
// BADGE (ব্যাজ)
// ==========================================
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'info' | 'warning' | 'danger' | 'brand';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  size = 'md'
}) => {
  const baseStyle = "inline-flex items-center font-medium rounded-full tracking-wide";
  
  const variants = {
    brand: "bg-brand-green/10 text-brand-green border border-brand-green/20",
    success: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    info: "bg-brand-blue/10 text-brand-blue border border-brand-blue/20",
    warning: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20"
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs"
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};

// ==========================================
// MODAL & DIALOG (মোডাল এবং ডায়ালগ)
// ==========================================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md'
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl"
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        />

        {/* Modal Panel */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className={`relative w-full ${sizeClasses[size]} glass-panel text-white rounded-2xl overflow-hidden shadow-2xl border border-white/10 z-10`}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-display font-semibold text-lg text-white">{title}</h3>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 max-h-[75vh] overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// ==========================================
// CONFIRMATION DIALOG (নিশ্চিতকরণ ডায়ালগ)
// ==========================================
interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'নিশ্চিত করুন',
  cancelText = 'বাতিল',
  isDanger = false
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-4 text-slate-300 text-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 shrink-0 ${isDanger ? 'text-red-500' : 'text-amber-500'}`} />
          <p>{message}</p>
        </div>
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            {cancelText}
          </Button>
          <Button 
            variant={isDanger ? 'danger' : 'primary'} 
            size="sm" 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ==========================================
// LOADING SKELETON (লোডিং কঙ্কাল)
// ==========================================
export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg ${className}`} />
  );
};

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
    </div>
  );
};

// ==========================================
// EMPTY STATE (খালি অবস্থা)
// ==========================================
interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Info className="w-6 h-6 text-slate-400" />
      </div>
      <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">{title}</h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionText}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
};

// ==========================================
// PAGE HEADER (পেজ হেডার)
// ==========================================
interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  children
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
};

// ==========================================
// STATS CARD (পরিসংখ্যান কার্ড)
// ==========================================
interface StatsCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtext,
  trend,
  icon
}) => {
  return (
    <Card className="flex items-center justify-between p-6">
      <div>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
          {title}
        </span>
        <span className="font-display text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
          {value}
        </span>
        {(subtext || trend) && (
          <div className="flex items-center gap-1.5 mt-2">
            {trend && (
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                {trend.value}
              </span>
            )}
            {subtext && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {subtext}
              </span>
            )}
          </div>
        )}
      </div>
      {icon && (
        <div className="p-3 bg-brand-green/10 text-brand-green dark:bg-slate-800 dark:text-white rounded-xl">
          {icon}
        </div>
      )}
    </Card>
  );
};

// ==========================================
// BREADCRUMB (ব্রেডক্রাম্ব)
// ==========================================
interface BreadcrumbProps {
  items: {
    label: string;
    onClick?: () => void;
  }[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-4 overflow-x-auto">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
          <span 
            className={`cursor-pointer transition-colors ${
              idx === items.length - 1 
                ? 'text-slate-600 dark:text-slate-300 font-medium' 
                : 'hover:text-slate-600 dark:hover:text-slate-200'
            }`}
            onClick={item.onClick}
          >
            {item.label}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
};

// ==========================================
// LANGUAGE SWITCHER (ভাষা পরিবর্তনকারী)
// ==========================================
export const LanguageSwitch: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-200"
    >
      <Globe className="w-3.5 h-3.5" />
      <span>{language === 'bn' ? 'English' : 'বাংলা'}</span>
    </button>
  );
};

// ==========================================
// THEME SWITCHER (ডার্ক/লাইট মোড পরিবর্তনকারী)
// ==========================================
export const ThemeSwitch: React.FC = () => {
  const [theme, setThemeState] = React.useState<'light' | 'dark'>('dark');

  React.useEffect(() => {
    const savedTheme = localStorage.getItem('skillproof_theme') || 'dark';
    setThemeState(savedTheme as 'light' | 'dark');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setThemeState(newTheme);
    localStorage.setItem('skillproof_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition-all duration-200"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};
