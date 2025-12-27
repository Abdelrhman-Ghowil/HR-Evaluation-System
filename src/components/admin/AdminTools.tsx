
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useNavigate } from 'react-router-dom';

interface AdminToolsProps {
  onNavigateToWeights?: () => void;
  onNavigateToUserManagement?: () => void;
}

const AdminTools: React.FC<AdminToolsProps> = ({ onNavigateToWeights, onNavigateToUserManagement }) => {
  const navigate = useNavigate();
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

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
    </div>
  );
};

export default AdminTools;
