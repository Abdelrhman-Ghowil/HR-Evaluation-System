import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { BookOpen, ChevronRight, HelpCircle, Keyboard, LifeBuoy } from "lucide-react";

type HelpLink =
  | {
      id: string;
      title: string;
      description: string;
      type: "route";
      to: string;
      keywords: string[];
    }
  | {
      id: string;
      title: string;
      description: string;
      type: "action";
      action: "shortcuts";
      keywords: string[];
    };

type ContextualHelp = {
  title: string;
  summary: string;
  bullets: string[];
  learnMoreTo: string;
};

function normalizeSearchTerm(value: string) {
  return value.trim().toLowerCase();
}

function buildContextualHelp(activeView: string): ContextualHelp {
  switch (activeView) {
    case "employees":
      return {
        title: "Employees",
        summary: "Manage employee profiles and contact details.",
        bullets: [
          "Step 1 — Find the employee using search and filters.",
          "Step 2 — Open the employee profile for details and evaluation history.",
          "Step 3 — Use Add/Edit/Import depending on what you need.",
        ],
        learnMoreTo: "/help",
      };
    case "evaluations":
      return {
        title: "Evaluations",
        summary: "Create and track evaluations for employees.",
        bullets: [
          "Step 1 — Open an employee profile from Employees.",
          "Step 2 — In Evaluation History, add or select an evaluation.",
          "Step 3 — Follow the workflow: Draft → approvals → employee review → completed.",
        ],
        learnMoreTo: "/help",
      };
    case "companies":
      return {
        title: "Companies",
        summary: "Maintain the list of companies in the organization.",
        bullets: [
          "Step 1 — Add a company (or import a list).",
          "Step 2 — Build the structure under it (Departments → Sub-departments → Sections).",
          "Step 3 — Use export to audit and share a snapshot.",
        ],
        learnMoreTo: "/help",
      };
    case "departments":
    case "sub-departments":
    case "sections":
    case "sub-sections":
      return {
        title: "Departments Structure",
        summary: "Build the organizational hierarchy used for access and reporting.",
        bullets: [
          "Step 1 — Start top-down (Company → Department → Sub-department → Section).",
          "Step 2 — Keep names consistent so reports are clean.",
          "Step 3 — If you cannot find a unit in a dropdown, it might not exist yet.",
        ],
        learnMoreTo: "/help",
      };
    case "replacements":
      return {
        title: "Replacements",
        summary: "Track replacement/placement records for employees.",
        bullets: [
          "Step 1 — Pick the employee.",
          "Step 2 — Select Company → Department → Sub-department → Section → Sub-section.",
          "Step 3 — Save, or use import for bulk updates.",
        ],
        learnMoreTo: "/help",
      };
    case "admin":
    case "weights-configuration":
    case "user-management":
      return {
        title: "Admin Tools",
        summary: "Configure system rules and manage access.",
        bullets: [
          "Step 1 — Configure weights carefully (totals must equal 100%).",
          "Step 2 — Create users and assign roles/permissions.",
          "Step 3 — Use the Help Center for plain-language explanations.",
        ],
        learnMoreTo: "/help",
      };
    case "profile":
      return {
        title: "Profile",
        summary: "Update your profile details and account settings.",
        bullets: [
          "Step 1 — Update your details and save.",
          "Step 2 — Use Settings for security-related options.",
          "Step 3 — If something is locked, it is managed by Admin/HR.",
        ],
        learnMoreTo: "/help",
      };
    case "help":
      return {
        title: "Help Center",
        summary: "Search workflows and step-by-step guidance.",
        bullets: [
          "Step 1 — Search for a feature like “employees”, “weights”, or “replacements”.",
          "Step 2 — Open a topic and follow the steps.",
          "Step 3 — Return to your page and use the Help drawer as a reminder.",
        ],
        learnMoreTo: "/help",
      };
    case "dashboard":
    default:
      return {
        title: "Dashboard",
        summary: "Start here to access the main areas of the system.",
        bullets: [
          "Step 1 — Use the sidebar to choose what you want to do.",
          "Step 2 — If a module is missing, it is usually permission-related.",
          "Step 3 — Use the Help icon for guidance anywhere.",
        ],
        learnMoreTo: "/help",
      };
  }
}

const helpLinks: HelpLink[] = [
  {
    id: "help-center",
    title: "Help Center",
    description: "Search guides and plain-language explanations.",
    type: "route",
    to: "/help",
    keywords: ["help", "docs", "guide", "how to", "support", "faq", "search"],
  },
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    description: "Open the shortcuts overlay (Shift + /).",
    type: "action",
    action: "shortcuts",
    keywords: ["keyboard", "shortcuts", "?", "shift", "/"],
  },
  {
    id: "profile",
    title: "Profile & Settings",
    description: "Update your details and security preferences.",
    type: "route",
    to: "/profile",
    keywords: ["profile", "settings", "security", "password"],
  },
];

export type HelpDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeView: string;
  onOpenKeyboardShortcuts?: () => void;
};

export default function HelpDrawer({ open, onOpenChange, activeView, onOpenKeyboardShortcuts }: HelpDrawerProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const contextualHelp = useMemo(() => buildContextualHelp(activeView), [activeView]);

  const filteredLinks = useMemo(() => {
    const q = normalizeSearchTerm(query);
    if (!q) return helpLinks;
    return helpLinks.filter((item) => {
      const haystack = [item.title, item.description, ...item.keywords].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

  const filteredContextBullets = useMemo(() => {
    const q = normalizeSearchTerm(query);
    if (!q) return contextualHelp.bullets;
    return contextualHelp.bullets.filter((b) => b.toLowerCase().includes(q));
  }, [query, contextualHelp.bullets]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Help
          </SheetTitle>
          <SheetDescription>Quick explanations and links for the screen you are on.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search help..." />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Quick Links</div>
              <Badge variant="secondary" className="text-xs">
                Always available
              </Badge>
            </div>

            <div className="space-y-2">
              {filteredLinks.map((item) => {
                const icon =
                  item.id === "help-center"
                    ? BookOpen
                    : item.id === "shortcuts"
                      ? Keyboard
                      : item.id === "profile"
                        ? LifeBuoy
                        : HelpCircle;
                const Icon = icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.type === "route") {
                        onOpenChange(false);
                        navigate(item.to);
                        return;
                      }
                      if (item.type === "action" && item.action === "shortcuts") {
                        onOpenChange(false);
                        onOpenKeyboardShortcuts?.();
                      }
                    }}
                    className="w-full rounded-lg border bg-white p-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-md bg-gray-100 p-2">
                        <Icon className="h-4 w-4 text-gray-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium text-gray-900 truncate">{item.title}</div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="text-sm text-gray-600">{item.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">{contextualHelp.title}</div>
              <Badge variant="outline" className="text-xs">
                This page
              </Badge>
            </div>
            <div className="text-sm text-gray-600">{contextualHelp.summary}</div>

            <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
              {filteredContextBullets.length > 0 ? (
                filteredContextBullets.map((b) => <li key={b}>{b}</li>)
              ) : (
                <li>No matching tips for your search.</li>
              )}
            </ul>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  navigate(contextualHelp.learnMoreTo);
                }}
              >
                Open Help Center
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setQuery("");
                }}
              >
                Clear Search
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

