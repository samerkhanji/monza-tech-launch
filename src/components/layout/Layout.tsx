import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import TermsAgreementDialog from '@/components/TermsAgreementDialog';
import ErrorBoundary from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTermsAgreement } from '@/hooks/useTermsAgreement';
import { useActivityTracking } from '@/hooks/useActivityTracking';

const Layout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  
  // Chat state management
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  // Interactive Tutorial state management
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [highlightSelector, setHighlightSelector] = useState('');

  // Interactive tutorial steps with UI element targeting
  const interactiveTutorialSteps = [
    { 
      route: '/', 
      title: 'Dashboard Overview', 
      instruction: 'Welcome! First, click the notification bell in the top right to see business alerts.',
      highlight: '[data-notification-bell]',
      action: 'click',
      description: 'The notification bell shows important business updates, alerts, and system messages.'
    },
    { 
      route: '/', 
      title: 'Sidebar Navigation', 
      instruction: 'Now try clicking on "Car Inventory" in the sidebar to manage your vehicle stock.',
      highlight: '[href="/car-inventory"]',
      action: 'click',
      description: 'The sidebar contains all major sections of your business management system.'
    },
    { 
      route: '/car-inventory', 
      title: 'Add New Car', 
      instruction: 'Click the "Add New Car" button to see how you add vehicles to inventory.',
      highlight: 'button:contains("Add"), [data-add-car]',
      action: 'click',
      description: 'This opens the form to add new vehicles with all their details and specifications.'
    },
    { 
      route: '/car-inventory', 
      title: 'Search & Filter', 
      instruction: 'Try typing in the search box to filter cars by VIN, model, or any other criteria.',
      highlight: 'input[placeholder*="Search"], input[type="search"]',
      action: 'interact',
      description: 'Search helps you quickly find specific vehicles in your inventory.'
    },
    { 
      route: '/car-inventory', 
      title: 'Action Buttons', 
      instruction: 'Look for the "Actions" column and click any dropdown to see what you can do with each car.',
      highlight: '[data-action-dropdown], button:contains("Actions")',
      action: 'click',
      description: 'Action buttons let you edit, delete, move, or update car information.'
    },
    { 
      route: '/scan-vin', 
      title: 'VIN Scanner', 
      instruction: 'Click the camera icon to activate VIN scanning for new arrivals.',
      highlight: '[data-camera], button:contains("Camera"), .camera-button',
      action: 'click',
      description: 'VIN scanning automatically identifies vehicles and fills in manufacturer data.'
    },
    { 
      route: '/repairs', 
      title: 'Garage Management', 
      instruction: 'Click "New Repair" or any repair card to manage vehicle maintenance.',
      highlight: 'button:contains("New Repair"), [data-new-repair]',
      action: 'click',
      description: 'Track repair progress, assign mechanics, and manage service schedules.'
    },
    { 
      route: '/garage-schedule', 
      title: 'Appointment Scheduling', 
      instruction: 'Click on any time slot in the calendar to schedule new appointments.',
      highlight: '.calendar-slot, [data-time-slot]',
      action: 'click',
      description: 'Drag and drop appointments, manage mechanic workloads, and optimize scheduling.'
    },
    { 
      route: '/financial-management', 
      title: 'Financial Controls', 
      instruction: 'Click on any chart or financial metric to see detailed breakdowns.',
      highlight: '.chart, [data-chart], .financial-card',
      action: 'click',
      description: 'Monitor revenue, expenses, and profitability with interactive financial tools.'
    },
    { 
      route: '/inventory', 
      title: 'Parts Inventory', 
      instruction: 'Click "Add Part" or scan a part barcode to manage spare parts inventory.',
      highlight: 'button:contains("Add Part"), [data-add-part]',
      action: 'click',
      description: 'Track parts stock levels, reorder points, and supplier information.'
    }
  ];

  const startInteractiveTutorial = () => {
    setIsTutorialActive(true);
    setTutorialStep(0);
    const step = interactiveTutorialSteps[0];
    navigate(step.route);
    setHighlightSelector(step.highlight);
    
    // Add CSS for highlighting
    const style = document.createElement('style');
    style.id = 'tutorial-styles';
    style.textContent = `
      .tutorial-highlight {
        position: relative !important;
        z-index: 999998 !important;
        box-shadow: 0 0 0 4px #10b981, 0 0 0 8px rgba(16, 185, 129, 0.3) !important;
        border-radius: 8px !important;
        animation: tutorialPulse 2s infinite !important;
      }
      
      @keyframes tutorialPulse {
        0%, 100% { box-shadow: 0 0 0 4px #10b981, 0 0 0 8px rgba(16, 185, 129, 0.3); }
        50% { box-shadow: 0 0 0 4px #10b981, 0 0 0 12px rgba(16, 185, 129, 0.6); }
      }
      
      .tutorial-arrow {
        position: absolute;
        width: 0;
        height: 0;
        border-left: 15px solid transparent;
        border-right: 15px solid transparent;
        border-bottom: 20px solid #10b981;
        z-index: 999999;
        animation: tutorialBounce 1s infinite;
      }
      
      @keyframes tutorialBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
    `;
    document.head.appendChild(style);
  };

  const nextInteractiveTutorialStep = () => {
    const nextStep = tutorialStep + 1;
    if (nextStep < interactiveTutorialSteps.length) {
      setTutorialStep(nextStep);
      const step = interactiveTutorialSteps[nextStep];
      navigate(step.route);
      setHighlightSelector(step.highlight);
    } else {
      endInteractiveTutorial();
    }
  };

  const endInteractiveTutorial = () => {
    setIsTutorialActive(false);
    setTutorialStep(0);
    setHighlightSelector('');
    
    // Remove tutorial styles
    const style = document.getElementById('tutorial-styles');
    if (style) style.remove();
    
    // Remove all highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
      el.classList.remove('tutorial-highlight');
    });
  };

  // Tutorial highlighting effect
  useEffect(() => {
    if (isTutorialActive) {
      // Inject tutorial CSS
      const existingStyle = document.getElementById('tutorial-styles');
      if (!existingStyle) {
        const style = document.createElement('style');
        style.id = 'tutorial-styles';
        style.textContent = `
          .tutorial-highlight {
            position: relative !important;
            z-index: 999998 !important;
            box-shadow: 0 0 0 4px #10b981, 0 0 0 8px rgba(16, 185, 129, 0.3) !important;
            border-radius: 8px !important;
            animation: tutorialPulse 2s infinite !important;
          }
          
          @keyframes tutorialPulse {
            0%, 100% { box-shadow: 0 0 0 4px #10b981, 0 0 0 8px rgba(16, 185, 129, 0.3); }
            50% { box-shadow: 0 0 0 4px #10b981, 0 0 0 12px rgba(16, 185, 129, 0.6); }
          }
          
          .tutorial-arrow {
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 12px solid transparent;
            border-right: 12px solid transparent;
            border-bottom: 16px solid #10b981;
            z-index: 999999;
            animation: tutorialBounce 1s infinite;
          }
          
          @keyframes tutorialBounce {
            0%, 100% { transform: translateX(-50%) translateY(0); }
            50% { transform: translateX(-50%) translateY(-8px); }
          }
        `;
        document.head.appendChild(style);
      }

      // Highlight specific elements based on tutorial step
      const timer = setTimeout(() => {
        // Remove previous highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
          el.classList.remove('tutorial-highlight');
          el.querySelector('.tutorial-arrow')?.remove();
        });

        // Add highlights based on current step
        let selector = '';
                 switch (tutorialStep) {
           case 0:
             // Highlight notification bell
             selector = '[data-notification-bell], .notification-bell, button[title*="notification"], [aria-label*="notification"], .notification-button';
             break;
           case 1:
             // Highlight sidebar Car Inventory link
             selector = 'a[href="/car-inventory"], [href="/car-inventory"], nav a:contains("Car Inventory")';
             break;
           case 2:
             // Highlight Add New Car button
             selector = 'button:contains("Add New Car"), button:contains("Add Car"), [data-add-car], .add-car-button';
             break;
           case 3:
             // Highlight search input
             selector = 'input[placeholder*="Search"], input[type="search"], .search-input, [data-search]';
             break;
           case 4:
             // Highlight action dropdown/buttons
             selector = 'button:contains("Actions"), [data-action-dropdown], .action-button, button[title*="Actions"]';
             break;
           case 5:
             // Highlight camera/scan button
             selector = 'button:contains("Camera"), [data-camera], .camera-button, button[title*="Scan"]';
             break;
           case 6:
             // Highlight repair/garage buttons
             selector = 'button:contains("New Repair"), [data-new-repair], .repair-button';
             break;
           case 7:
             // Highlight calendar/schedule elements
             selector = '.calendar-slot, [data-time-slot], .schedule-button, .calendar-day';
             break;
           case 8:
             // Highlight financial charts/cards
             selector = '.chart, [data-chart], .financial-card, .metric-card';
             break;
           case 9:
             // Highlight parts/inventory buttons
             selector = 'button:contains("Add Part"), [data-add-part], .parts-button';
             break;
           default:
             // Try to find common UI elements
             selector = 'button:contains("Add"), [data-add], .add-button, button[title*="Add"], .primary-button';
         }

        if (selector) {
          const selectors = selector.split(', ');
          for (const sel of selectors) {
            try {
              const elements = document.querySelectorAll(sel);
              if (elements.length > 0) {
                const element = elements[0] as HTMLElement;
                element.classList.add('tutorial-highlight');
                
                // Add arrow pointer
                const arrow = document.createElement('div');
                arrow.className = 'tutorial-arrow';
                element.style.position = 'relative';
                element.appendChild(arrow);
                
                // Scroll to element
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                break;
              }
            } catch (e) {
              // Ignore invalid selectors
            }
          }
        }
      }, 1000); // Wait for page to load

      return () => clearTimeout(timer);
    } else {
      // Clean up when tutorial ends
      const style = document.getElementById('tutorial-styles');
      if (style) style.remove();
      
      document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
        el.querySelector('.tutorial-arrow')?.remove();
      });
    }
  }, [isTutorialActive, tutorialStep]);
  
  // Terms agreement functionality
  const {
    terms,
    showTermsDialog,
    isLoading: termsLoading,
    isChecking: termsChecking,
    handleAgreeToTerms,
    handleDeclineTerms
  } = useTermsAgreement();

  // Activity tracking
  useActivityTracking();
  
  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);
  
  if (isLoading || termsChecking) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-white to-amber-50">
        <div className="flex flex-col items-center gap-3 p-6">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
          <p className="text-amber-800 text-sm md:text-base">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return (
    <ErrorBoundary>
      <div className="flex flex-col min-h-screen w-full">
        <ErrorBoundary>
          <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        </ErrorBoundary>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <ErrorBoundary>
            <Sidebar 
              isOpen={sidebarOpen} 
              onClose={() => setSidebarOpen(false)}
              isMobile={isMobile}
            />
          </ErrorBoundary>

          {/* Mobile backdrop */}
          {isMobile && sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <main className={cn(
            "flex-1 overflow-auto bg-gradient-to-b from-white to-gray-50/50 w-full",
            "p-2 md:p-4 lg:p-6",
            !isMobile && sidebarOpen && "ml-64"
          )}>
            <div className="w-full max-w-7xl mx-auto">
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </div>
          </main>
        </div>
        
        {/* Small MonzaBot Chat Button */}
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '40px',
            height: '40px',
            backgroundColor: '#fbbf24',
            borderRadius: '50%',
            border: '2px solid #000',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            zIndex: 999999,
            color: '#000',
            transition: 'all 0.2s ease'
          }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.backgroundColor = '#f59e0b';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = '#fbbf24';
          }}
          title="MonzaBot Chat"
        >
          🤖
        </div>

        {/* Tutorial Button */}
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '70px',
            width: '40px',
            height: '40px',
            backgroundColor: '#10b981',
            borderRadius: '50%',
            border: '2px solid #000',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            zIndex: 999999,
            color: '#000',
            transition: 'all 0.2s ease'
          }}
          onClick={startInteractiveTutorial}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.backgroundColor = '#059669';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.backgroundColor = '#10b981';
          }}
          title="Start Tutorial - Learn how to use every feature!"
        >
          🎓
        </div>

        {/* Interactive Tutorial Guide - Small, non-blocking */}
        {isTutorialActive && (
          <div
            style={{
              position: 'fixed',
              top: '100px',
              right: '20px',
              width: '320px',
              backgroundColor: 'white',
              border: '3px solid #10b981',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              zIndex: 999999,
              fontFamily: 'system-ui, sans-serif'
            }}
          >
            {/* Guide Header */}
            <div
              style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '12px 16px',
                borderRadius: '9px 9px 0 0',
                fontWeight: 'bold',
                fontSize: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>🎓 Interactive Tutorial</span>
              <button
                onClick={() => setIsTutorialActive(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '24px',
                  height: '24px'
                }}
              >
                ×
              </button>
            </div>

            {/* Progress Bar */}
            <div style={{ 
              padding: '0 16px 12px 16px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <div style={{ 
                fontSize: '12px', 
                color: '#666', 
                marginBottom: '6px',
                textAlign: 'center'
              }}>
                Progress: {tutorialStep + 1} of {interactiveTutorialSteps.length} steps
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: '#e5e7eb', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${((tutorialStep + 1) / interactiveTutorialSteps.length) * 100}%`, 
                  height: '100%', 
                  backgroundColor: '#10b981',
                  transition: 'width 0.3s ease',
                  borderRadius: '4px'
                }} />
              </div>
            </div>

            {/* Current Step */}
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#000', marginBottom: '4px' }}>
                  Step {tutorialStep + 1}: {interactiveTutorialSteps[tutorialStep]?.title || 'Tutorial'}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  🎯 Try this: {interactiveTutorialSteps[tutorialStep]?.instruction || 'Follow the highlighted elements'}
                </div>
              </div>

              {/* Instruction */}
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '12px',
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}
              >
                <strong>👆 What to do:</strong><br />
                {interactiveTutorialSteps[tutorialStep]?.description || 'Follow the instructions for this step.'}
              </div>

              {/* What you'll learn */}
              <div
                style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #f59e0b',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px',
                  fontSize: '13px'
                }}
              >
                <strong>📚 You'll learn:</strong><br />
                {tutorialStep === 0 && (
                  <>
                    • How to check business alerts<br />
                    • Where to find important notifications<br />
                    • How to stay updated on system events
                  </>
                )}
                {tutorialStep === 1 && (
                  <>
                    • How to navigate between sections<br />
                    • Understanding the sidebar layout<br />
                    • Accessing car inventory features
                  </>
                )}
                {tutorialStep === 2 && (
                  <>
                    • How to add new vehicles<br />
                    • Using the car entry forms<br />
                    • Managing inventory efficiently
                  </>
                )}
                {tutorialStep === 3 && (
                  <>
                    • How to search and filter data<br />
                    • Finding specific vehicles quickly<br />
                    • Using search functionality effectively
                  </>
                )}
                {tutorialStep === 4 && (
                  <>
                    • Managing individual car records<br />
                    • Understanding action menus<br />
                    • Editing and updating car details
                  </>
                )}
                {tutorialStep >= 5 && (
                  <>
                    • Using advanced software features<br />
                    • Optimizing your workflow<br />
                    • Managing business operations
                  </>
                )}
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                <button
                  onClick={() => {
                    if (tutorialStep > 0) {
                      const prevStep = tutorialStep - 1;
                      setTutorialStep(prevStep);
                      navigate(interactiveTutorialSteps[prevStep].route);
                    }
                  }}
                  disabled={tutorialStep === 0}
                  style={{
                    backgroundColor: tutorialStep === 0 ? '#e5e7eb' : '#6b7280',
                    color: tutorialStep === 0 ? '#9ca3af' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: tutorialStep === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  ← Back
                </button>
                
                <div style={{ fontSize: '12px', color: '#666', alignSelf: 'center' }}>
                  {tutorialStep + 1} of {interactiveTutorialSteps.length} steps
                </div>

                <button
                  onClick={() => {
                    console.log('Next button clicked, current step:', tutorialStep);
                    if (tutorialStep < interactiveTutorialSteps.length - 1) {
                      const nextStep = tutorialStep + 1;
                      console.log('Moving to step:', nextStep);
                      setTutorialStep(nextStep);
                      navigate(interactiveTutorialSteps[nextStep].route);
                    } else {
                      console.log('Tutorial finished');
                      setIsTutorialActive(false);
                    }
                  }}
                  style={{
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {tutorialStep === interactiveTutorialSteps.length - 1 ? 'Finish' : 'Next →'}
                </button>
              </div>

              {/* Additional Tutorial Controls */}
              <div style={{ 
                marginTop: '12px', 
                paddingTop: '12px', 
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: '8px',
                justifyContent: 'center'
              }}>
                <button
                  onClick={() => {
                    if (tutorialStep < interactiveTutorialSteps.length - 1) {
                      const nextStep = tutorialStep + 1;
                      setTutorialStep(nextStep);
                      navigate(interactiveTutorialSteps[nextStep].route);
                    }
                  }}
                  disabled={tutorialStep === interactiveTutorialSteps.length - 1}
                  style={{
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 10px',
                    cursor: tutorialStep === interactiveTutorialSteps.length - 1 ? 'not-allowed' : 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    opacity: tutorialStep === interactiveTutorialSteps.length - 1 ? 0.5 : 1
                  }}
                >
                  Skip Step
                </button>
                
                <button
                  onClick={() => setIsTutorialActive(false)}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}
                >
                  End Tutorial
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Simple Chat Interface */}
        {isChatOpen && (
          <div
            style={{
              position: 'fixed',
              bottom: '70px',
              right: '20px',
              width: '300px',
              height: '400px',
              backgroundColor: 'white',
              border: '2px solid #000',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              zIndex: 999998,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Chat Header */}
            <div
              style={{
                backgroundColor: '#fbbf24',
                color: '#000',
                padding: '12px',
                borderRadius: '10px 10px 0 0',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '2px solid #000'
              }}
            >
              <span>🤖 MonzaBot</span>
              <button
                onClick={() => setIsChatOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#000',
                  fontSize: '18px',
                  cursor: 'pointer',
                  padding: '0',
                  width: '20px',
                  height: '20px'
                }}
              >
                ×
              </button>
            </div>
            
            {/* Chat Messages */}
            <div
              style={{
                flex: 1,
                padding: '12px',
                overflowY: 'auto',
                backgroundColor: '#f9f9f9'
              }}
            >
              <div
                style={{
                  backgroundColor: '#e5e7eb',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  fontSize: '14px'
                }}
              >
                👋 Hello! I'm MonzaBot. How can I help you today?
              </div>
            </div>
            
            {/* Chat Input */}
            <div
              style={{
                padding: '12px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex',
                gap: '8px'
              }}
            >
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    alert(`MonzaBot: Thank you for your message: "${chatMessage}"\n\nI can help you with:\n🚗 Car inventory\n🔧 Repairs\n📊 Analytics\n📋 PDI\n\nFull AI chat coming soon!`);
                    setChatMessage('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (chatMessage.trim()) {
                    alert(`MonzaBot: Thank you for your message: "${chatMessage}"\n\nI can help you with:\n🚗 Car inventory\n🔧 Repairs\n📊 Analytics\n📋 PDI\n\nFull AI chat coming soon!`);
                    setChatMessage('');
                  }
                }}
                style={{
                  backgroundColor: '#fbbf24',
                  color: '#000',
                  border: '1px solid #000',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Terms Agreement Dialog */}
        {showTermsDialog && terms && (
          <ErrorBoundary>
            <TermsAgreementDialog
              isOpen={showTermsDialog}
              onClose={handleDeclineTerms}
              terms={terms}
              onAgree={handleAgreeToTerms}
              onDecline={handleDeclineTerms}
              isLoading={termsLoading}
            />
          </ErrorBoundary>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Layout;
