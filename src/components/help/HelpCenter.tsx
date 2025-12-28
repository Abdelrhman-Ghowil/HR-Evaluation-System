import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";

export type LocalRole = "admin" | "hr" | "manager" | "employee";
export type ApiRole = "ADMIN" | "HR" | "HOD" | "LM" | "EMP";

export type HelpAudience = {
  role?: LocalRole;
  api_role?: ApiRole;
};

export type HelpArticle = {
  id: string;
  category: string;
  title: string;
  content: string[];
  keywords: string[];
  audience?: HelpAudience[];
  defaultRoute?: string;
};

export function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchesAudience(audience: HelpAudience, user: { role?: LocalRole; api_role?: ApiRole } | null | undefined) {
  if (!user) return false;
  if (audience.role && user.role !== audience.role) return false;
  if (audience.api_role && user.api_role !== audience.api_role) return false;
  return true;
}

export function isArticleVisibleToUser(article: HelpArticle, user: { role?: LocalRole; api_role?: ApiRole } | null | undefined) {
  if (!article.audience || article.audience.length === 0) return true;
  return article.audience.some((a) => matchesAudience(a, user));
}

export function roleLabel(user: { role?: LocalRole; api_role?: ApiRole } | null | undefined) {
  if (!user?.role) return "User";
  switch (user.api_role) {
    case "ADMIN":
      return "Admin";
    case "HR":
      return "HR";
    case "HOD":
      return "Head of Department";
    case "LM":
      return "Line Manager";
    case "EMP":
      return "Employee";
    default:
      return user.role === "admin"
        ? "Admin"
        : user.role === "hr"
          ? "HR"
          : user.role === "manager"
            ? "Manager"
            : "Employee";
  }
}

export const helpArticles: HelpArticle[] = [
  {
    id: "getting-started-navigation",
    category: "Getting Started",
    title: "How to navigate the system",
    content: [
      "Step 1 — Use the sidebar to switch between modules (what you see depends on your role).",
      "Step 2 — If a module is missing, it is usually role/permission related.",
      "Step 3 — Use the Help icon in the header for page-specific tips and walkthroughs.",
    ],
    keywords: ["navigation", "sidebar", "role", "permissions", "access"],
    defaultRoute: "/",
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
    audience: [{ role: "admin" }, { role: "hr" }, { role: "manager" }],
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
    audience: [{ role: "admin" }, { role: "hr" }, { role: "manager" }],
    defaultRoute: "/employees",
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
    audience: [{ role: "admin" }, { role: "hr" }, { role: "manager" }],
    defaultRoute: "/employees",
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
    audience: [{ role: "admin" }, { role: "hr" }],
    defaultRoute: "/employees",
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
    audience: [{ role: "admin" }, { role: "hr" }],
    defaultRoute: "/employees",
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
    audience: [{ role: "admin" }, { role: "hr" }],
    defaultRoute: "/employees",
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
    audience: [{ role: "admin" }, { role: "hr" }],
    defaultRoute: "/employees",
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
    audience: [{ role: "admin" }, { role: "hr" }],
    defaultRoute: "/employees",
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
    audience: [{ role: "admin" }, { role: "hr" }, { role: "manager" }],
    defaultRoute: "/employees",
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
    audience: [{ role: "admin" }, { role: "hr" }, { role: "manager" }],
    defaultRoute: "/employees",
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
    audience: [{ role: "admin" }, { role: "hr" }, { role: "manager" }],
    defaultRoute: "/employees",
  },
  {
    id: "evaluations-objectives",
    category: "Evaluations",
    title: "Add and update objectives",
    content: [
      "Step 1 — Open the employee profile and open the evaluation.",
      "Step 2 — Go to the Objectives tab to add or edit objectives.",
      "Step 3 — Fill target, achieved, and weight carefully (weights impact scoring).",
      "Step 4 — Save, then review the total score and statuses.",
    ],
    keywords: ["objectives", "kpi", "target", "achieved", "weight", "evaluation"],
    audience: [{ role: "admin" }, { role: "hr" }, { role: "manager" }, { api_role: "EMP" }],
    defaultRoute: "/employees",
  },
  {
    id: "evaluations-competencies",
    category: "Evaluations",
    title: "Add and update competencies",
    content: [
      "Step 1 — Open the employee profile and open the evaluation.",
      "Step 2 — Go to the Competencies tab to add or edit competencies.",
      "Step 3 — Use clear descriptions so reviewers understand the rating.",
      "Step 4 — Save, then re-check the overall score.",
    ],
    keywords: ["competencies", "skills", "rating", "evaluation", "score"],
    audience: [{ role: "admin" }, { role: "hr" }, { role: "manager" }, { api_role: "EMP" }],
    defaultRoute: "/employees",
  },
  {
    id: "evaluations-submit-approve",
    category: "Evaluations",
    title: "Submit, approve, reject, and complete an evaluation",
    content: [
      "Step 1 — Start in Draft and finish objectives/competencies first.",
      "Step 2 — Submit: Draft → Pending HoD Approval (Line Manager).",
      "Step 3 — Approve/Reject: HoD handles Pending HoD Approval.",
      "Step 4 — Approve/Reject: HR handles Pending HR Approval, then completes after approval.",
      "Step 5 — Use Activity Log to confirm what happened and when.",
    ],
    keywords: ["submit", "approve", "reject", "complete", "hod", "hr", "workflow"],
    audience: [{ role: "admin" }, { role: "hr" }, { role: "manager" }],
    defaultRoute: "/employees",
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
    audience: [{ role: "admin" }, { role: "hr" }],
    defaultRoute: "/companies",
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
    audience: [{ role: "admin" }, { role: "hr" }],
    defaultRoute: "/companies",
  },
  {
    id: "companies-edit-delete",
    category: "Companies",
    title: "Edit or delete a company",
    content: [
      "Step 1 — Open Companies and find the company in the list.",
      "Step 2 — Click Edit to update details, then save.",
      "Step 3 — Click Delete only if you are sure (it can affect structure and reports).",
      "Step 4 — If delete is blocked, remove dependent records first (departments/placements).",
    ],
    keywords: ["company", "edit", "delete", "update", "remove"],
    audience: [{ role: "admin" }, { role: "hr" }],
    defaultRoute: "/companies",
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
    audience: [{ role: "admin" }, { role: "hr" }, { role: "manager" }],
    defaultRoute: "/departments",
  },
  {
    id: "departments-import-hierarchy",
    category: "Departments Structure",
    title: "Import departments hierarchy from Excel (HR/Admin)",
    content: [
      "Step 1 — Open Departments and click Import Hierarchy.",
      "Step 2 — Download the template from inside the import dialog.",
      "Step 3 — Upload your Excel/CSV and Validate first.",
      "Step 4 — If validation passes, click Import to apply the changes.",
    ],
    keywords: ["departments", "import", "hierarchy", "excel", "csv", "validate", "template"],
    audience: [{ role: "admin" }, { role: "hr" }],
    defaultRoute: "/departments",
  },
  {
    id: "departments-template",
    category: "Departments Structure",
    title: "Download the departments hierarchy template",
    content: [
      "Step 1 — Open Departments and click Import Hierarchy.",
      "Step 2 — Click Template to download the Excel file.",
      "Step 3 — Fill the template and validate before importing.",
    ],
    keywords: ["departments", "template", "excel", "download", "import hierarchy"],
    audience: [{ role: "admin" }, { role: "hr" }],
    defaultRoute: "/departments",
  },
  {
    id: "departments-manage",
    category: "Departments Structure",
    title: "Create, edit, and delete departments",
    content: [
      "Step 1 — Open Departments and select a company.",
      "Step 2 — Click Add Department, fill required fields, then save.",
      "Step 3 — Use Edit to update names/manager details.",
      "Step 4 — Use Delete carefully; if blocked, the department might have children.",
    ],
    keywords: ["departments", "add department", "edit department", "delete department", "manager"],
    audience: [{ role: "admin" }, { role: "hr" }, { api_role: "HOD" }],
    defaultRoute: "/departments",
  },
  {
    id: "subdepartments-manage",
    category: "Departments Structure",
    title: "Create and manage sub-departments",
    content: [
      "Step 1 — Open Sub-Departments.",
      "Step 2 — Choose the company and parent department (if needed).",
      "Step 3 — Click Add, fill details, then save.",
      "Step 4 — Use Edit/Delete to maintain clean structure.",
    ],
    keywords: ["sub-departments", "add sub-department", "edit", "delete", "structure"],
    audience: [{ role: "admin" }, { role: "hr" }, { role: "manager" }],
    defaultRoute: "/sub-departments",
  },
  {
    id: "sections-manage",
    category: "Departments Structure",
    title: "Create and manage sections",
    content: [
      "Step 1 — Open Sections (you can manage sections directly).",
      "Step 2 — Pick company/department/sub-department if you want scoped results.",
      "Step 3 — Click Add Section, assign manager if required, then save.",
      "Step 4 — Use Edit/Delete to keep the structure accurate.",
    ],
    keywords: ["sections", "add section", "edit", "delete", "manager"],
    audience: [{ role: "admin" }, { role: "hr" }, { role: "manager" }],
    defaultRoute: "/sections",
  },
  {
    id: "subsections-manage",
    category: "Departments Structure",
    title: "Create and manage sub-sections",
    content: [
      "Step 1 — Open Sub-Sections.",
      "Step 2 — Choose the parent section (or filter down to find it quickly).",
      "Step 3 — Click Add, fill the details, then save.",
      "Step 4 — Use Edit/Delete to maintain clean reporting levels.",
    ],
    keywords: ["sub-sections", "add sub-section", "edit", "delete", "reporting"],
    audience: [{ role: "admin" }, { role: "hr" }, { role: "manager" }],
    defaultRoute: "/sub-sections",
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
    audience: [{ role: "admin" }, { role: "hr" }, { api_role: "HOD" }],
    defaultRoute: "/replacements",
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
    audience: [{ role: "admin" }, { role: "hr" }, { api_role: "HOD" }],
    defaultRoute: "/replacements",
  },
  {
    id: "replacements-template",
    category: "Replacements",
    title: "Download the replacements Excel template",
    content: [
      "Step 1 — Open Replacements and click Import Excel.",
      "Step 2 — Download the Excel template from inside the import dialog.",
      "Step 3 — Fill the template and validate first (dry run), then import.",
    ],
    keywords: ["replacements", "template", "excel", "download", "import"],
    audience: [{ role: "admin" }, { role: "hr" }, { api_role: "HOD" }],
    defaultRoute: "/replacements",
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
    audience: [{ role: "admin" }],
    defaultRoute: "/admin/weights-configuration",
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
    audience: [{ role: "admin" }],
    defaultRoute: "/admin/user-management",
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
    audience: [{ role: "admin" }],
    defaultRoute: "/admin/user-management",
  },
  {
    id: "admin-users-edit-permissions",
    category: "Admin",
    title: "Edit a user and adjust permissions",
    content: [
      "Step 1 — Open User Management and search for the user.",
      "Step 2 — Click Edit to update details (name, role, contact info).",
      "Step 3 — Switch to Permissions and enable only what they need.",
      "Step 4 — Save, then ask the user to refresh and try again.",
    ],
    keywords: ["edit user", "permissions", "role", "access", "user management"],
    audience: [{ role: "admin" }],
    defaultRoute: "/admin/user-management",
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
    audience: [{ role: "admin" }, { role: "hr" }, { role: "manager" }, { role: "employee" }],
    defaultRoute: "/profile",
  },
  {
    id: "profile-performance",
    category: "Profile",
    title: "View your performance and evaluations",
    content: [
      "Step 1 — Open Profile and go to the Performance tab.",
      "Step 2 — Pick an evaluation to open the details panel.",
      "Step 3 — Review objectives and competencies, then close the panel to return.",
    ],
    keywords: ["profile", "performance", "evaluations", "objectives", "competencies"],
    audience: [{ api_role: "EMP" }, { api_role: "LM" }, { api_role: "HOD" }, { api_role: "HR" }, { api_role: "ADMIN" }],
    defaultRoute: "/profile?tab=performance",
  },
  {
    id: "profile-self-review",
    category: "Profile",
    title: "Complete your self-review",
    content: [
      "Step 1 — Open Profile and go to the Self-Review tab.",
      "Step 2 — Choose an evaluation period (if available).",
      "Step 3 — Update your self objectives/competencies and save.",
      "Step 4 — If the tab is missing, it is role/permission related.",
    ],
    keywords: ["profile", "self review", "self evaluation", "objectives", "competencies"],
    audience: [{ api_role: "EMP" }, { api_role: "LM" }, { api_role: "HOD" }, { api_role: "HR" }, { api_role: "ADMIN" }],
    defaultRoute: "/profile?tab=self-review",
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
    defaultRoute: "/",
  },
  {
    id: "shortcuts",
    category: "Productivity",
    title: "Keyboard shortcuts",
    content: ["Step 1 — Press Shift + / (or ?).", "Step 2 — Press B to toggle the sidebar."],
    keywords: ["shortcuts", "keyboard", "?", "shift", "/"],
    defaultRoute: "/",
  },
];

export default function HelpCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");

  const visibleArticles = useMemo(() => {
    return helpArticles.filter((a) => isArticleVisibleToUser(a, user as unknown as { role?: LocalRole; api_role?: ApiRole }));
  }, [user]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return visibleArticles;
    return visibleArticles.filter((a) => {
      const haystack = [a.category, a.title, ...a.content, ...a.keywords, a.defaultRoute ?? ""].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [query, visibleArticles]);

  const openWalkthrough = (article: HelpArticle) => {
    const params = new URLSearchParams(location.search);
    params.set("guide", article.id);
    const search = params.toString();
    navigate({ pathname: location.pathname, search: search ? `?${search}` : "" });
  };

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
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="h-fit">
            {roleLabel(user as unknown as { role?: LocalRole; api_role?: ApiRole })}
          </Badge>
          <Badge variant="secondary" className="h-fit">
            Searchable
          </Badge>
        </div>
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
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <Badge variant="secondary">Interactive</Badge>
                          <Button size="sm" onClick={() => openWalkthrough(article)}>
                            Start Walkthrough
                          </Button>
                        </div>
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
