"use client";

import { cn } from "@/lib/utils";
import { Link, LinkProps } from "react-router-dom";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
  pinned: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
  pinned = false,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
  pinned?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate, pinned }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
  pinned,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
  pinned?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate} pinned={pinned}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <>
      <DesktopSidebar className={className}>{children}</DesktopSidebar>
      <MobileSidebar className={className}>{children}</MobileSidebar>
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate, pinned } = useSidebar();
  const sidebarRef = React.useRef<HTMLDivElement>(null);
  const hoverBuffer = 12;
  return (
    <motion.div
      className={cn(
        "relative h-full min-h-screen px-4 py-4 hidden md:flex md:flex-col bg-sidebar border-r border-sidebar-border w-[300px] shrink-0",
        className
      )}
      ref={sidebarRef}
      animate={{
        width: animate ? (open ? "300px" : "84px") : "300px",
      }}
      onMouseEnter={() => {
        if (!pinned) {
          setOpen(true);
        }
      }}
      onMouseLeave={(event) => {
        if (pinned) {
          return;
        }

        if (sidebarRef.current) {
          const rect = sidebarRef.current.getBoundingClientRect();
          const inBuffer =
            event.clientX >= rect.right &&
            event.clientX <= rect.right + hoverBuffer &&
            event.clientY >= rect.top &&
            event.clientY <= rect.bottom;
          if (inBuffer) {
            return;
          }
        }

        setOpen(false);
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden items-center justify-between bg-sidebar border-b border-sidebar-border w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <Menu
            className="text-sidebar-foreground cursor-pointer"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-sidebar p-10 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-sidebar-foreground cursor-pointer"
                onClick={() => setOpen(!open)}
              >
                <X />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  active,
  onClick,
  ...props
}: {
  link: Links;
  className?: string;
  active?: boolean;
  onClick?: () => void;
}) => {
  const { open, animate } = useSidebar();
  const baseClasses = cn(
    "flex w-full items-center justify-start gap-3 rounded-2xl px-3 py-2.5 text-sidebar-foreground transition-colors duration-150 group/sidebar"
  );
  const activeClasses = open
    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_hsl(var(--sidebar-border))]"
    : "bg-sidebar-accent text-sidebar-accent-foreground rounded-2xl shadow-[inset_0_0_0_1px_hsl(var(--sidebar-border))]";
  
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(
          baseClasses,
          "text-left",
          "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
          className
        )}
      >
        {link.icon}
        <motion.span
          animate={{
            display: animate ? (open ? "inline-block" : "none") : "inline-block",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className={cn(
            "text-sidebar-foreground text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0",
            active && "font-medium"
          )}
        >
          {link.label}
        </motion.span>
      </button>
    );
  }
  
  return (
    <Link
      to={link.href}
      className={cn(
        baseClasses,
        "hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        active && activeClasses,
        className
      )}
      {...props}
    >
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          "text-sidebar-foreground text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0",
          active && "font-medium text-sidebar-accent-foreground"
        )}
      >
        {link.label}
      </motion.span>
    </Link>
  );
};
