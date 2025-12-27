import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Search } from "lucide-react";

type HelpArticle = {
  id: string;
  category: string;
  title: string;
  content: string[];
  keywords: string[];
};

function normalize(value: string) {
  return value.trim().toLowerCase();
}

const helpArticles: HelpArticle[] = [
  {
    id: "getting-started-navigation",
    category: "Getting Started",
    title: "How to navigate the system",
    content: [
      "Step 1 — Use the sidebar to switch between modules (Employees, Companies, Departments, Admin Tools).",
      "Step 2 — If you do not see a module, it is usually role/permission related.",
      "Step 3 — Use the Help icon in the header for page-specific tips.",
    ],
    keywords: ["navigation", "sidebar", "role", "permissions", "access"],
  },
  {
    id: "structure-hierarchy",
    category: "Departments Structure",
    title: "What are departments, sections, and sub-sections?",
    content: [
      "Departments = the top level (big units).",
      "Sub-departments = smaller groups inside a department.",
      "Sections/Sub-sections = optional extra levels for teams and reporting.",
      "Friendly tip: build top-down so you do not have to rework later.",
    ],
    keywords: ["department", "sub-department", "section", "sub-section", "hierarchy"],
  },
  {
    id: "employees-search",
    category: "Employees",
    title: "How to find an employee quickly",
    content: [
      "Step 1 — Use search (name, email, or code).",
      "Step 2 — If you filtered by company/department, reset filters to “all”.",
      "Step 3 — If results are still empty, check whether your role can view employees in that scope.",
    ],
    keywords: ["employees", "search", "filter", "find", "permissions"],
  },
  {
    id: "employees-open-profile",
    category: "Employees",
    title: "Open an employee profile (and return safely)",
    content: [
      "Step 1 — Open Employees from the sidebar.",
      "Step 2 — Click the employee card to open the profile details.",
      "Step 3 — Use Back to return to the list without losing your context.",
    ],
    keywords: ["employee", "profile", "details", "back", "card"],
  },
  {
    id: "employees-add",
    category: "Employees",
    title: "Add a new employee (HR/Admin)",
    content: [
      "Step 1 — Open Employees and click “Add Employee”.",
      "Step 2 — Fill the basics first: name, email, phone, company, department, position.",
      "Step 3 — Choose the correct role (Employee / Line Manager / HoD / HR / Admin).",
      "Step 4 — Save. If a field is highlighted, fix that first and try again.",
    ],
    keywords: ["add employee", "create employee", "hr", "admin", "role", "department", "company"],
  },
  {
    id: "employees-edit",
    category: "Employees",
    title: "Edit employee information",
    content: [
      "Step 1 — Find the employee using search or filters.",
      "Step 2 — Click Edit and update only what changed.",
      "Step 3 — Save. If something is locked, it is usually permission-related.",
    ],
    keywords: ["edit employee", "update employee", "employee info"],
  },
  {
    id: "employees-status",
    category: "Employees",
    title: "Activate / deactivate an employee",
    content: [
      "Step 1 — Open the employee in the list.",
      "Step 2 — Use the status toggle (Active / Inactive).",
      "Step 3 — If you cannot change status, ask an Admin/HR to update it.",
    ],
    keywords: ["active", "inactive", "status", "deactivate", "activate"],
  },
  {
    id: "employees-import",
    category: "Employees",
    title: "Import employees from Excel (HR/Admin)",
    content: [
      "Step 1 — Open Employees and click Import.",
      "Step 2 — Upload the file and wait for the results screen.",
      "Step 3 — Review errors by field/row, fix the file, then re-upload.",
      "Friendly tip: start with a small file to confirm the format.",
    ],
    keywords: ["import", "employees", "excel", "upload", "errors", "rows"],
  },
  {
    id: "employees-export",
    category: "Employees",
    title: "Export employees",
    content: [
      "Step 1 — Apply filters first if you only need a specific group.",
      "Step 2 — Click Export/Download.",
      "Step 3 — Use the export to review data or share a snapshot.",
    ],
    keywords: ["export", "download", "employees", "spreadsheet", "xlsx"],
  },
  {
    id: "evaluations-create",
    category: "Evaluations",
    title: "Create evaluations for an employee",
    content: [
      "Step 1 — Open Employees and open the employee profile.",
      "Step 2 — In “Evaluation History”, click “Add Evaluation”.",
      "Step 3 — Choose the year (and quarter if applicable).",
      "Step 4 — Create. The system can create multiple records at once (annual or quarterly).",
    ],
    keywords: ["evaluation", "create", "add evaluation", "annual", "quarterly", "employee profile"],
  },
  {
    id: "evaluations-workflow",
    category: "Evaluations",
    title: "Evaluation status workflow (what happens next)",
    content: [
      "Step 1 — Draft: you can edit and prepare the evaluation.",
      "Step 2 — Pending HoD Approval: HoD reviews and approves/rejects.",
      "Step 3 — Pending HR Approval: HR reviews for consistency and policy.",
      "Step 4 — Employee Review: employee can view and acknowledge.",
      "Step 5 — Approved → Completed: final state used for reporting.",
    ],
    keywords: ["evaluation", "status", "workflow", "draft", "approval", "hod", "hr", "employee review"],
  },
  {
    id: "evaluations-view",
    category: "Evaluations",
    title: "Open an evaluation and see the details",
    content: [
      "Step 1 — Open the employee profile and select an evaluation from the list.",
      "Step 2 — Review competencies and objectives (tabs).",
      "Step 3 — Use the activity log to understand what changed and when.",
    ],
    keywords: ["evaluation details", "competencies", "objectives", "activity log"],
  },
  {
    id: "companies-add",
    category: "Companies",
    title: "Add a company",
    content: [
      "Step 1 — Open Companies from the sidebar.",
      "Step 2 — Click Add Company and enter the basics.",
      "Step 3 — Save, then move to Departments to build structure under it.",
    ],
    keywords: ["company", "add company", "create company", "organization"],
  },
  {
    id: "companies-import-export",
    category: "Companies",
    title: "Import / export companies",
    content: [
      "Step 1 — Use Import when adding many items (faster and consistent).",
      "Step 2 — If you get errors, fix them in the sheet and upload again.",
      "Step 3 — Use Export to audit the current list or share it.",
    ],
    keywords: ["companies", "import", "export", "xlsx", "download", "upload"],
  },
  {
    id: "structure-setup-order",
    category: "Departments Structure",
    title: "Best order to build the organization structure",
    content: [
      "Step 1 — Create Companies.",
      "Step 2 — Create Departments under each company.",
      "Step 3 — Create Sub-departments under departments.",
      "Step 4 — Add Sections and Sub-sections if your reporting needs them.",
      "Friendly tip: keep naming consistent (same style, no duplicates).",
    ],
    keywords: ["setup", "order", "departments", "sub-departments", "sections", "hierarchy"],
  },
  {
    id: "replacements-create",
    category: "Replacements",
    title: "Create a replacement/placement record",
    content: [
      "Step 1 — Open Replacements.",
      "Step 2 — Click Add and select the employee.",
      "Step 3 — Choose Company → Department → Sub-department → Section → Sub-section (top-down).",
      "Step 4 — Save. If a dropdown is empty, the structure might not exist yet.",
    ],
    keywords: ["replacement", "placement", "create", "employee", "hierarchy"],
  },
  {
    id: "replacements-import",
    category: "Replacements",
    title: "Import replacement/placement records",
    content: [
      "Step 1 — Open Replacements and click Import.",
      "Step 2 — Upload the file and review the results.",
      "Step 3 — Fix errors (usually missing IDs or mismatched names) and re-upload.",
    ],
    keywords: ["replacements", "import", "upload", "errors", "placements"],
  },
  {
    id: "admin-weights",
    category: "Admin",
    title: "What do weights configuration changes affect?",
    content: [
      "Step 1 — Open Admin Tools → Weights Configuration.",
      "Step 2 — Pick the level you are editing (this matters).",
      "Step 3 — Click Edit Configuration, change values, and confirm totals are 100%.",
      "Step 4 — Save. Friendly reminder: changes affect scoring behavior for new evaluations.",
    ],
    keywords: ["weights", "configuration", "admin", "evaluation", "scoring", "100%"],
  },
  {
    id: "admin-users",
    category: "Admin",
    title: "How roles and permissions work",
    content: [
      "Step 1 — Roles control what a user can generally see (pages/modules).",
      "Step 2 — Permissions control sensitive actions (create/edit/delete/export).",
      "Step 3 — If someone cannot see a page, check role first, then permissions.",
    ],
    keywords: ["roles", "permissions", "users", "admin", "access"],
  },
  {
    id: "admin-users-workflow",
    category: "Admin",
    title: "Create a user (Admin)",
    content: [
      "Step 1 — Open Admin Tools → User Management.",
      "Step 2 — Click Add User and enter name, email, and role.",
      "Step 3 — Review permissions (what the user will be able to do).",
      "Step 4 — Save. Test by logging in as that user if needed.",
    ],
    keywords: ["create user", "user management", "admin", "role", "permissions"],
  },
  {
    id: "profile-update",
    category: "Profile",
    title: "Update your profile",
    content: [
      "Step 1 — Open Profile from the sidebar or user menu.",
      "Step 2 — Update your details and save.",
      "Step 3 — If something is locked, it is managed by Admin/HR.",
    ],
    keywords: ["profile", "update", "settings", "account"],
  },
  {
    id: "troubleshooting-access-denied",
    category: "Troubleshooting",
    title: "I got “Access denied” — what do I do?",
    content: [
      "Step 1 — Confirm you are in the correct account (role).",
      "Step 2 — Ask Admin/HR to grant the role/permissions needed for that module.",
      "Step 3 — Refresh and try again after permissions are updated.",
    ],
    keywords: ["access denied", "permission", "role", "unauthorized", "forbidden"],
  },
  {
    id: "shortcuts",
    category: "Productivity",
    title: "Keyboard shortcuts",
    content: ["Step 1 — Press Shift + / (or ?).", "Step 2 — Press B to toggle the sidebar."],
    keywords: ["shortcuts", "keyboard", "?", "shift", "/"],
  },
];

export default function HelpCenter() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return helpArticles;
    return helpArticles.filter((a) => {
      const haystack = [a.category, a.title, ...a.content, ...a.keywords].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

  const categories = useMemo(() => {
    const grouped = new Map<string, HelpArticle[]>();
    for (const article of filtered) {
      const list = grouped.get(article.category) ?? [];
      list.push(article);
      grouped.set(article.category, list);
    }
    return Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
          </div>
          <p className="text-gray-600">Plain-language guidance to help you complete tasks confidently.</p>
        </div>
        <Badge variant="secondary" className="h-fit">
          Searchable
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>Type a keyword like “weights”, “permissions”, or “departments”.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search help topics..." className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {categories.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No results</CardTitle>
            <CardDescription>Try shorter keywords or different terms.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-6">
          {categories.map(([category, items]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  <span>{category}</span>
                  <Badge variant="outline">{items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {items.map((article) => (
                    <AccordionItem key={article.id} value={article.id}>
                      <AccordionTrigger className="text-left">{article.title}</AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2 text-sm text-gray-700 list-disc pl-5">
                          {article.content.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
