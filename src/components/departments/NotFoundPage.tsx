import React from 'react';
import { Button } from '../ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  title?: string;
  description?: string;
  onNavigateBack?: () => void;
}

const NotFoundPage: React.FC<NotFoundPageProps> = ({ 
  title = "Page Not Found", 
  description = "The page you're looking for doesn't exist or you don't have permission to access it.",
  onNavigateBack 
}) => {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <AlertCircle className="mx-auto h-16 w-16 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{title}</h1>
        <p className="text-gray-600 mb-6">{description}</p>
        {onNavigateBack && (
          <Button onClick={onNavigateBack} className="flex items-center gap-2 mx-auto">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        )}
      </div>
    </div>
  );
};

export default NotFoundPage;