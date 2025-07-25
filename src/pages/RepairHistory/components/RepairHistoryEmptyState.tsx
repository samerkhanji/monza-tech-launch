
import React from 'react';
import { FileText } from 'lucide-react';

interface RepairHistoryEmptyStateProps {
  searchTerm: string;
}

const RepairHistoryEmptyState: React.FC<RepairHistoryEmptyStateProps> = ({
  searchTerm,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
      <h3 className="text-lg font-medium">No completed repairs found</h3>
      {searchTerm ? (
        <p className="text-sm text-muted-foreground mt-1">
          No results match your search. Try different keywords.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground mt-1">
          Completed garage work will appear here when cars are marked as delivered.
        </p>
      )}
    </div>
  );
};

export default RepairHistoryEmptyState;
