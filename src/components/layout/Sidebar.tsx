import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Package, Wrench, Building, BarChart3, Code, Megaphone, Car, DollarSign, Shield, Users, MessageSquare } from 'lucide-react';
import { useSidebarState } from './sidebar/useSidebarState';
import CollapsibleSection from './sidebar/CollapsibleSection';
import SimpleNavSection from './sidebar/SimpleNavSection';
import {
  mainNavItems,
  showroomItems,
  vehiclesItems,
  garageItems,
  financialItems,

  inventoryItems,
  ordersItems,
  employeeItems,
  crmItems,
  apiItems,
  adminItems
} from './sidebar/navigationData';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isMobile }) => {
  const { toggleSection, isExpanded } = useSidebarState();
  
  // Debug log props
  console.log('🔍 Sidebar props:', { isOpen, isMobile, onCloseType: typeof onClose });



  return (
    <>
      {/* Sidebar */}
      <div
        data-testid="sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-lg'
        )}
        style={{ 
          backgroundColor: '#ffffff',
          transform: !isOpen ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 200ms ease-in-out',
          visibility: !isOpen ? 'hidden' : 'visible',
          opacity: !isOpen ? 0 : 1
        }}
      >
        <div className="flex flex-col h-full sidebar-content" style={{ backgroundColor: '#ffffff' }}>
          {/* Header with close button for mobile */}
          {isMobile && (
            <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
              <h2 className="font-bold text-lg">Menu</h2>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🖱️ Close button clicked - calling onClose');
                  console.log('🔍 onClose function:', onClose);
                  try {
                    // Force close regardless of current state
                    console.log('🔧 FORCING sidebar close...');
                    onClose();
                    
                    // Immediate DOM fallback - don't wait for React
                    const sidebar = document.querySelector('[data-testid="sidebar"]');
                    if (sidebar) {
                      (sidebar as HTMLElement).style.transform = 'translateX(-100%)';
                      (sidebar as HTMLElement).style.visibility = 'hidden';
                      (sidebar as HTMLElement).style.opacity = '0';
                      console.log('🚨 Immediate DOM force-close applied');
                    }
                    
                    console.log('✅ onClose called successfully');
                  } catch (error) {
                    console.error('❌ Error calling onClose:', error);
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🖱️ Close button mouse down');
                }}
                onTouchStart={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('📱 Close button touch start');
                }}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('📱 Close button touch end - calling onClose');
                  console.log('🔍 onClose function:', onClose);
                  try {
                    // Force close regardless of current state
                    console.log('🔧 FORCING sidebar close...');
                    onClose();
                    
                    // Immediate DOM fallback - don't wait for React
                    const sidebar = document.querySelector('[data-testid="sidebar"]');
                    if (sidebar) {
                      (sidebar as HTMLElement).style.transform = 'translateX(-100%)';
                      (sidebar as HTMLElement).style.visibility = 'hidden';
                      (sidebar as HTMLElement).style.opacity = '0';
                      console.log('🚨 Immediate DOM force-close applied');
                    }
                    
                    console.log('✅ Touch onClose called successfully');
                  } catch (error) {
                    console.error('❌ Error calling touch onClose:', error);
                  }
                }}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700 sidebar-close-btn"
                style={{ 
                  pointerEvents: 'auto !important',
                  cursor: 'pointer',
                  userSelect: 'none',
                  zIndex: 9999,
                  position: 'relative'
                }}
                title="Close menu"
                data-testid="sidebar-close-button"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
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
              
              <CollapsibleSection 
                title="Admin & Security" 
                items={adminItems} 
                icon={Shield}
                isExpanded={isExpanded('Admin & Security')}
                onToggle={() => toggleSection('Admin & Security')}
                isMobile={isMobile}
                onClose={onClose}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Overlay - mobile only, no blur */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 sidebar-overlay"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🖱️ Overlay clicked - closing sidebar');
            onClose();
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('📱 Overlay touch - closing sidebar');
            onClose();
          }}
          style={{ 
            pointerEvents: 'auto !important',
            cursor: 'pointer',
            userSelect: 'none',
            zIndex: 40
          }}
          data-testid="sidebar-overlay"
        />
      )}
    </>
  );
};

export default Sidebar;
