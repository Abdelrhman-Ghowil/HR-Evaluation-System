
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, Shield, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import ConfirmationDialog from '@/components/ui/confirmation-dialog';
import apiService from '@/services/api';

interface AdminToolsProps {
  onNavigateToWeights?: () => void;
  onNavigateToUserManagement?: () => void;
}

const AdminTools: React.FC<AdminToolsProps> = ({ onNavigateToWeights, onNavigateToUserManagement }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  type DangerZoneEntityType =
    | 'employees'
    | 'departments'
    | 'companies'
    | 'sub-departments'
    | 'sections'
    | 'sub-sections'
    | 'placements'
    | 'users';

  const [dangerZoneEntity, setDangerZoneEntity] = useState<DangerZoneEntityType | ''>('');
  const [dangerZoneRecords, setDangerZoneRecords] = useState<Array<Record<string, unknown>>>([]);
  const [dangerZoneSelectedIds, setDangerZoneSelectedIds] = useState<string[]>([]);
  const [dangerZoneLoading, setDangerZoneLoading] = useState(false);
  const [dangerZoneDeleting, setDangerZoneDeleting] = useState(false);
  const [dangerZoneConfirmOpen, setDangerZoneConfirmOpen] = useState(false);
  const [dangerZoneConfirmMode, setDangerZoneConfirmMode] = useState<'selected' | 'filtered' | 'all'>('selected');
  const [dangerZoneFilterText, setDangerZoneFilterText] = useState('');
  const [dangerZoneFilterColumn, setDangerZoneFilterColumn] = useState<string>('all');
  const [dangerZoneFilterValue, setDangerZoneFilterValue] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user && !isAdmin) {
      toast.error('Access denied');
      navigate('/', { replace: true });
    }
  }, [isAdmin, navigate, user]);

  const steps = useMemo(
    () => [
      {
        id: 'weights',
        title: 'Review weights configuration',
        description: 'Confirm the weight totals and understand how scoring is calculated.',
        onClick: onNavigateToWeights,
      },
      {
        id: 'users',
        title: 'Set up users and roles',
        description: 'Assign roles and permissions so users only see what they need.',
        onClick: onNavigateToUserManagement,
      },
      {
        id: 'help',
        title: 'Use the Help Center',
        description: 'Search plain-language explanations directly inside the system.',
        onClick: () => navigate('/help'),
      },
      {
        id: 'shortcuts',
        title: 'Learn keyboard shortcuts',
        description: 'Press Shift + / to open the shortcuts panel anywhere.',
        onClick: undefined,
      },
    ],
    [navigate, onNavigateToUserManagement, onNavigateToWeights]
  );

  useEffect(() => {
    const key = 'hr-system:admin-onboarding-completed';
    const alreadyCompleted = localStorage.getItem(key) === 'true';
    if (!alreadyCompleted) setOnboardingOpen(true);
  }, []);

  const closeOnboarding = (markCompleted: boolean) => {
    if (markCompleted) {
      localStorage.setItem('hr-system:admin-onboarding-completed', 'true');
    }
    setOnboardingOpen(false);
  };

  const tools = [
    {
      title: 'System Configuration',
      description: 'Configure evaluation weights and scoring rules',
      icon: Settings,
      action: 'Configure',
      onClick: onNavigateToWeights
    },
    {
      title: 'User Management',
      description: 'Manage user roles and permissions',
      icon: Shield,
      action: 'Manage Users',
      onClick: onNavigateToUserManagement
    }
  ];

  const dangerZoneEntities: Array<{ value: DangerZoneEntityType; label: string }> = [
    { value: 'employees', label: 'Employees' },
    { value: 'departments', label: 'Departments' },
    { value: 'companies', label: 'Companies' },
    { value: 'sub-departments', label: 'Sub-Departments' },
    { value: 'sections', label: 'Sections' },
    { value: 'sub-sections', label: 'Sub-Sections' },
    { value: 'placements', label: 'Placements' },
    { value: 'users', label: 'Users' },
  ];

  const extractResults = <T,>(value: unknown): T[] => {
    if (Array.isArray(value)) return value as T[];
    if (!value || typeof value !== 'object') return [];
    const v = value as any;
    if (Array.isArray(v.results)) return v.results as T[];
    if (Array.isArray(v.data)) return v.data as T[];
    if (v.data && typeof v.data === 'object') {
      if (Array.isArray(v.data.results)) return v.data.results as T[];
      if (Array.isArray(v.data.data)) return v.data.data as T[];
    }
    return [];
  };

  const stringifyValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const isAdminUserRecord = (record: Record<string, unknown>): boolean => {
    const role = String(record.role ?? record.api_role ?? '').toLowerCase();
    return role === 'admin';
  };

  const isRecordDeletable = (record: Record<string, unknown>): boolean => {
    if (dangerZoneEntity === 'users') return !isAdminUserRecord(record);
    return true;
  };

  const getRecordId = (record: Record<string, unknown>): string => {
    if (!dangerZoneEntity) return '';
    switch (dangerZoneEntity) {
      case 'employees':
        return String(record.employee_id ?? '');
      case 'departments':
        return String(record.department_id ?? '');
      case 'companies':
        return String(record.company_id ?? '');
      case 'sub-departments':
        return String(record.sub_department_id ?? '');
      case 'sections':
        return String(record.section_id ?? '');
      case 'sub-sections':
        return String(record.sub_section_id ?? '');
      case 'placements':
        return String(record.placement_id ?? '');
      case 'users':
        return String(record.user_id ?? '');
      default:
        return '';
    }
  };

  const dangerZoneColumns = useMemo(() => {
    const set = new Set<string>();
    for (const record of dangerZoneRecords) {
      Object.keys(record || {}).forEach((k) => set.add(k));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [dangerZoneRecords]);

  const filteredDangerZoneRecords = useMemo(() => {
    const q = dangerZoneFilterText.trim().toLowerCase();
    const col = dangerZoneFilterColumn === 'all' ? '' : dangerZoneFilterColumn;
    const v = dangerZoneFilterValue.trim().toLowerCase();

    return dangerZoneRecords.filter((record) => {
      if (!record) return false;

      const matchesSearch =
        !q ||
        Object.values(record).some((value) => stringifyValue(value).toLowerCase().includes(q));

      const matchesColumn =
        !col || !v ? true : stringifyValue(record[col]).toLowerCase().includes(v);

      return matchesSearch && matchesColumn;
    });
  }, [dangerZoneFilterColumn, dangerZoneFilterText, dangerZoneFilterValue, dangerZoneRecords]);

  const deletableFilteredIds = useMemo(() => {
    if (!dangerZoneEntity) return [];
    return filteredDangerZoneRecords
      .filter((r) => isRecordDeletable(r))
      .map((r) => getRecordId(r))
      .filter(Boolean);
  }, [dangerZoneEntity, filteredDangerZoneRecords]);

  const deletableAllIds = useMemo(() => {
    if (!dangerZoneEntity) return [];
    return dangerZoneRecords
      .filter((r) => isRecordDeletable(r))
      .map((r) => getRecordId(r))
      .filter(Boolean);
  }, [dangerZoneEntity, dangerZoneRecords]);

  const loadDangerZoneItems = async (entity: DangerZoneEntityType) => {
    setDangerZoneLoading(true);
    setDangerZoneRecords([]);
    setDangerZoneSelectedIds([]);
    setDangerZoneFilterText('');
    setDangerZoneFilterColumn('all');
    setDangerZoneFilterValue('');
    try {
      let records: Array<Record<string, unknown>> = [];

      switch (entity) {
        case 'employees': {
          const employeesResponse = await apiService.getEmployees();
          records = extractResults<Record<string, unknown>>(employeesResponse);
          break;
        }
        case 'departments': {
          const departmentsResponse = await apiService.getDepartments();
          records = extractResults<Record<string, unknown>>(departmentsResponse);
          break;
        }
        case 'companies': {
          const companiesResponse = await apiService.getCompanies();
          records = extractResults<Record<string, unknown>>(companiesResponse);
          break;
        }
        case 'sub-departments': {
          const subDepartmentsResponse = await apiService.getSubDepartments();
          records = extractResults<Record<string, unknown>>(subDepartmentsResponse);
          break;
        }
        case 'sections': {
          const sectionsResponse = await apiService.getSections();
          records = extractResults<Record<string, unknown>>(sectionsResponse);
          break;
        }
        case 'sub-sections': {
          const subSectionsResponse = await apiService.getSubSections();
          records = extractResults<Record<string, unknown>>(subSectionsResponse);
          break;
        }
        case 'placements': {
          const placements = await apiService.getPlacements();
          records = extractResults<Record<string, unknown>>(placements);
          break;
        }
        case 'users': {
          const users = await apiService.getUsers();
          records = extractResults<Record<string, unknown>>(users);
          break;
        }
        default:
          records = [];
      }

      setDangerZoneRecords(records);
    } catch (error) {
      toast.error('Failed to load items');
      setDangerZoneRecords([]);
    } finally {
      setDangerZoneLoading(false);
    }
  };

  const dangerZoneSelectedCount = dangerZoneSelectedIds.length;
  const dangerZoneAllSelected = deletableFilteredIds.length > 0 && deletableFilteredIds.every((id) => dangerZoneSelectedIds.includes(id));
  const dangerZoneSomeSelected =
    dangerZoneSelectedCount > 0 && !dangerZoneAllSelected && deletableFilteredIds.some((id) => dangerZoneSelectedIds.includes(id));

  const toggleDangerZoneSelectAll = (checked: boolean) => {
    if (!checked) {
      setDangerZoneSelectedIds([]);
      return;
    }
    setDangerZoneSelectedIds(deletableFilteredIds);
  };

  const toggleDangerZoneItem = (id: string, checked: boolean) => {
    setDangerZoneSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id];
      return prev.filter((x) => x !== id);
    });
  };

  const getIdsToDelete = (mode: 'selected' | 'filtered' | 'all'): string[] => {
    if (mode === 'selected') {
      const allowed = new Set(deletableAllIds);
      return dangerZoneSelectedIds.filter((id) => allowed.has(id));
    }
    if (mode === 'filtered') return deletableFilteredIds;
    return deletableAllIds;
  };

  const deleteDangerZoneIds = async (ids: string[]) => {
    if (!isAdmin) {
      toast.error('Access denied');
      return;
    }
    if (!dangerZoneEntity) return;
    if (ids.length === 0) return;

    setDangerZoneDeleting(true);
    try {
      const selected = new Set(ids);
      const failures: string[] = [];
      let successCount = 0;

      for (const id of ids) {
        try {
          switch (dangerZoneEntity) {
            case 'employees':
              await apiService.deleteEmployee(id);
              break;
            case 'departments':
              await apiService.deleteDepartment(id);
              break;
            case 'companies':
              await apiService.deleteCompany(id);
              break;
            case 'sub-departments':
              await apiService.deleteSubDepartment(id);
              break;
            case 'sections':
              await apiService.deleteSection(id);
              break;
            case 'sub-sections':
              await apiService.deleteSubSection(id);
              break;
            case 'placements':
              await apiService.deletePlacement(id);
              break;
            case 'users':
              await apiService.deleteUser(id);
              break;
            default:
              throw new Error('Unsupported entity type');
          }
          successCount += 1;
        } catch {
          failures.push(id);
        }
      }

      if (successCount > 0) toast.success(`Deleted ${successCount} item(s).`);
      if (failures.length > 0) {
        toast.error(`Failed to delete ${failures.length} item(s).`);
      }

      const remaining = dangerZoneRecords.filter((record) => {
        const recordId = getRecordId(record);
        if (!recordId) return true;
        if (!selected.has(recordId)) return true;
        return failures.includes(recordId);
      });
      setDangerZoneRecords(remaining);
      setDangerZoneSelectedIds(failures);
    } finally {
      setDangerZoneDeleting(false);
      setDangerZoneConfirmOpen(false);
    }
  };

  if (user && !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Admin Onboarding Checklist</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              Use this quick checklist to get the system ready. You can skip and return later.
            </div>

            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.id} className="flex items-start gap-3 rounded-lg border p-3">
                  <Checkbox
                    checked={Boolean(completedSteps[step.id])}
                    onCheckedChange={(checked) =>
                      setCompletedSteps((prev) => ({ ...prev, [step.id]: Boolean(checked) }))
                    }
                    aria-label={`Mark ${step.title} as completed`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-gray-900">{step.title}</div>
                      {step.onClick && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            step.onClick?.();
                            setCompletedSteps((prev) => ({ ...prev, [step.id]: true }));
                          }}
                        >
                          Open
                        </Button>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => closeOnboarding(false)}>
              Skip for now
            </Button>
            <Button onClick={() => closeOnboarding(true)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Admin Tools</h2>
        <p className="text-gray-600">System administration and configuration</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card key={tool.title} className="hover:shadow-md transition-all duration-200">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Icon className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle>{tool.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">{tool.description}</p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={tool.onClick}
                >
                  {tool.action}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <span>Danger Zone</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm font-medium text-gray-900">Bulk delete</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <div className="text-sm font-medium text-gray-700 mb-2">Entity</div>
              <Select
                value={dangerZoneEntity}
                onValueChange={(value) => {
                  const next = value as DangerZoneEntityType;
                  setDangerZoneEntity(next);
                  loadDangerZoneItems(next);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select entity type" />
                </SelectTrigger>
                <SelectContent>
                  {dangerZoneEntities.map((e) => (
                    <SelectItem key={e.value} value={e.value}>
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => dangerZoneEntity && loadDangerZoneItems(dangerZoneEntity)}
                disabled={!dangerZoneEntity || dangerZoneLoading || dangerZoneDeleting}
              >
                {dangerZoneLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading
                  </>
                ) : (
                  'Reload'
                )}
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  setDangerZoneConfirmMode('selected');
                  setDangerZoneConfirmOpen(true);
                }}
                disabled={!dangerZoneEntity || getIdsToDelete('selected').length === 0 || dangerZoneLoading || dangerZoneDeleting}
              >
                {dangerZoneDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting
                  </>
                ) : (
                  `Delete selected (${getIdsToDelete('selected').length})`
                )}
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  setDangerZoneConfirmMode('filtered');
                  setDangerZoneConfirmOpen(true);
                }}
                disabled={!dangerZoneEntity || getIdsToDelete('filtered').length === 0 || dangerZoneLoading || dangerZoneDeleting}
              >
                {dangerZoneDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting
                  </>
                ) : (
                  `Delete filtered (${getIdsToDelete('filtered').length})`
                )}
              </Button>

              <Button
                variant="destructive"
                onClick={() => {
                  setDangerZoneConfirmMode('all');
                  setDangerZoneConfirmOpen(true);
                }}
                disabled={!dangerZoneEntity || getIdsToDelete('all').length === 0 || dangerZoneLoading || dangerZoneDeleting}
              >
                {dangerZoneDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting
                  </>
                ) : (
                  `Delete all (${getIdsToDelete('all').length})`
                )}
              </Button>
            </div>
          </div>

          {dangerZoneEntity ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <div className="text-sm font-medium text-gray-700 mb-2">Search</div>
                <Input
                  value={dangerZoneFilterText}
                  onChange={(e) => setDangerZoneFilterText(e.target.value)}
                  placeholder="Search in all columns"
                  disabled={dangerZoneLoading || dangerZoneDeleting}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Column</div>
                  <Select
                    value={dangerZoneFilterColumn}
                    onValueChange={(v) => setDangerZoneFilterColumn(v)}
                    disabled={dangerZoneLoading || dangerZoneDeleting || dangerZoneColumns.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All columns</SelectItem>
                      {dangerZoneColumns.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Value</div>
                  <Input
                    value={dangerZoneFilterValue}
                    onChange={(e) => setDangerZoneFilterValue(e.target.value)}
                    placeholder="Filter value"
                    disabled={dangerZoneLoading || dangerZoneDeleting}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {!dangerZoneEntity ? (
            <div className="text-sm text-gray-600">Select an entity type to load data.</div>
          ) : dangerZoneLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading items...
            </div>
          ) : dangerZoneRecords.length === 0 ? (
            <div className="text-sm text-gray-600">No data.</div>
          ) : filteredDangerZoneRecords.length === 0 ? (
            <div className="text-sm text-gray-600">No matches.</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-b">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={dangerZoneAllSelected ? true : dangerZoneSomeSelected ? 'indeterminate' : false}
                    onCheckedChange={(checked) => toggleDangerZoneSelectAll(Boolean(checked))}
                    aria-label="Select all displayed items"
                    disabled={dangerZoneDeleting || dangerZoneLoading || deletableFilteredIds.length === 0}
                  />
                  <div className="text-sm text-gray-800">
                    {dangerZoneSelectedCount > 0 ? `${dangerZoneSelectedCount} selected` : `${filteredDangerZoneRecords.length} shown`}
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  {filteredDangerZoneRecords.length} / {dangerZoneRecords.length}
                </div>
              </div>

              <div className="max-h-[520px] overflow-auto">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="p-3 text-left w-10"></th>
                        {dangerZoneColumns.map((col) => (
                          <th key={col} className="p-3 text-left font-medium text-gray-700 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDangerZoneRecords.map((record, idx) => {
                        const id = getRecordId(record);
                        const deletable = isRecordDeletable(record);
                        const checked = Boolean(id) && dangerZoneSelectedIds.includes(id);
                        return (
                          <tr key={id || idx} className="border-b last:border-b-0">
                            <td className="p-3">
                              <Checkbox
                                checked={deletable ? checked : false}
                                onCheckedChange={(v) => {
                                  if (!id || !deletable) return;
                                  toggleDangerZoneItem(id, Boolean(v));
                                }}
                                aria-label={deletable ? `Select row ${id}` : 'Protected row'}
                                disabled={!deletable || !id || dangerZoneDeleting || dangerZoneLoading}
                              />
                            </td>
                            {dangerZoneColumns.map((col) => (
                              <td key={col} className="p-3 align-top">
                                <div className="max-w-[520px] break-words">
                                  {stringifyValue(record[col])}
                                </div>
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={dangerZoneConfirmOpen}
        onOpenChange={(open) => {
          if (dangerZoneDeleting) return;
          setDangerZoneConfirmOpen(open);
        }}
        title={
          dangerZoneConfirmMode === 'selected'
            ? 'Delete selected items?'
            : dangerZoneConfirmMode === 'filtered'
              ? 'Delete filtered items?'
              : 'Delete all items?'
        }
        description={`This will permanently delete ${getIdsToDelete(dangerZoneConfirmMode).length} item(s). This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={dangerZoneDeleting}
        onConfirm={() => deleteDangerZoneIds(getIdsToDelete(dangerZoneConfirmMode))}
      />
    </div>
  );
};

export default AdminTools;
