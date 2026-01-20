import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Lightbulb, 
  FileEdit, 
  Image, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut
} from 'lucide-react';
import logoImage from '@/assets/logo.png';
import { useLocation } from 'react-router-dom';
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from '@/components/ui/animated-sidebar';
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
  const location = useLocation();
  const { signOut } = useAuth();
  const { t } = useTranslation();

  const isActive = (path: string) => location.pathname === path;

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
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
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
        <div className="border-t border-sidebar-border pt-4">
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
    <div className="font-normal flex space-x-2 items-center text-sm text-sidebar-foreground py-1 relative z-20">
      <div className="h-6 w-6 shrink-0 overflow-hidden">
        <img src={logoImage} alt="Simple as That" className="h-6 w-6 object-contain" />
      </div>
      <motion.span
        animate={{
          display: open ? "inline-block" : "none",
          opacity: open ? 1 : 0,
        }}
        className="font-medium text-sidebar-foreground whitespace-pre"
      >
        Simple as That
      </motion.span>
    </div>
  );
};
