import { useState, useEffect, useCallback } from 'react';
import SupplierIntegrationService from '@/services/supplierIntegrationService';
import BankingIntegrationService from '@/services/bankingIntegrationService';
import { toast } from '@/hooks/use-toast';

interface UseApiIntegrationsReturn {
  // Supplier Integration
  suppliers: Array<{
    id: string;
    name: string;
    isConnected: boolean;
    supportedOperations: string[];
  }>;
  getPartQuotes: (partNumber: string) => Promise<any[]>;
  createPurchaseOrder: (supplierId: string, items: any[]) => Promise<any>;
  trackOrder: (orderId: string) => Promise<any>;
  testSupplierConnection: (supplierId: string) => Promise<boolean>;

  // Banking Integration
  bankAccounts: Array<{
    id: string;
    bankName: string;
    isConnected: boolean;
    features: string[];
  }>;
  getAccountBalances: () => Promise<any[]>;
  processPayment: (bankId: string, paymentRequest: any) => Promise<any>;
  getTransactionHistory: (bankId: string, startDate: string, endDate: string) => Promise<any[]>;
  generateFinancialReport: (startDate: string, endDate: string) => Promise<any>;
  reconcileAccount: (bankId: string, expectedBalance: number, date: string) => Promise<any>;
  testBankConnection: (bankId: string) => Promise<boolean>;

  // Common
  isLoading: boolean;
  isConnecting: boolean;
  startSync: () => Promise<void>;
  stopSync: () => void;
  refreshConnections: () => Promise<void>;
}

export const useApiIntegrations = (): UseApiIntegrationsReturn => {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const supplierService = SupplierIntegrationService.getInstance();
  const bankingService = BankingIntegrationService.getInstance();

  // Initialize and load configurations
  useEffect(() => {
    const loadConfigurations = async () => {
      setIsLoading(true);
      try {
        // Load supplier configurations
        const supplierConfigs = supplierService.getSuppliers();
        const suppliersWithStatus = await Promise.all(
          supplierConfigs.map(async (supplier) => ({
            id: supplier.id,
            name: supplier.name,
            isConnected: await supplierService.testSupplierConnection(supplier.id),
            supportedOperations: supplier.supportedOperations,
          }))
        );
        setSuppliers(suppliersWithStatus);

        // Load banking configurations would be similar
        // For now, we'll simulate this
        setBankAccounts([
          {
            id: 'bank1',
            bankName: 'Commercial Bank',
            isConnected: false, // Will be tested
            features: ['balance_inquiry', 'payments', 'transaction_history'],
          },
        ]);
      } catch (error) {
        console.error('Failed to load API configurations:', error);
        toast({
          title: "Configuration Error",
          description: "Failed to load API configurations",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConfigurations();
  }, []);

  // Supplier methods
  const getPartQuotes = useCallback(async (partNumber: string) => {
    try {
      setIsLoading(true);
      const quotes = await supplierService.getPartQuotes(partNumber);
      
      if (quotes.length === 0) {
        toast({
          title: "No Quotes Found",
          description: `No quotes available for part ${partNumber}`,
          variant: "default",
        });
      } else {
        toast({
          title: "Quotes Retrieved",
          description: `Found ${quotes.length} quotes for ${partNumber}`,
          variant: "default",
        });
      }

      return quotes;
    } catch (error) {
      console.error('Failed to get part quotes:', error);
      toast({
        title: "Quote Error",
        description: "Failed to retrieve part quotes",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [supplierService]);

  const createPurchaseOrder = useCallback(async (supplierId: string, items: any[]) => {
    try {
      setIsLoading(true);
      const order = await supplierService.createPurchaseOrder(supplierId, items);
      
      if (order) {
        toast({
          title: "Purchase Order Created",
          description: `Order ${order.orderNumber} created successfully`,
          variant: "default",
        });
      } else {
        throw new Error('Failed to create purchase order');
      }

      return order;
    } catch (error) {
      console.error('Failed to create purchase order:', error);
      toast({
        title: "Order Creation Failed",
        description: "Failed to create purchase order",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [supplierService]);

  const trackOrder = useCallback(async (orderId: string) => {
    try {
      setIsLoading(true);
      const updates = await supplierService.trackOrder(orderId);
      
      if (updates) {
        toast({
          title: "Order Updated",
          description: `Order status: ${updates.status}`,
          variant: "default",
        });
      }

      return updates;
    } catch (error) {
      console.error('Failed to track order:', error);
      toast({
        title: "Tracking Error",
        description: "Failed to track order",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [supplierService]);

  const testSupplierConnection = useCallback(async (supplierId: string) => {
    try {
      setIsConnecting(true);
      const isConnected = await supplierService.testSupplierConnection(supplierId);
      
      // Update supplier connection status
      setSuppliers(prev => prev.map(supplier => 
        supplier.id === supplierId 
          ? { ...supplier, isConnected }
          : supplier
      ));

      toast({
        title: isConnected ? "Connection Successful" : "Connection Failed",
        description: isConnected 
          ? "Supplier API connection verified"
          : "Unable to connect to supplier API",
        variant: isConnected ? "default" : "destructive",
      });

      return isConnected;
    } catch (error) {
      console.error('Failed to test supplier connection:', error);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [supplierService]);

  // Banking methods
  const getAccountBalances = useCallback(async () => {
    try {
      setIsLoading(true);
      const balances = await bankingService.getAccountBalances();
      
      toast({
        title: "Balances Retrieved",
        description: `Retrieved balances for ${balances.length} accounts`,
        variant: "default",
      });

      return balances;
    } catch (error) {
      console.error('Failed to get account balances:', error);
      toast({
        title: "Balance Error",
        description: "Failed to retrieve account balances",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [bankingService]);

  const processPayment = useCallback(async (bankId: string, paymentRequest: any) => {
    try {
      setIsLoading(true);
      const transaction = await bankingService.processPayment(bankId, paymentRequest);
      
      if (transaction) {
        toast({
          title: "Payment Processed",
          description: `Payment of ${paymentRequest.amount} ${paymentRequest.currency} initiated`,
          variant: "default",
        });
      } else {
        throw new Error('Payment processing failed');
      }

      return transaction;
    } catch (error) {
      console.error('Failed to process payment:', error);
      toast({
        title: "Payment Failed",
        description: "Unable to process payment",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [bankingService]);

  const getTransactionHistory = useCallback(async (bankId: string, startDate: string, endDate: string) => {
    try {
      setIsLoading(true);
      const transactions = await bankingService.getTransactionHistory(bankId, startDate, endDate);
      
      toast({
        title: "Transactions Retrieved",
        description: `Found ${transactions.length} transactions`,
        variant: "default",
      });

      return transactions;
    } catch (error) {
      console.error('Failed to get transaction history:', error);
      toast({
        title: "Transaction Error",
        description: "Failed to retrieve transaction history",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [bankingService]);

  const generateFinancialReport = useCallback(async (startDate: string, endDate: string) => {
    try {
      setIsLoading(true);
      const report = await bankingService.generateFinancialReport(startDate, endDate);
      
      toast({
        title: "Report Generated",
        description: `Financial report for ${report.period} created`,
        variant: "default",
      });

      return report;
    } catch (error) {
      console.error('Failed to generate financial report:', error);
      toast({
        title: "Report Error",
        description: "Failed to generate financial report",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [bankingService]);

  const reconcileAccount = useCallback(async (bankId: string, expectedBalance: number, date: string) => {
    try {
      setIsLoading(true);
      const result = await bankingService.reconcileAccount(bankId, expectedBalance, date);
      
      toast({
        title: result.isReconciled ? "Account Reconciled" : "Reconciliation Issues",
        description: result.isReconciled 
          ? "Account balance matches expected amount"
          : `Balance difference: ${result.difference}`,
        variant: result.isReconciled ? "default" : "destructive",
      });

      return result;
    } catch (error) {
      console.error('Failed to reconcile account:', error);
      toast({
        title: "Reconciliation Error",
        description: "Failed to reconcile account",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [bankingService]);

  const testBankConnection = useCallback(async (bankId: string) => {
    try {
      setIsConnecting(true);
      const isConnected = await bankingService.testBankConnection(bankId);
      
      // Update bank connection status
      setBankAccounts(prev => prev.map(bank => 
        bank.id === bankId 
          ? { ...bank, isConnected }
          : bank
      ));

      toast({
        title: isConnected ? "Connection Successful" : "Connection Failed",
        description: isConnected 
          ? "Bank API connection verified"
          : "Unable to connect to bank API",
        variant: isConnected ? "default" : "destructive",
      });

      return isConnected;
    } catch (error) {
      console.error('Failed to test bank connection:', error);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [bankingService]);

  // Sync management
  const startSync = useCallback(async () => {
    try {
      await supplierService.startInventorySync(60); // 60 minutes
      await bankingService.startTransactionSync(15); // 15 minutes
      
      toast({
        title: "Sync Started",
        description: "Automatic synchronization enabled",
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to start sync:', error);
      toast({
        title: "Sync Error",
        description: "Failed to start automatic synchronization",
        variant: "destructive",
      });
    }
  }, [supplierService, bankingService]);

  const stopSync = useCallback(() => {
    try {
      supplierService.stopInventorySync();
      bankingService.stopTransactionSync();
      
      toast({
        title: "Sync Stopped",
        description: "Automatic synchronization disabled",
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to stop sync:', error);
    }
  }, [supplierService, bankingService]);

  const refreshConnections = useCallback(async () => {
    setIsConnecting(true);
    try {
      // Test all supplier connections
      const supplierTests = suppliers.map(async (supplier) => ({
        ...supplier,
        isConnected: await supplierService.testSupplierConnection(supplier.id),
      }));

      // Test all bank connections  
      const bankTests = bankAccounts.map(async (bank) => ({
        ...bank,
        isConnected: await bankingService.testBankConnection(bank.id),
      }));

      const [updatedSuppliers, updatedBanks] = await Promise.all([
        Promise.all(supplierTests),
        Promise.all(bankTests),
      ]);

      setSuppliers(updatedSuppliers);
      setBankAccounts(updatedBanks);

      const connectedSuppliers = updatedSuppliers.filter(s => s.isConnected).length;
      const connectedBanks = updatedBanks.filter(b => b.isConnected).length;

      toast({
        title: "Connections Refreshed",
        description: `${connectedSuppliers} suppliers, ${connectedBanks} banks connected`,
        variant: "default",
      });
    } catch (error) {
      console.error('Failed to refresh connections:', error);
      toast({
        title: "Refresh Error",
        description: "Failed to refresh API connections",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [suppliers, bankAccounts, supplierService, bankingService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      supplierService.cleanup();
      bankingService.cleanup();
    };
  }, []);

  return {
    // Supplier Integration
    suppliers,
    getPartQuotes,
    createPurchaseOrder,
    trackOrder,
    testSupplierConnection,

    // Banking Integration
    bankAccounts,
    getAccountBalances,
    processPayment,
    getTransactionHistory,
    generateFinancialReport,
    reconcileAccount,
    testBankConnection,

    // Common
    isLoading,
    isConnecting,
    startSync,
    stopSync,
    refreshConnections,
  };
}; 