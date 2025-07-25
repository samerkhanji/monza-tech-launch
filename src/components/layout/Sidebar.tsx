import React from 'react';
import { cn } from '@/lib/utils';
import { Package, Wrench, Building, BarChart3, Code, Megaphone, Car, DollarSign, Shield, Users } from 'lucide-react';
import { useSidebarState } from './sidebar/useSidebarState';
import CollapsibleSection from './sidebar/CollapsibleSection';
import SimpleNavSection from './sidebar/SimpleNavSection';
import {
  mainNavItems,
  showroomItems,
  vehiclesItems,
  garageItems,
  financialItems,
  systemItems,
  inventoryItems,
  ordersItems,
  employeeItems,
  crmItems,
  apiItems
} from './sidebar/navigationData';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isMobile }) => {
  const { toggleSection, isExpanded } = useSidebarState();

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          !isMobile && 'translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex-1 px-3 space-y-6">
              <SimpleNavSection 
                title="Main" 
                items={mainNavItems}
                isMobile={isMobile}
                onClose={onClose}
              />
              
              <CollapsibleSection 
                title="Showroom" 
                items={showroomItems} 
                icon={Building}
                isExpanded={isExpanded('Showroom')}
                onToggle={() => toggleSection('Showroom')}
                isMobile={isMobile}
                onClose={onClose}
              />
              
              <CollapsibleSection 
                title="Vehicles" 
                items={vehiclesItems} 
                icon={Car}
                isExpanded={isExpanded('Vehicles')}
                onToggle={() => toggleSection('Vehicles')}
                isMobile={isMobile}
                onClose={onClose}
              />
              
              <CollapsibleSection 
                title="Garage" 
                items={garageItems} 
                icon={Wrench}
                isExpanded={isExpanded('Garage')}
                onToggle={() => toggleSection('Garage')}
                isMobile={isMobile}
                onClose={onClose}
              />
              
              <CollapsibleSection 
                title="Financial" 
                items={financialItems} 
                icon={DollarSign}
                isExpanded={isExpanded('Financial')}
                onToggle={() => toggleSection('Financial')}
                isMobile={isMobile}
                onClose={onClose}
              />
              
              <CollapsibleSection 
                title="System" 
                items={systemItems} 
                icon={Shield}
                isExpanded={isExpanded('System')}
                onToggle={() => toggleSection('System')}
                isMobile={isMobile}
                onClose={onClose}
              />
              
              <CollapsibleSection 
                title="Inventory" 
                items={inventoryItems} 
                icon={Package}
                isExpanded={isExpanded('Inventory')}
                onToggle={() => toggleSection('Inventory')}
                isMobile={isMobile}
                onClose={onClose}
              />
              
              <CollapsibleSection 
                title="Orders" 
                items={ordersItems} 
                icon={Package}
                isExpanded={isExpanded('Orders')}
                onToggle={() => toggleSection('Orders')}
                isMobile={isMobile}
                onClose={onClose}
              />
              
              <CollapsibleSection 
                title="Employee Management" 
                items={employeeItems} 
                icon={Users}
                isExpanded={isExpanded('Employee Management')}
                onToggle={() => toggleSection('Employee Management')}
                isMobile={isMobile}
                onClose={onClose}
              />
              
              <CollapsibleSection 
                title="CRM & Scheduling" 
                items={crmItems} 
                icon={Megaphone}
                isExpanded={isExpanded('CRM & Scheduling')}
                onToggle={() => toggleSection('CRM & Scheduling')}
                isMobile={isMobile}
                onClose={onClose}
              />
              
              <CollapsibleSection 
                title="API" 
                items={apiItems} 
                icon={Code}
                isExpanded={isExpanded('API')}
                onToggle={() => toggleSection('API')}
                isMobile={isMobile}
                onClose={onClose}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default Sidebar;
