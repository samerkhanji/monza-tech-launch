import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
// import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { TermsAgreement } from '@/services/termsService';
import Logo from '@/components/ui/logo';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Shield, User, AlertTriangle } from 'lucide-react';

interface TermsAgreementDialogProps {
  isOpen: boolean;
  terms: TermsAgreement;
  onAgree: () => void;
  onDecline: () => void;
  isLoading?: boolean;
  onClose: () => void;
}

const TermsAgreementDialog: React.FC<TermsAgreementDialogProps> = ({
  isOpen,
  terms,
  onAgree,
  onDecline,
  isLoading = false,
  onClose
}) => {
  const { user } = useAuth();
  const [hasRead, setHasRead] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  const canProceed = hasRead && hasAccepted;

  const handleAgree = () => {
    if (canProceed && !isLoading) {
      onAgree();
    }
  };

  const handleDecline = () => {
    if (!isLoading) {
      onDecline();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] w-[95vw] p-0 flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-6 pb-4 border-b bg-white flex-shrink-0">
          <div className="flex items-center gap-3 mb-4">
            <Logo size="sm" />
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg sm:text-xl font-bold">
                {terms.title}
              </DialogTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Version {terms.version} • Please read carefully and accept to continue
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Content Area - Scrollable */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* Terms Content */}
          <div className="flex-1 lg:flex-[2] flex flex-col border-b lg:border-b-0 lg:border-r min-h-0">
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[40vh] sm:max-h-[60vh] bg-white rounded shadow-inner">
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-line text-xs sm:text-sm leading-relaxed text-gray-800">
                  {terms.content}
                </div>
              </div>
            </div>
          </div>

          {/* Agreement Panel */}
          <div className="lg:flex-1 bg-gray-50 flex flex-col min-h-0">
            <div className="p-4 sm:p-6 border-b bg-white flex-shrink-0">
              <h3 className="font-semibold text-base sm:text-lg mb-2">Agreement Required</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Your acceptance is required to continue using the system
              </p>
            </div>

            <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-auto">
              {/* Employee Info Display */}
              {user && (
                <div className="bg-white p-3 sm:p-4 rounded-lg border shadow-sm">
                  <h4 className="font-medium mb-3 text-sm sm:text-base">Employee Details</h4>
                  <div className="text-xs sm:text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Name:</span>
                      <span className="text-gray-900">{user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Email:</span>
                      <span className="text-gray-900 break-all text-right">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Role:</span>
                      <span className="text-gray-900 capitalize">{user.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-600">Department:</span>
                      <span className="text-gray-900">{user.department || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Acknowledgment Checkboxes */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="hasRead"
                    checked={hasRead}
                    onCheckedChange={(checked) => setHasRead(checked === true)}
                    className="mt-1 flex-shrink-0"
                  />
                  <label
                    htmlFor="hasRead"
                    className="text-xs sm:text-sm leading-tight cursor-pointer flex-1"
                  >
                    I have read and understood all terms and conditions in their entirety
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="hasAccepted"
                    checked={hasAccepted}
                    onCheckedChange={(checked) => setHasAccepted(checked === true)}
                    disabled={!hasRead}
                    className="mt-1 flex-shrink-0"
                  />
                  <label
                    htmlFor="hasAccepted"
                    className={`text-xs sm:text-sm leading-tight cursor-pointer flex-1 ${
                      !hasRead ? 'text-gray-400' : ''
                    }`}
                  >
                    I agree to be legally bound by these terms and acknowledge my confidentiality obligations
                  </label>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 sm:p-4">
                <p className="text-xs leading-relaxed text-amber-800">
                  <strong>Critical Notice:</strong> By accepting, you confirm that you are an authorized Monza S.A.L. employee and understand that:
                </p>
                <ul className="text-xs mt-2 space-y-1 text-amber-800 ml-4">
                  <li>• All system information is strictly confidential</li>
                  <li>• Unauthorized disclosure may result in termination and legal action</li>
                  <li>• Your system usage will be monitored and logged</li>
                  <li>• This agreement will be recorded and sent to management</li>
                </ul>
              </div>
            </div>

            {/* Fixed Agreement Actions at Bottom */}
            <div className="p-4 sm:p-6 bg-white border-t space-y-3 flex-shrink-0 sticky bottom-0 z-10">
              <Button
                onClick={handleAgree}
                disabled={!canProceed || isLoading}
                className={`w-full text-white font-medium transition-all text-sm sm:text-base py-3 ${
                  canProceed && !isLoading
                    ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Recording Agreement...</span>
                  </div>
                ) : (
                  <span>✓ I Accept & Agree</span>
                )}
              </Button>
              
              <Button
                onClick={handleDecline}
                disabled={isLoading}
                variant="outline"
                className="w-full border-red-200 text-red-700 hover:bg-red-50 font-medium text-sm sm:text-base py-3"
                size="lg"
              >
                <span>✕ Decline & Logout</span>
              </Button>

              {/* Version Info */}
              <div className="text-center pt-2">
                <p className="text-xs text-muted-foreground">
                  Terms Version: {terms.version} • Updated: {new Date(terms.updated_at).toLocaleDateString()}
                  <br />
                  Agreement Date: {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAgreementDialog;
