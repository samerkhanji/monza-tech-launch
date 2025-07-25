
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import EmployeeProfileForm from '@/components/profile/EmployeeProfileForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

const EmployeeProfile: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User className="h-6 w-6" />
          Employee Profile
        </h1>
        <p className="text-gray-600 mt-1">
          Update your personal information and contact details
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Keep your profile information up to date so management can reach you when needed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeProfileForm currentUser={user} />
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeProfile;
