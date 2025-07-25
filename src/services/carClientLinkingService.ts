// Car-Client Linking Service
// Manages the relationship between cars and clients throughout the application

export interface ClientInfo {
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientAddress?: string;
  clientLicensePlate?: string;
  sellingPrice?: number;
  saleDate?: string;
  reservationDate?: string;
  deliveryDate?: string;
  notes?: string;
}

export interface CarClientLink {
  carId: string;
  vinNumber: string;
  model: string;
  brand?: string;
  year?: number;
  color?: string;
  status: 'reserved' | 'sold';
  location: string;
  clientInfo: {
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    clientAddress?: string;
    clientLicensePlate?: string;
    sellingPrice?: number;
    saleDate?: string;
    reservationDate?: string;
    deliveryDate?: string;
    notes?: string;
  };
  lastUpdated: string;
  // Enhanced tracking fields
  dataIntegrityLog?: {
    recordedAt: string;
    recordedBy: string;
    vinVerified: boolean;
    clientVerified: boolean;
    dateTimeRecorded: boolean;
    allDataPresent: boolean;
  };
}

class CarClientLinkingService {
  private readonly STORAGE_KEY = 'carClientLinks';
  private readonly INTEGRITY_LOG_KEY = 'carDataIntegrityLog';
  
  // Get all car-client links
  getAllLinks(): CarClientLink[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading car-client links:', error);
      return [];
    }
  }

  // Link a car with a client
  linkCarWithClient(
    carId: string,
    carInfo: {
      vinNumber: string;
      model: string;
      brand?: string;
      year?: number;
      color?: string;
      status: 'reserved' | 'sold';
      location: string;
    },
    clientInfo: {
      clientName: string;
      clientPhone: string;
      clientEmail?: string;
      clientAddress?: string;
      clientLicensePlate?: string;
      sellingPrice?: number;
      saleDate?: string;
      reservationDate?: string;
      deliveryDate?: string;
      notes?: string;
    },
    recordedBy: string = 'system'
  ): void {
    const timestamp = new Date().toISOString();
    
    // Data integrity validation
    const vinVerified = Boolean(carInfo.vinNumber && carInfo.vinNumber.length >= 10);
    const clientVerified = Boolean(clientInfo.clientName && clientInfo.clientPhone);
    const dateTimeRecorded = Boolean(
      clientInfo.saleDate || clientInfo.reservationDate || clientInfo.deliveryDate
    );
    const allDataPresent = vinVerified && clientVerified && dateTimeRecorded;

    const link: CarClientLink = {
      carId,
      vinNumber: carInfo.vinNumber,
      model: carInfo.model,
      brand: carInfo.brand,
      year: carInfo.year,
      color: carInfo.color,
      status: carInfo.status,
      location: carInfo.location,
      clientInfo: {
        ...clientInfo,
        // Ensure datetime fields are properly formatted
        saleDate: clientInfo.saleDate || (carInfo.status === 'sold' ? timestamp : undefined),
        reservationDate: clientInfo.reservationDate || (carInfo.status === 'reserved' ? timestamp : undefined),
      },
      lastUpdated: timestamp,
      dataIntegrityLog: {
        recordedAt: timestamp,
        recordedBy,
        vinVerified,
        clientVerified,
        dateTimeRecorded,
        allDataPresent
      }
    };

    // Enhanced logging for data tracking
    console.log(`🔗 Car-Client Link Created:`, {
      vin: carInfo.vinNumber,
      client: clientInfo.clientName,
      status: carInfo.status,
      datetime: carInfo.status === 'sold' ? clientInfo.saleDate : clientInfo.reservationDate,
      integrity: link.dataIntegrityLog,
      timestamp
    });

    // Save the link
    const existingLinks = this.getAllLinks();
    const existingIndex = existingLinks.findIndex(link => link.carId === carId);
    
    if (existingIndex >= 0) {
      existingLinks[existingIndex] = link;
    } else {
      existingLinks.push(link);
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingLinks));
    
    // Log data integrity
    this.logDataIntegrity(link);
    
    // Sync to all car sources
    this.syncToCarSources(link);
  }

  // Remove car-client link
  unlinkCar(carId: string): void {
    const links = this.getAllLinks();
    const filteredLinks = links.filter(link => link.carId !== carId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredLinks));
    
    // Update car status back to in_stock in all sources
    this.updateCarInAllSources(carId, { 
      status: 'in_stock',
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      clientAddress: '',
      clientLicensePlate: '',
      sellingPrice: 0,
      saleDate: '',
      reservationDate: '',
      deliveryDate: '',
      notes: ''
    });
  }

  // Get client info for a specific car
  getClientForCar(carId: string): ClientInfo | null {
    const links = this.getAllLinks();
    const link = links.find(link => link.carId === carId);
    return link?.clientInfo || null;
  }

  // Get all cars for a specific client
  getCarsForClient(clientPhone: string): CarClientLink[] {
    const links = this.getAllLinks();
    return links.filter(link => 
      link.clientInfo?.clientPhone === clientPhone ||
      link.clientInfo?.clientName?.toLowerCase().includes(clientPhone.toLowerCase())
    );
  }

  // Update client information
  updateClientInfo(carId: string, clientInfo: Partial<ClientInfo>): void {
    const links = this.getAllLinks();
    const linkIndex = links.findIndex(link => link.carId === carId);
    
    if (linkIndex !== -1) {
      links[linkIndex].clientInfo = {
        ...links[linkIndex].clientInfo!,
        ...clientInfo
      };
      links[linkIndex].lastUpdated = new Date().toISOString();
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(links));
      this.syncWithCarSources(carId, links[linkIndex]);
    }
  }

  // Sync with all car storage sources
  private syncWithCarSources(carId: string, linkData: CarClientLink): void {
    const sources = [
      'carInventory',
      'showroomFloor1Cars',
      'showroomFloor2Cars', 
      'garageCars'
    ];

    sources.forEach(source => {
      this.updateCarInSource(source, carId, {
        status: linkData.status,
        clientName: linkData.clientInfo?.clientName || '',
        clientPhone: linkData.clientInfo?.clientPhone || '',
        clientEmail: linkData.clientInfo?.clientEmail || '',
        clientAddress: linkData.clientInfo?.clientAddress || '',
        clientLicensePlate: linkData.clientInfo?.clientLicensePlate || '',
        sellingPrice: linkData.clientInfo?.sellingPrice || 0,
        saleDate: linkData.clientInfo?.saleDate || '',
        reservationDate: linkData.clientInfo?.reservationDate || '',
        deliveryDate: linkData.clientInfo?.deliveryDate || '',
        notes: linkData.clientInfo?.notes || '',
        lastUpdated: linkData.lastUpdated
      });
    });
  }

  // Update car in specific source
  private updateCarInSource(source: string, carId: string, updates: any): void {
    try {
      const data = localStorage.getItem(source);
      if (data) {
        const cars = JSON.parse(data);
        const carIndex = cars.findIndex((car: any) => car.id === carId);
        
        if (carIndex !== -1) {
          cars[carIndex] = { ...cars[carIndex], ...updates };
          localStorage.setItem(source, JSON.stringify(cars));
        }
      }
    } catch (error) {
      console.error(`Error updating car in ${source}:`, error);
    }
  }

  // Update car in all sources
  private updateCarInAllSources(carId: string, updates: any): void {
    const sources = [
      'carInventory',
      'showroomFloor1Cars',
      'showroomFloor2Cars',
      'garageCars'
    ];

    sources.forEach(source => {
      this.updateCarInSource(source, carId, updates);
    });
  }

  // Initialize links from existing car data
  initializeFromExistingData(): void {
    const sources = [
      'carInventory',
      'showroomFloor1Cars',
      'showroomFloor2Cars',
      'garageCars'
    ];

    const existingLinks = this.getAllLinks();
    const newLinks: CarClientLink[] = [...existingLinks];

    sources.forEach(source => {
      const data = localStorage.getItem(source);
      if (data) {
        const cars = JSON.parse(data);
        
        cars.forEach((car: any) => {
          if ((car.status === 'reserved' || car.status === 'sold') && car.clientName) {
            const existingLink = existingLinks.find(link => link.carId === car.id);
            
            if (!existingLink) {
              const newLink: CarClientLink = {
                carId: car.id,
                vinNumber: car.vinNumber,
                model: car.model,
                brand: car.brand,
                year: car.year,
                color: car.color,
                status: car.status,
                location: car.location || source.replace('Cars', '').replace(/([A-Z])/g, ' $1').trim(),
                clientInfo: {
                  clientName: car.clientName,
                  clientPhone: car.clientPhone,
                  clientEmail: car.clientEmail,
                  clientAddress: car.clientAddress,
                  clientLicensePlate: car.clientLicensePlate,
                  sellingPrice: car.sellingPrice,
                  saleDate: car.saleDate,
                  reservationDate: car.reservationDate || car.reservedDate,
                  deliveryDate: car.deliveryDate,
                  notes: car.notes
                },
                lastUpdated: car.lastUpdated || new Date().toISOString()
              };
              
              newLinks.push(newLink);
            }
          }
        });
      }
    });

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(newLinks));
  }

  // Search functionality
  searchLinks(query: string): CarClientLink[] {
    const links = this.getAllLinks();
    const lowerQuery = query.toLowerCase();
    
    return links.filter(link => 
      link.vinNumber.toLowerCase().includes(lowerQuery) ||
      link.model.toLowerCase().includes(lowerQuery) ||
      (link.brand && link.brand.toLowerCase().includes(lowerQuery)) ||
      (link.clientInfo?.clientName && link.clientInfo.clientName.toLowerCase().includes(lowerQuery)) ||
      (link.clientInfo?.clientPhone && link.clientInfo.clientPhone.includes(query))
    );
  }

  // Get delivery statistics
  getDeliveryStats(): {
    totalReserved: number;
    totalSold: number;
    pendingDelivery: number;
    overdueDelivery: number;
  } {
    const links = this.getAllLinks();
    const now = new Date();
    
    const totalReserved = links.filter(link => link.status === 'reserved').length;
    const totalSold = links.filter(link => link.status === 'sold').length;
    const pendingDelivery = links.filter(link => 
      (link.status === 'reserved' || link.status === 'sold') && 
      link.clientInfo?.deliveryDate
    ).length;
    const overdueDelivery = links.filter(link => 
      link.clientInfo?.deliveryDate && 
      new Date(link.clientInfo.deliveryDate) < now
    ).length;

    return { totalReserved, totalSold, pendingDelivery, overdueDelivery };
  }

  // Log data integrity for audit trail
  private logDataIntegrity(link: CarClientLink): void {
    const integrityLogs = JSON.parse(localStorage.getItem(this.INTEGRITY_LOG_KEY) || '[]');
    
    const logEntry = {
      id: crypto.randomUUID(),
      vinNumber: link.vinNumber,
      clientName: link.clientInfo.clientName,
      status: link.status,
      timestamp: new Date().toISOString(),
      integrity: link.dataIntegrityLog,
      dataSnapshot: {
        hasVin: Boolean(link.vinNumber),
        hasClient: Boolean(link.clientInfo.clientName),
        hasPhone: Boolean(link.clientInfo.clientPhone),
        hasDateTime: Boolean(link.clientInfo.saleDate || link.clientInfo.reservationDate),
        hasPrice: Boolean(link.clientInfo.sellingPrice)
      }
    };
    
    integrityLogs.push(logEntry);
    localStorage.setItem(this.INTEGRITY_LOG_KEY, JSON.stringify(integrityLogs));
    
    console.log(`📊 Data Integrity Logged:`, logEntry);
  }

  // Enhanced synchronization to ensure data consistency
  private syncToCarSources(link: CarClientLink): void {
    const carUpdate = {
      status: link.status,
      clientName: link.clientInfo.clientName,
      clientPhone: link.clientInfo.clientPhone,
      clientEmail: link.clientInfo.clientEmail || '',
      clientAddress: link.clientInfo.clientAddress || '',
      clientLicensePlate: link.clientInfo.clientLicensePlate || '',
      sellingPrice: link.clientInfo.sellingPrice || 0,
      saleDate: link.clientInfo.saleDate,
      reservationDate: link.clientInfo.reservationDate,
      deliveryDate: link.clientInfo.deliveryDate,
      notes: link.clientInfo.notes || '',
      lastUpdated: link.lastUpdated
    };

    // Update all possible car storage locations
    const sources = [
      'carInventory',
      'showroomFloor1Cars', 
      'showroomFloor2Cars',
      'garageCars',
      'garageCarInventory'
    ];

    sources.forEach(source => {
      const data = localStorage.getItem(source);
      if (data) {
        const cars = JSON.parse(data);
        const carIndex = cars.findIndex((car: any) => 
          car.id === link.carId || car.vinNumber === link.vinNumber
        );
        
        if (carIndex >= 0) {
          cars[carIndex] = { ...cars[carIndex], ...carUpdate };
          localStorage.setItem(source, JSON.stringify(cars));
          
          console.log(`✅ Synced to ${source}:`, {
            vin: link.vinNumber,
            client: link.clientInfo.clientName,
            status: link.status
          });
        }
      }
    });
  }

  // Get data integrity report
  getDataIntegrityReport(): any {
    const integrityLogs = JSON.parse(localStorage.getItem(this.INTEGRITY_LOG_KEY) || '[]');
    const links = this.getAllLinks();
    
    return {
      totalRecords: links.length,
      completeRecords: links.filter(link => link.dataIntegrityLog?.allDataPresent).length,
      incompleteRecords: links.filter(link => !link.dataIntegrityLog?.allDataPresent).length,
      recentLogs: integrityLogs.slice(-10),
      summary: {
        withVin: links.filter(link => link.dataIntegrityLog?.vinVerified).length,
        withClient: links.filter(link => link.dataIntegrityLog?.clientVerified).length,
        withDateTime: links.filter(link => link.dataIntegrityLog?.dateTimeRecorded).length
      }
    };
  }
}

// Export singleton instance
export const carClientLinkingService = new CarClientLinkingService(); 