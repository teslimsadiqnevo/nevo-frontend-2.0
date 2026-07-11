"use client";

import {
  BookOpen,
  Download,
  Home,
  MessageCircle,
  TrendingUp,
} from "lucide-react";
import {
  BottomNav,
  Button,
  Sidebar,
  TopNav,
  type NavItem,
} from "@/components/shared";

// Icon components are functions, so nav items must be defined in a client module
// (they can't be passed across the server → client boundary as props).
const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/dev/components", icon: Home },
  { label: "Lessons", href: "#lessons", icon: BookOpen },
  { label: "Progress", href: "#progress", icon: TrendingUp },
  { label: "Downloads", href: "#downloads", icon: Download },
  { label: "Connect", href: "#connect", icon: MessageCircle },
];

export function NavDemo() {
  return (
    <div className="flex flex-col gap-6">
      <TopNav
        className="max-w-2xl rounded-xl border-[1.5px] border-nevo-near-black/10"
        right={<Button size="md">Get started</Button>}
      />
      <div className="flex flex-wrap items-start gap-6">
        <div className="h-[468px]">
          <Sidebar
            items={NAV_ITEMS}
            activeHref="/dev/components"
            user={{ name: "Amara M.", subtitle: "Grade 6", initials: "AM" }}
            className="rounded-xl shadow-elevation-1"
          />
        </div>
        <BottomNav
          items={NAV_ITEMS}
          activeHref="/dev/components"
          className="max-w-[375px]"
        />
      </div>
    </div>
  );
}
