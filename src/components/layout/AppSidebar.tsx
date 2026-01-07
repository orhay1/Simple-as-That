import * as React from 'react';
import { 
  LayoutDashboard, 
  Lightbulb, 
  FileEdit, 
  Image, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut,
  Zap
} from 'lucide-react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

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

export const AppSidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>((props, ref) => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { signOut, userRole } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar ref={ref} side={isRTL ? 'right' : 'left'} className={cn(collapsed ? 'w-16' : 'w-64', 'transition-all duration-200')} {...props}>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sidebar-foreground">Simple as That</span>
              <span className="text-xs text-sidebar-foreground/60">Content Studio</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50">{t.navigation.content}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild>
                    <RouterNavLink 
                      to={item.url}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        isActive(item.url) && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{t.navigation[item.key]}</span>}
                    </RouterNavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/50">{t.navigation.system}</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton asChild>
                    <RouterNavLink 
                      to={item.url}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        isActive(item.url) && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{t.navigation[item.key]}</span>}
                    </RouterNavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {!collapsed && userRole && (
          <div className="mb-3 rounded-lg bg-sidebar-accent/50 px-3 py-2">
            <span className="text-xs text-sidebar-foreground/60">{t.common.role}:</span>
            <span className="ms-1 text-xs font-medium capitalize text-sidebar-foreground">{userRole}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          className={cn(
            'w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{t.common.signOut}</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
});

AppSidebar.displayName = 'AppSidebar';
