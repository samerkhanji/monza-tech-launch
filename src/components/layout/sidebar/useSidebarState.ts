
import { useState } from 'react';

export const useSidebarState = () => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    );
  };

  const isExpanded = (sectionName: string) => expandedSections.includes(sectionName);

  return {
    toggleSection,
    isExpanded
  };
};
