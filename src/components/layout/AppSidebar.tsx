import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Lightbulb,
  FileEdit,
  Image,
  Calendar,
  BarChart3,
  Settings,
  LogOut,
  Pin,
  PinOff,
} from 'lucide-react';
import logoImage from '@/assets/logo.png';
import { useLocation } from 'react-router-dom';
import { Sidebar, SidebarBody, SidebarLink } from '@/components/ui/animated-sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const mainMenuItems = [
  { key: 'dashboard' as const, url: '/dashboard', icon: LayoutDashboard },
  { key: 'topics' as const, url: '/topics', icon: Lightbulb },
  { key: 'drafts' as const, url: '/drafts', icon: FileEdit },
  { key: 'assets' as const, url: '/assets', icon: Image },
  { key: 'schedule' as const, url: '/schedule', icon: Calendar },
  { key: 'published' as const, url: '/published', icon: BarChart3 },
];

const settingsItems = [
  { key: 'settings' as const, url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();
  const { t } = useTranslation();

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const storedPinned = window.localStorage.getItem("sidebar:pinned");
    if (storedPinned !== null) {
      setPinned(storedPinned === "true");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("sidebar:pinned", String(pinned));
  }, [pinned]);

  const links = mainMenuItems.map((item) => ({
    label: t.navigation[item.key],
    href: item.url,
    icon: (
      <item.icon className={cn(
        "h-5 w-5 shrink-0 text-sidebar-foreground",
        isActive(item.url) && "text-sidebar-accent-foreground"
      )} />
    ),
  }));

  const settingsLinks = settingsItems.map((item) => ({
    label: t.navigation[item.key],
    href: item.url,
    icon: (
      <item.icon className={cn(
        "h-5 w-5 shrink-0 text-sidebar-foreground",
        isActive(item.url) && "text-sidebar-accent-foreground"
      )} />
    ),
  }));

  const logoutLink = {
    label: t.common.signOut,
    href: '#',
    icon: <LogOut className="h-5 w-5 shrink-0 text-sidebar-foreground" />,
  };

  return (
    <Sidebar open={open} setOpen={setOpen} pinned={pinned}>
      <SidebarBody className="h-full gap-6">
        <SidebarPinButton pinned={pinned} onToggle={() => setPinned((prev) => !prev)} />
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          <Logo open={open} />
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink 
                key={idx} 
                link={link} 
                active={isActive(mainMenuItems[idx].url)}
              />
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-sidebar-border flex flex-col gap-2">
            {settingsLinks.map((link, idx) => (
              <SidebarLink 
                key={idx} 
                link={link} 
                active={isActive(settingsItems[idx].url)}
              />
            ))}
          </div>
        </div>
        <div className="mt-auto border-t border-sidebar-border pt-4">
          <SidebarLink 
            link={logoutLink}
            onClick={signOut}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

const Logo = ({ open }: { open: boolean }) => {
  return (
    <div className="flex items-center gap-3 px-3 py-2 text-sidebar-foreground relative z-20">
      <div className="h-7 w-7 shrink-0 overflow-hidden">
        <img src={logoImage} alt="Simple as That" className="h-7 w-7 object-contain" />
      </div>
      <motion.span
        animate={{
          display: open ? "inline-block" : "none",
          opacity: open ? 1 : 0,
        }}
        className="text-sm font-medium text-sidebar-foreground whitespace-pre"
      >
        Simple as That
      </motion.span>
    </div>
  );
};

const SidebarPinButton = ({
  pinned,
  onToggle,
}: {
  pinned: boolean;
  onToggle: () => void;
}) => {
  return (
    <button
      type="button"
      aria-pressed={pinned}
      onClick={onToggle}
      title={pinned ? "Unpin sidebar" : "Pin sidebar"}
      className={cn(
        "absolute left-full top-4 z-30 hidden h-9 w-9 translate-x-2 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-sm transition hover:bg-sidebar-accent/70 md:flex",
        pinned && "bg-sidebar-accent text-sidebar-accent-foreground"
      )}
    >
      {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
    </button>
  );
};
