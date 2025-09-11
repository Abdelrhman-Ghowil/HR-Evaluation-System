
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Database, Shield, Download } from 'lucide-react';

interface AdminToolsProps {
  onNavigateToWeights?: () => void;
  onNavigateToUserManagement?: () => void;
}

const AdminTools: React.FC<AdminToolsProps> = ({ onNavigateToWeights, onNavigateToUserManagement }) => {
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
    },
    {
      title: 'Data Management',
      description: 'Import/export data and manage backups',
      icon: Database,
      action: 'Manage Data',
      onClick: () => console.log('Data Management clicked')
    },
    {
      title: 'Reports & Analytics',
      description: 'Generate comprehensive system reports',
      icon: Download,
      action: 'Generate Reports',
      onClick: () => console.log('Reports & Analytics clicked')
    }
  ];

  return (
    <div className="space-y-6">
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