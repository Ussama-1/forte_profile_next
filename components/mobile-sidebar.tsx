"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  FileText,
  ListChecks,
  Search,
  Settings,
  LogOut,
  Upload,
  User2,
  Menu,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

const mainNavItems: NavItem[] = [
  {
    href: "/dashboard",
    icon: User2,
    label: "Forte Profile",
  },
  {
    href: "/dashboard/career-profile",
    icon: FileText,
    label: "Career Profile",
  },
  {
    href: "/dashboard/priorities",
    icon: ListChecks,
    label: "Priorities",
  },
  {
    href: "/dashboard/job-search",
    icon: Search,
    label: "Job Search",
  },
  {
    href: "/dashboard/results",
    icon: BarChart3,
    label: "Results",
  },
  {
    href: "/dashboard/upload-documents",
    icon: Upload,
    label: "Upload Documents",
  },
];

export function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  // Check if we're on mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(false); // Close mobile sidebar when resizing to desktop
      }
    };

    // Set initial value
    checkIsMobile();

    // Add event listener
    window.addEventListener("resize", checkIsMobile);

    // Clean up
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("mobile-sidebar");
      const toggle = document.getElementById("sidebar-toggle");

      if (
        isOpen &&
        sidebar &&
        toggle &&
        !sidebar.contains(event.target as Node) &&
        !toggle.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen && isMobile) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isMobile]);

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        id="sidebar-toggle"
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
        <span className="sr-only">Toggle Menu</span>
      </Button>

      {/* Overlay */}
      {isOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="mobile-sidebar"
        className={cn(
          "fixed md:sticky top-0 left-0 z-40 h-screen bg-[#274754] text-white transition-transform duration-300 ease-in-out",
          "w-64 flex flex-col",
          isMobile && !isOpen ? "-translate-x-full" : "translate-x-0"
        )}
      >
        <div className="p-4 border-b border-slate-700 mt-6">
          <h1 className="text-xl font-bold">
            FINDING YOUR FORTE: QUANTUM LEAP
          </h1>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {mainNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md ",
                    pathname === item.href
                      ? "bg-[#ea724d] text-slate-700"
                      : "text-slate-300"
                  )}
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto border-t border-slate-700 p-4">
          <ul className="space-y-1">
            <li>
              <Link
                href="/dashboard/settings"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md ",
                  pathname === "/dashboard/settings"
                    ? "bg-[#ea724d] text-slate-700"
                    : "text-slate-300"
                )}
                onClick={() => isMobile && setIsOpen(false)}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            </li>
            {/* Show Logout only if session exists */}
            {session && (
              <li>
                <Link
                  href="/"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md ",
                    pathname === "/"
                      ? "bg-[#ea724d] text-slate-700"
                      : "text-slate-300"
                  )}
                  onClick={() => {
                    signOut({ callbackUrl: "/" });
                    isMobile && setIsOpen(false);
                  }}
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </Link>
              </li>
            )}
          </ul>
          <div className="mt-4 text-xs text-slate-500">
            © 2025 - FINDING YOUR FORTE: QUANTUM LEAP
          </div>
        </div>
      </aside>
    </>
  );
}

export function MobileHeader() {
  return (
    <header className="flex justify-end items-center mb-6 md:mb-6 pt-2"></header>
  );
}
