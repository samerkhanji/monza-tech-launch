import Shepherd from 'shepherd.js';

const TOUR_COMPLETED_KEY = 'monza_tour_completed';

// Helper function to wait for an element to exist in the DOM
function waitForElement(selector: string, timeout = 5000): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element as HTMLElement);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout waiting for element with selector: ${selector}`));
      } else {
        requestAnimationFrame(checkElement);
      }
    };
    checkElement();
  });
}

export const tourService = {
  tour: null as any,
  navigate: null as any,

  init(navigateFn: any) {
    this.navigate = navigateFn;
    this.tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'monza-tour',
        scrollTo: true,
        cancelIcon: { enabled: false },
        canClickTarget: false,
        modalOverlayOpeningPadding: 8,
      },
      steps: this.setupSteps()
    });
  },

  setupSteps() {
    if (!this.tour || !this.navigate) return;
    return [
      {
        id: 'welcome',
        title: 'Welcome to Monza S.A.L.!',
        text: `<div style='display:flex;align-items:center;gap:12px;'>
          <img src='/logo192.png' alt='MonzaBot' style='width:40px;height:40px;border-radius:50%;border:2px solid #FFCB05;'>
          <span>Hi, I'm <b>MonzaBot</b>! Let's take a quick tour so you can get the most out of Monza S.A.L.'s management system.</span>
        </div>`,
        attachTo: { element: 'body', on: 'center' },
        buttons: [
          { text: 'Next', action: () => this.tour.next() }
        ]
      },
      {
        id: 'dashboard',
        title: 'Dashboard',
        text: `<img src='/logo192.png' alt='MonzaBot' style='width:32px;height:32px;vertical-align:middle;margin-right:8px;'>
        This is your dashboard. Here you'll see key stats, quick links, and recent activity.`,
        attachTo: { element: '.dashboard-section', on: 'bottom' },
        route: '/',
        beforeShowPromise: function() {
          const step = this;
          return new Promise((resolve) => {
            if (window.location.pathname !== step.options.route) {
              this.navigate(step.options.route);
              waitForElement(step.options.attachTo.element).then(resolve).catch(console.error);
            } else {
              waitForElement(step.options.attachTo.element).then(resolve).catch(console.error);
            }
          });
        },
        buttons: [
          { text: 'Back', action: this.tour.back },
          { text: 'Next', action: () => this.tour.next() }
        ]
      },
      {
        id: 'showroom',
        title: 'Showroom',
        text: `<img src='/logo192.png' alt='MonzaBot' style='width:32px;height:32px;vertical-align:middle;margin-right:8px;'>
        Manage cars on display, add new arrivals, and track showroom inventory here.`,
        attachTo: { element: '.showroom-section', on: 'bottom' },
        route: '/showroom',
        beforeShowPromise: function() {
          const step = this;
          return new Promise((resolve) => {
            if (window.location.pathname !== step.options.route) {
              this.navigate(step.options.route);
              waitForElement(step.options.attachTo.element).then(resolve).catch(console.error);
            } else {
              waitForElement(step.options.attachTo.element).then(resolve).catch(console.error);
            }
          });
        },
        buttons: [
          { text: 'Back', action: this.tour.back },
          { text: 'Next', action: () => this.tour.next() }
        ]
      },
      {
        id: 'garage-inventory',
        title: 'Garage Inventory',
        text: `<img src='/logo192.png' alt='MonzaBot' style='width:32px;height:32px;vertical-align:middle;margin-right:8px;'>
        Track all parts and supplies for the garage. Use filters, search, and add/edit parts as needed.`,
        attachTo: { element: '.garage-inventory-section', on: 'bottom' },
        route: '/garage-inventory',
        beforeShowPromise: function() {
          const step = this;
          return new Promise((resolve) => {
            if (window.location.pathname !== step.options.route) {
              this.navigate(step.options.route);
              waitForElement(step.options.attachTo.element).then(resolve).catch(console.error);
            } else {
              waitForElement(step.options.attachTo.element).then(resolve).catch(console.error);
            }
          });
        },
        buttons: [
          { text: 'Back', action: this.tour.back },
          { text: 'Next', action: () => this.tour.next() }
        ]
      },
      {
        id: 'pdi',
        title: 'PDI Management',
        text: `<img src='/logo192.png' alt='MonzaBot' style='width:32px;height:32px;vertical-align:middle;margin-right:8px;'>
        Perform and upload Pre-Delivery Inspections (PDI) for vehicles. Click here to upload a PDI file or update status.`,
        attachTo: { element: '.pdi-section', on: 'bottom' },
        route: '/pdi',
        beforeShowPromise: function() {
          const step = this;
          return new Promise((resolve) => {
            if (window.location.pathname !== step.options.route) {
              this.navigate(step.options.route);
              waitForElement(step.options.attachTo.element).then(resolve).catch(console.error);
            } else {
              waitForElement(step.options.attachTo.element).then(resolve).catch(console.error);
            }
          });
        },
        buttons: [
          { text: 'Back', action: this.tour.back },
          { text: 'Next', action: () => this.tour.next() }
        ]
      },
      {
        id: 'part-scanner',
        title: 'Part Number Scanner',
        text: `<img src='/logo192.png' alt='MonzaBot' style='width:32px;height:32px;vertical-align:middle;margin-right:8px;'>
        Scan part numbers using your device camera. OCR will extract the number and show a live preview.`,
        attachTo: { element: '.part-scanner-section', on: 'bottom' },
        route: '/part-scanner',
        beforeShowPromise: function() {
          const step = this;
          return new Promise((resolve) => {
            if (window.location.pathname !== step.options.route) {
              this.navigate(step.options.route);
              waitForElement(step.options.attachTo.element).then(resolve).catch(console.error);
            } else {
              waitForElement(step.options.attachTo.element).then(resolve).catch(console.error);
            }
          });
        },
        buttons: [
          { text: 'Back', action: this.tour.back },
          { text: 'Next', action: () => this.tour.next() }
        ]
      },
      {
        id: 'repairs',
        title: 'Repairs',
        text: `<img src='/logo192.png' alt='MonzaBot' style='width:32px;height:32px;vertical-align:middle;margin-right:8px;'>
        Track and manage all repair jobs. Update statuses, assign technicians, and view repair history.`,
        attachTo: { element: '.repairs-section', on: 'bottom' },
        route: '/repairs',
        beforeShowPromise: function() {
          const step = this;
          return new Promise((resolve) => {
            if (window.location.pathname !== step.options.route) {
              this.navigate(step.options.route);
              waitForElement(step.options.attachTo.element).then(resolve).catch(console.error);
            } else {
              waitForElement(step.options.attachTo.element).then(resolve).catch(console.error);
            }
          });
        },
        buttons: [
          { text: 'Back', action: this.tour.back },
          { text: 'Next', action: () => { this.navigate('/repairs'); this.tour.next(); } }
        ]
      },
      {
        id: 'sales-reports',
        title: 'Sales & Reports',
        text: `<img src='/logo192.png' alt='MonzaBot' style='width:32px;height:32px;vertical-align:middle;margin-right:8px;'>
        Monitor sales, generate reports, and analyze business performance.`,
        attachTo: { element: '.sales-section', on: 'bottom' },
        route: '/sales',
        beforeShowPromise: function() {
          const step = this;
          return new Promise((resolve) => {
            if (window.location.pathname !== step.options.route) {
              this.navigate(step.options.route);
              waitForElement(step.options.attachTo.element).then(resolve).catch(console.error);
            } else {
              waitForElement(step.options.attachTo.element).then(resolve).catch(console.error);
            }
          });
        },
        buttons: [
          { text: 'Back', action: this.tour.back },
          { text: 'Next', action: () => { this.navigate('/sales'); this.tour.next(); } }
        ]
      },
      {
        id: 'user-management',
        title: 'User Management',
        text: `<img src='/logo192.png' alt='MonzaBot' style='width:32px;height:32px;vertical-align:middle;margin-right:8px;'>
        Manage employee accounts, roles, and permissions here.`,
        attachTo: { element: '.user-management-section', on: 'bottom' },
        route: '/user-management',
        beforeShowPromise: function() {
          const step = this;
          return new Promise((resolve) => {
            if (window.location.pathname !== step.options.route) {
              this.navigate(step.options.route);
              waitForElement(step.options.attachTo.element).then(resolve).catch(console.error);
            } else {
              waitForElement(step.options.attachTo.element).then(resolve).catch(console.error);
            }
          });
        },
        buttons: [
          { text: 'Back', action: this.tour.back },
          { text: 'Next', action: () => { this.navigate('/user-management'); this.tour.next(); } }
        ]
      },
      {
        id: 'monzabot-help',
        title: 'MonzaBot Help',
        text: `<img src='/logo192.png' alt='MonzaBot' style='width:32px;height:32px;vertical-align:middle;margin-right:8px;'>
        Need help? Click the MonzaBot icon anytime for guidance, tips, or to retake this tour.`,
        attachTo: { element: '.monzabot-button', on: 'left' },
        buttons: [
          { text: 'Back', action: this.tour.back },
          { text: 'Finish', action: () => { this.tour?.complete(); this.markTourCompleted(); } }
        ]
      }
    ];
  },

  start() {
    if (!this.tour) {
      console.error("Tour service not initialized with navigate function.");
      return;
    }
    this.tour?.start();
  },

  markTourCompleted() {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
  },

  hasCompletedTour(): boolean {
    return localStorage.getItem(TOUR_COMPLETED_KEY) === 'true';
  },

  resetTour() {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
  }
}; 