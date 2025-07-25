import React, { useState, useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTutorial } from '@/contexts/TutorialContext';

// Define a custom step type that extends react-joyride's Step and adds a pathname
interface TutorialStep extends Step {
  pathname?: string;
}

const steps: TutorialStep[] = [
  {
    target: 'body',
    content: (
      <div>
        <h2>🎓 Welcome to Monza S.A.L. Employee Training!</h2>
        <p>This comprehensive tutorial will guide you through every feature of our vehicle management system. You'll learn how to:</p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>• Manage car inventory and track vehicles</li>
          <li>• Process repairs and service requests</li>
          <li>• Handle sales and customer interactions</li>
          <li>• Use analytics and reporting tools</li>
          <li>• Navigate all system functions efficiently</li>
        </ul>
        <p className="mt-3 text-sm text-blue-600">Click "Next" to begin your training journey!</p>
      </div>
    ),
    disableBeacon: true,
    placement: 'center',
    title: 'Employee Training Program',
    spotlightPadding: 0,
  },
  {
    target: 'body',
    content: (
      <div>
        <h2>📊 Dashboard Overview</h2>
        <p>The Dashboard is your command center. Here you'll find:</p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>• <strong>Key Metrics:</strong> Sales, repairs, inventory status</li>
          <li>• <strong>Quick Actions:</strong> Add cars, create repairs, view alerts</li>
          <li>• <strong>Recent Activity:</strong> Latest transactions and updates</li>
          <li>• <strong>Notifications:</strong> Important alerts and reminders</li>
        </ul>
        <p className="mt-3 text-sm text-green-600">💡 <strong>Pro Tip:</strong> Check the dashboard daily to stay updated on business performance.</p>
      </div>
    ),
    disableBeacon: true,
    placement: 'center',
    title: 'Dashboard Training',
    pathname: '/dashboard',
    spotlightPadding: 0,
  },
  {
    target: 'body',
    content: (
      <div>
        <h2>🚗 Car Inventory Management</h2>
        <p>This is where you'll manage all vehicles in the dealership:</p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>• <strong>Add New Cars:</strong> Click "Add New Car" to enter vehicle details</li>
          <li>• <strong>Search & Filter:</strong> Use the search bar to find specific vehicles</li>
          <li>• <strong>View Details:</strong> Click on any car to see full information</li>
          <li>• <strong>Update Status:</strong> Change car status (Available, Sold, In Repair)</li>
          <li>• <strong>Manage Photos:</strong> Add and organize vehicle images</li>
        </ul>
        <p className="mt-3 text-sm text-green-600">💡 <strong>Employee Task:</strong> Always update car status immediately when changes occur.</p>
      </div>
    ),
    disableBeacon: true,
    placement: 'center',
    title: 'Car Inventory Training',
    pathname: '/car-inventory',
    spotlightPadding: 0,
  },
  {
    target: 'body',
    content: (
      <div>
        <h2>🔧 Repair & Service Center</h2>
        <p>Manage all repair and maintenance operations:</p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>• <strong>Create Repair Orders:</strong> Click "New Repair" to start a job</li>
          <li>• <strong>Assign Mechanics:</strong> Select qualified staff for each repair</li>
          <li>• <strong>Track Progress:</strong> Update repair status as work progresses</li>
          <li>• <strong>Manage Parts:</strong> Record parts used and order replacements</li>
          <li>• <strong>Customer Communication:</strong> Update customers on repair status</li>
        </ul>
        <p className="mt-3 text-sm text-green-600">💡 <strong>Important:</strong> Always document all work done and parts used for billing accuracy.</p>
      </div>
    ),
    disableBeacon: true,
    placement: 'center',
    title: 'Repair Center Training',
    pathname: '/repairs',
    spotlightPadding: 0,
  },
  {
    target: 'body',
    content: (
      <div>
        <h2>🏢 Showroom Floor Management</h2>
        <p>Manage vehicles displayed in the showroom:</p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>• <strong>Floor Layout:</strong> See where each car is positioned</li>
          <li>• <strong>Move Vehicles:</strong> Reorganize showroom layout</li>
          <li>• <strong>Update Displays:</strong> Change featured vehicles</li>
          <li>• <strong>Track Interest:</strong> Monitor which cars get attention</li>
          <li>• <strong>Maintain Cleanliness:</strong> Schedule cleaning and maintenance</li>
        </ul>
        <p className="mt-3 text-sm text-green-600">💡 <strong>Showroom Tip:</strong> Keep the most popular models in high-visibility areas.</p>
      </div>
    ),
    disableBeacon: true,
    placement: 'center',
    title: 'Showroom Training',
    pathname: '/showroom',
    spotlightPadding: 0,
  },
  {
    target: 'body',
    content: (
      <div>
        <h2>📈 Sales & Customer Management</h2>
        <p>Handle all sales activities and customer relationships:</p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>• <strong>Customer Profiles:</strong> Create and maintain customer records</li>
          <li>• <strong>Sales Tracking:</strong> Record all sales and follow-ups</li>
          <li>• <strong>Lead Management:</strong> Track potential customers</li>
          <li>• <strong>Test Drives:</strong> Schedule and manage test drive appointments</li>
          <li>• <strong>Follow-up System:</strong> Ensure customer satisfaction</li>
        </ul>
        <p className="mt-3 text-sm text-green-600">💡 <strong>Sales Tip:</strong> Always follow up with customers within 24 hours of their visit.</p>
      </div>
    ),
    disableBeacon: true,
    placement: 'center',
    title: 'Sales Training',
    pathname: '/sales',
    spotlightPadding: 0,
  },
  {
    target: 'body',
    content: (
      <div>
        <h2>📊 Analytics & Reporting</h2>
        <p>Access business insights and performance data:</p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>• <strong>Sales Reports:</strong> Track monthly and yearly sales performance</li>
          <li>• <strong>Repair Analytics:</strong> Monitor repair efficiency and costs</li>
          <li>• <strong>Inventory Reports:</strong> Analyze stock turnover and trends</li>
          <li>• <strong>Customer Insights:</strong> Understand customer preferences</li>
          <li>• <strong>Financial Reports:</strong> Monitor profitability and expenses</li>
        </ul>
        <p className="mt-3 text-sm text-green-600">💡 <strong>Management Tip:</strong> Review analytics weekly to identify trends and opportunities.</p>
      </div>
    ),
    disableBeacon: true,
    placement: 'center',
    title: 'Analytics Training',
    pathname: '/analytics',
    spotlightPadding: 0,
  },
  {
    target: 'body',
    content: (
      <div>
        <h2>🔍 VIN Scanner & Part Scanner</h2>
        <p>Use advanced scanning technology for efficiency:</p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>• <strong>VIN Scanner:</strong> Quickly scan vehicle identification numbers</li>
          <li>• <strong>Part Scanner:</strong> Scan parts for inventory management</li>
          <li>• <strong>Camera Integration:</strong> Use your device's camera for scanning</li>
          <li>• <strong>Auto-populate Forms:</strong> Automatically fill in vehicle details</li>
          <li>• <strong>Error Prevention:</strong> Reduce manual entry mistakes</li>
        </ul>
        <p className="mt-3 text-sm text-green-600">💡 <strong>Efficiency Tip:</strong> Use scanners whenever possible to save time and reduce errors.</p>
      </div>
    ),
    disableBeacon: true,
    placement: 'center',
    title: 'Scanner Training',
    pathname: '/scan-vin',
    spotlightPadding: 0,
  },
  {
    target: 'body',
    content: (
      <div>
        <h2>👥 Employee Management</h2>
        <p>Manage staff and access controls:</p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>• <strong>Staff Profiles:</strong> Maintain employee information</li>
          <li>• <strong>Role Management:</strong> Assign appropriate access levels</li>
          <li>• <strong>Performance Tracking:</strong> Monitor employee productivity</li>
          <li>• <strong>Schedule Management:</strong> Organize work schedules</li>
          <li>• <strong>Training Records:</strong> Track completed training sessions</li>
        </ul>
        <p className="mt-3 text-sm text-green-600">💡 <strong>HR Tip:</strong> Regular performance reviews help maintain high service standards.</p>
      </div>
    ),
    disableBeacon: true,
    placement: 'center',
    title: 'Employee Management Training',
    pathname: '/employee-management',
    spotlightPadding: 0,
  },
  {
    target: 'body',
    content: (
      <div>
        <h2>⚙️ System Settings & Configuration</h2>
        <p>Customize the system to match your business needs:</p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>• <strong>Business Settings:</strong> Configure company information</li>
          <li>• <strong>User Preferences:</strong> Personalize your interface</li>
          <li>• <strong>Notification Settings:</strong> Set up alerts and reminders</li>
          <li>• <strong>Data Management:</strong> Backup and restore information</li>
          <li>• <strong>Security Settings:</strong> Manage access and permissions</li>
        </ul>
        <p className="mt-3 text-sm text-green-600">💡 <strong>Admin Tip:</strong> Regular backups ensure your data is always safe.</p>
      </div>
    ),
    disableBeacon: true,
    placement: 'center',
    title: 'System Settings Training',
    pathname: '/system-settings',
    spotlightPadding: 0,
  },
  {
    target: 'body',
    content: (
      <div>
        <h2>🎯 Key Features & Best Practices</h2>
        <p>Master these essential functions for optimal performance:</p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>• <strong>Quick Search:</strong> Use Ctrl+F to find anything quickly</li>
          <li>• <strong>Keyboard Shortcuts:</strong> Learn shortcuts for faster navigation</li>
          <li>• <strong>Data Entry:</strong> Always double-check information before saving</li>
          <li>• <strong>Customer Service:</strong> Respond to inquiries promptly</li>
          <li>• <strong>Team Communication:</strong> Use the notification system effectively</li>
        </ul>
        <p className="mt-3 text-sm text-green-600">💡 <strong>Success Tip:</strong> Consistent data entry and communication lead to better customer service.</p>
      </div>
    ),
    disableBeacon: true,
    placement: 'center',
    title: 'Best Practices Training',
    pathname: '/dashboard',
    spotlightPadding: 0,
  },
  {
    target: 'body',
    content: (
      <div>
        <h2>🎉 Congratulations! Training Complete</h2>
        <p>You've successfully completed the Monza S.A.L. employee training program!</p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>✅ You now understand all system functions</li>
          <li>✅ You can navigate between all pages efficiently</li>
          <li>✅ You know how to manage inventory and repairs</li>
          <li>✅ You understand customer service best practices</li>
          <li>✅ You're ready to provide excellent service</li>
        </ul>
        <p className="mt-3 text-sm text-blue-600">
          <strong>Remember:</strong> You can always access this tutorial again by clicking the 🎓 button in the bottom right corner.
        </p>
        <p className="mt-3 text-sm text-green-600">
          <strong>Welcome to the Monza S.A.L. team!</strong> 🚗💪
        </p>
      </div>
    ),
    disableBeacon: true,
    placement: 'center',
    title: 'Training Complete!',
    spotlightPadding: 0,
  }
];

const TutorialModal: React.FC = () => {
  const { isRunning, currentStep, nextStep, skipTutorial, completeTutorial } = useTutorial();
  const navigate = useNavigate();
  const location = useLocation();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    setRun(isRunning);
  }, [isRunning]);

  useEffect(() => {
    setStepIndex(currentStep);
  }, [currentStep]);

  // Handle step changes and navigation
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type, index, lifecycle } = data;

    // Use direct comparison for status instead of includes
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      // End the tutorial
      setRun(false);
      completeTutorial();
    } else if (type === 'step:before') {
      // Before a step, check if navigation is needed
      const step = steps[index];
      if (step.pathname && location.pathname !== step.pathname) {
        navigate(step.pathname);
      }
    } else if (type === 'step:after') {
      // After a step, update the current step in context
      nextStep();
    }
  };

  // Custom styles for the modal
  const tourStyles = {
    options: {
      arrowColor: '#fff',
      backgroundColor: '#fff',
      primaryColor: '#FFD600', // Monza Yellow for primary actions
      textColor: '#4B4B4B', // Monza Grey for text
      zIndex: 1100, // Ensure modal is on top
      width: 450, // Increased width for better content display
    },
    tooltip: {
      // Add styles for a modal-like appearance
      // This might require overriding internal react-joyride classes
      // or using a custom component for steps
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent backdrop
    }
  };

  // Custom step component to remove images/icons and apply professional styling
  const CustomStep: React.FC<any> = ({ step, backProps, closeProps, primaryProps, index, size, isLastStep }) => (
    <div className="bg-white text-monza-black p-6 rounded-lg shadow-lg max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-monza-black">{step.title}</h3>
        <span className="text-sm text-monza-gray">Step {index + 1} of {size}</span>
      </div>
      <div className="text-monza-gray mb-6">
        {step.content}
      </div>
      <div className="flex justify-end space-x-3">
        {index > 0 && (
          <button {...backProps} className="px-4 py-2 text-sm font-medium text-monza-black border border-monza-gray rounded-md hover:bg-gray-100">
            Back
          </button>
        )}
        {!isLastStep && (
           <button {...primaryProps} className="px-4 py-2 text-sm font-medium text-monza-black bg-monza-yellow rounded-md hover:bg-monza-yellow/90">
            Next
          </button>
        )}
        {isLastStep && (
           <button {...primaryProps} className="px-4 py-2 text-sm font-medium text-monza-black bg-monza-yellow rounded-md hover:bg-monza-yellow/90">
            Finish Training
          </button>
        )}
        <button {...closeProps} className="px-4 py-2 text-sm font-medium text-monza-black border border-monza-gray rounded-md hover:bg-gray-100">
          Skip Training
        </button>
      </div>
    </div>
  );

  return (
    <Joyride
      run={run}
      stepIndex={stepIndex}
      steps={steps}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={tourStyles}
      floaterProps={{ disableAnimation: true }}
      spotlightPadding={0}
      tooltipComponent={CustomStep}
    />
  );
};

export default TutorialModal; 