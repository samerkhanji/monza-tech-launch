import { supabase } from '@/integrations/supabase/client';

interface BankConfig {
  id: string;
  bankName: string;
  apiEndpoint: string;
  apiKey: string;
  accountNumber: string;
  accountType: 'checking' | 'savings' | 'business';
  currency: string;
  isActive: boolean;
  features: string[];
}

interface Transaction {
  id: string;
  accountId: string;
  type: 'debit' | 'credit';
  amount: number;
  currency: string;
  description: string;
  reference: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  timestamp: string;
  balanceAfter?: number;
  fees?: number;
  category?: string;
  metadata?: Record<string, any>;
}

interface PaymentRequest {
  amount: number;
  currency: string;
  description: string;
  reference: string;
  recipientAccount?: string;
  recipientName?: string;
  recipientBank?: string;
  paymentMethod: 'transfer' | 'check' | 'wire' | 'ach';
  scheduledDate?: string;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

interface AccountBalance {
  accountId: string;
  available: number;
  current: number;
  currency: string;
  lastUpdated: string;
}

interface FinancialReport {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  cashFlow: number;
  transactions: {
    income: Transaction[];
    expenses: Transaction[];
  };
  categories: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
}

// LocalStorage fallback for missing tables
const getLocalStorageData = (key: string): any[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading localStorage for ${key}:`, error);
    return [];
  }
};

const setLocalStorageData = (key: string, data: any[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error writing localStorage for ${key}:`, error);
  }
};

class BankingIntegrationService {
  private static instance: BankingIntegrationService;
  private bankConfigs: Map<string, BankConfig> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.loadBankConfigs();
  }

  static getInstance(): BankingIntegrationService {
    if (!this.instance) {
      this.instance = new BankingIntegrationService();
    }
    return this.instance;
  }

  // Load bank configurations
  private async loadBankConfigs(): Promise<void> {
    try {
      // Try Supabase first
      try {
        const { data: banks, error } = await supabase
          .from('audit_logs') // Use existing table as fallback
          .select('*')
          .eq('table_name', 'bank_configs')
          .eq('action', 'INSERT');

        if (!error && banks) {
          banks.forEach(bank => {
            const bankData = bank.new_data;
            if (bankData && bankData.is_active) {
              this.bankConfigs.set(bankData.id, {
                id: bankData.id,
                bankName: bankData.bank_name,
                apiEndpoint: bankData.api_endpoint,
                apiKey: bankData.api_key,
                accountNumber: bankData.account_number,
                accountType: bankData.account_type,
                currency: bankData.currency,
                isActive: bankData.is_active,
                features: bankData.features || [],
              });
            }
          });
        }
      } catch (supabaseError) {
        console.warn('Supabase query failed, using localStorage fallback:', supabaseError);
      }

      // Fallback to localStorage
      const localBanks = getLocalStorageData('bank_configs');
      localBanks.forEach(bank => {
        if (bank.is_active) {
          this.bankConfigs.set(bank.id, {
            id: bank.id,
            bankName: bank.bank_name,
            apiEndpoint: bank.api_endpoint,
            apiKey: bank.api_key,
            accountNumber: bank.account_number,
            accountType: bank.account_type,
            currency: bank.currency,
            isActive: bank.is_active,
            features: bank.features || [],
          });
        }
      });

      console.log(`Loaded ${this.bankConfigs.size} bank configurations`);
    } catch (error) {
      console.error('Error loading bank configs:', error);
    }
  }

  // Start automatic transaction sync
  async startTransactionSync(intervalMinutes: number = 15): Promise<void> {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      await this.syncTransactionsFromAllBanks();
    }, intervalMinutes * 60 * 1000);

    // Initial sync
    await this.syncTransactionsFromAllBanks();
  }

  // Stop transaction sync
  stopTransactionSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Get account balances
  async getAccountBalances(): Promise<AccountBalance[]> {
    const balances: AccountBalance[] = [];

    for (const [bankId, bank] of this.bankConfigs) {
      if (!bank.features.includes('balance_inquiry')) {
        continue;
      }

      try {
        const balance = await this.getBalanceFromBank(bank);
        if (balance) {
          balances.push(balance);
        }
      } catch (error) {
        console.error(`Failed to get balance from ${bank.bankName}:`, error);
      }
    }

    // Store balances in database
    await this.storeAccountBalances(balances);

    return balances;
  }

  // Get balance from specific bank
  private async getBalanceFromBank(bank: BankConfig): Promise<AccountBalance | null> {
    try {
      const response = await fetch(`${bank.apiEndpoint}/api/v1/accounts/${bank.accountNumber}/balance`, {
        headers: {
          'Authorization': `Bearer ${bank.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        accountId: bank.id,
        available: data.availableBalance || 0,
        current: data.currentBalance || 0,
        currency: bank.currency,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error getting balance from ${bank.bankName}:`, error);
      return null;
    }
  }

  // Process payment
  async processPayment(bankId: string, paymentRequest: PaymentRequest): Promise<Transaction | null> {
    const bank = this.bankConfigs.get(bankId);
    if (!bank || !bank.features.includes('payments')) {
      throw new Error('Bank does not support payments');
    }

    try {
      const response = await fetch(`${bank.apiEndpoint}/api/v1/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${bank.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNumber: bank.accountNumber,
          amount: paymentRequest.amount,
          currency: paymentRequest.currency,
          description: paymentRequest.description,
          reference: paymentRequest.reference,
          recipientAccount: paymentRequest.recipientAccount,
          recipientName: paymentRequest.recipientName,
          recipientBank: paymentRequest.recipientBank,
          paymentMethod: paymentRequest.paymentMethod,
          scheduledDate: paymentRequest.scheduledDate,
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment failed: ${response.statusText}`);
      }

      const data = await response.json();

      const transaction: Transaction = {
        id: data.transactionId,
        accountId: bankId,
        type: 'debit',
        amount: paymentRequest.amount,
        currency: paymentRequest.currency,
        description: paymentRequest.description,
        reference: paymentRequest.reference,
        status: data.status || 'pending',
        timestamp: new Date().toISOString(),
        fees: data.fees,
        category: 'payment',
        metadata: {
          recipientAccount: paymentRequest.recipientAccount,
          recipientName: paymentRequest.recipientName,
          paymentMethod: paymentRequest.paymentMethod,
        },
      };

      // Store transaction
      await this.storeTransaction(transaction);

      return transaction;
    } catch (error) {
      console.error('Failed to process payment:', error);
      return null;
    }
  }

  // Get transaction history
  async getTransactionHistory(
    bankId: string,
    startDate: string,
    endDate: string,
    limit: number = 100
  ): Promise<Transaction[]> {
    const bank = this.bankConfigs.get(bankId);
    if (!bank || !bank.features.includes('transaction_history')) {
      return [];
    }

    try {
      const response = await fetch(
        `${bank.apiEndpoint}/api/v1/accounts/${bank.accountNumber}/transactions?` +
        `startDate=${startDate}&endDate=${endDate}&limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${bank.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const transactions: Transaction[] = data.transactions?.map((tx: any) => ({
        id: tx.id,
        accountId: bankId,
        type: tx.amount >= 0 ? 'credit' : 'debit',
        amount: Math.abs(tx.amount),
        currency: tx.currency || bank.currency,
        description: tx.description || '',
        reference: tx.reference || '',
        status: 'completed',
        timestamp: tx.timestamp,
        balanceAfter: tx.balanceAfter,
        fees: tx.fees,
        category: this.categorizeTransaction(tx.description),
        metadata: tx.metadata,
      })) || [];

      // Store transactions
      await this.storeTransactions(transactions);

      return transactions;
    } catch (error) {
      console.error(`Failed to get transaction history from ${bank.bankName}:`, error);
      return [];
    }
  }

  // Sync transactions from all banks
  private async syncTransactionsFromAllBanks(): Promise<void> {
    console.log('Starting transaction sync from all banks...');

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Last 7 days

    for (const [bankId, bank] of this.bankConfigs) {
      if (!bank.features.includes('transaction_history')) {
        continue;
      }

      try {
        await this.getTransactionHistory(bankId, startDate, endDate);
        console.log(`Synced transactions from ${bank.bankName}`);
      } catch (error) {
        console.error(`Failed to sync transactions from ${bank.bankName}:`, error);
      }
    }

    console.log('Transaction sync completed');
  }

  // Generate financial report
  async generateFinancialReport(
    startDate: string,
    endDate: string,
    accountIds?: string[]
  ): Promise<FinancialReport> {
    try {
      // Try Supabase first
      let transactions: any[] = [];
      
      try {
        let query = supabase
          .from('audit_logs')
          .select('*')
          .eq('table_name', 'transactions')
          .gte('timestamp', startDate)
          .lte('timestamp', endDate);

        if (accountIds && accountIds.length > 0) {
          query = query.in('new_data->account_id', accountIds);
        }

        const { data, error } = await query;

        if (!error && data) {
          transactions = data
            .map(item => item.new_data)
            .filter(Boolean);
        }
      } catch (supabaseError) {
        console.warn('Supabase query failed, using localStorage fallback:', supabaseError);
      }

      // Fallback to localStorage
      if (transactions.length === 0) {
        const allTransactions = getLocalStorageData('transactions');
        transactions = allTransactions.filter(tx => 
          tx.timestamp >= startDate && 
          tx.timestamp <= endDate &&
          (!accountIds || accountIds.includes(tx.account_id))
        );
      }

      const income = transactions?.filter(tx => tx.type === 'credit') || [];
      const expenses = transactions?.filter(tx => tx.type === 'debit') || [];

      const totalRevenue = income.reduce((sum, tx) => sum + tx.amount, 0);
      const totalExpenses = expenses.reduce((sum, tx) => sum + tx.amount, 0);
      const netIncome = totalRevenue - totalExpenses;

      // Calculate cash flow (simplified)
      const cashFlow = netIncome;

      // Categorize expenses
      const categoryTotals = new Map<string, number>();
      expenses.forEach(tx => {
        const category = tx.category || 'Other';
        categoryTotals.set(category, (categoryTotals.get(category) || 0) + tx.amount);
      });

      const categories = Array.from(categoryTotals.entries()).map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      }));

      return {
        period: `${startDate} to ${endDate}`,
        totalRevenue,
        totalExpenses,
        netIncome,
        cashFlow,
        transactions: {
          income: income.map(this.mapTransactionFromDB),
          expenses: expenses.map(this.mapTransactionFromDB),
        },
        categories,
      };
    } catch (error) {
      console.error('Failed to generate financial report:', error);
      throw error;
    }
  }

  // Reconcile account
  async reconcileAccount(
    bankId: string,
    expectedBalance: number,
    reconciliationDate: string
  ): Promise<{
    isReconciled: boolean;
    difference: number;
    discrepancies: Transaction[];
  }> {
    try {
      const balance = await this.getBalanceFromBank(this.bankConfigs.get(bankId)!);
      const actualBalance = balance?.current || 0;
      const difference = actualBalance - expectedBalance;

      // Get recent transactions for discrepancy analysis
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const transactions = await this.getTransactionHistory(bankId, startDate, reconciliationDate);

      // Find potential discrepancies (transactions that might not be recorded)
      const discrepancies = transactions.filter(tx => 
        tx.status === 'pending' || Math.abs(tx.amount) > 1000
      );

      const isReconciled = Math.abs(difference) < 0.01; // Allow for small rounding differences

      // Log reconciliation
      try {
        await supabase.from('audit_logs').insert({
          table_name: 'account_reconciliations',
          record_id: `reconciliation_${Date.now()}`,
          action: 'INSERT',
          new_data: {
            account_id: bankId,
            reconciliation_date: reconciliationDate,
            expected_balance: expectedBalance,
            actual_balance: actualBalance,
            difference,
            is_reconciled: isReconciled,
            discrepancies: discrepancies.length,
          },
          user_id: 'system',
          user_email: 'system@monza.tech',
          user_role: 'system',
          ip_address: '127.0.0.1',
          user_agent: 'MonzaTech-System',
          timestamp: new Date().toISOString()
        });
      } catch (supabaseError) {
        console.warn('Failed to log reconciliation to Supabase:', supabaseError);
        // Store in localStorage as fallback
        const reconciliations = getLocalStorageData('account_reconciliations');
        reconciliations.push({
          id: `reconciliation_${Date.now()}`,
          account_id: bankId,
          reconciliation_date: reconciliationDate,
          expected_balance: expectedBalance,
          actual_balance: actualBalance,
          difference,
          is_reconciled: isReconciled,
          discrepancies: discrepancies.length,
          created_at: new Date().toISOString()
        });
        setLocalStorageData('account_reconciliations', reconciliations);
      }

      return {
        isReconciled,
        difference,
        discrepancies,
      };
    } catch (error) {
      console.error('Failed to reconcile account:', error);
      throw error;
    }
  }

  // Helper methods
  private categorizeTransaction(description: string): string {
    const categories = {
      'Office Supplies': ['office', 'supplies', 'stationery'],
      'Utilities': ['electric', 'water', 'internet', 'phone'],
      'Parts & Inventory': ['parts', 'inventory', 'supplier'],
      'Payroll': ['salary', 'wage', 'payroll'],
      'Insurance': ['insurance'],
      'Rent': ['rent', 'lease'],
      'Marketing': ['marketing', 'advertising'],
      'Fuel': ['fuel', 'gas', 'petrol'],
      'Equipment': ['equipment', 'tools'],
      'Professional Services': ['legal', 'accounting', 'consulting'],
    };

    const lowerDesc = description.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerDesc.includes(keyword))) {
        return category;
      }
    }

    return 'Other';
  }

  private mapTransactionFromDB(tx: any): Transaction {
    return {
      id: tx.id,
      accountId: tx.account_id,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      description: tx.description,
      reference: tx.reference,
      status: tx.status,
      timestamp: tx.timestamp,
      balanceAfter: tx.balance_after,
      fees: tx.fees,
      category: tx.category,
      metadata: tx.metadata,
    };
  }

  // Storage methods
  private async storeAccountBalances(balances: AccountBalance[]): Promise<void> {
    try {
      // Try Supabase first
      try {
        const { error } = await supabase
          .from('audit_logs')
          .insert(
            balances.map(balance => ({
              table_name: 'account_balances',
              record_id: `balance_${balance.accountId}_${Date.now()}`,
              action: 'INSERT',
              new_data: {
                account_id: balance.accountId,
                available: balance.available,
                current: balance.current,
                currency: balance.currency,
                last_updated: balance.lastUpdated,
              },
              user_id: 'system',
              user_email: 'system@monza.tech',
              user_role: 'system',
              ip_address: '127.0.0.1',
              user_agent: 'MonzaTech-System',
              timestamp: new Date().toISOString()
            }))
          );

        if (error) throw error;
      } catch (supabaseError) {
        console.warn('Supabase insert failed, using localStorage fallback:', supabaseError);
      }

      // Always store in localStorage as backup
      const existingBalances = getLocalStorageData('account_balances');
      balances.forEach(balance => {
        const existingIndex = existingBalances.findIndex(b => b.account_id === balance.accountId);
        const balanceData = {
          account_id: balance.accountId,
          available: balance.available,
          current: balance.current,
          currency: balance.currency,
          last_updated: balance.lastUpdated,
        };
        
        if (existingIndex >= 0) {
          existingBalances[existingIndex] = balanceData;
        } else {
          existingBalances.push(balanceData);
        }
      });
      setLocalStorageData('account_balances', existingBalances);
    } catch (error) {
      console.error('Failed to store account balances:', error);
    }
  }

  private async storeTransaction(transaction: Transaction): Promise<void> {
    try {
      // Try Supabase first
      try {
        const { error } = await supabase
          .from('audit_logs')
          .insert({
            table_name: 'transactions',
            record_id: transaction.id,
            action: 'INSERT',
            new_data: {
              id: transaction.id,
              account_id: transaction.accountId,
              type: transaction.type,
              amount: transaction.amount,
              currency: transaction.currency,
              description: transaction.description,
              reference: transaction.reference,
              status: transaction.status,
              timestamp: transaction.timestamp,
              balance_after: transaction.balanceAfter,
              fees: transaction.fees,
              category: transaction.category,
              metadata: transaction.metadata,
            },
            user_id: 'system',
            user_email: 'system@monza.tech',
            user_role: 'system',
            ip_address: '127.0.0.1',
            user_agent: 'MonzaTech-System',
            timestamp: new Date().toISOString()
          });

        if (error) throw error;
      } catch (supabaseError) {
        console.warn('Supabase insert failed, using localStorage fallback:', supabaseError);
      }

      // Always store in localStorage as backup
      const existingTransactions = getLocalStorageData('transactions');
      const transactionData = {
        id: transaction.id,
        account_id: transaction.accountId,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        description: transaction.description,
        reference: transaction.reference,
        status: transaction.status,
        timestamp: transaction.timestamp,
        balance_after: transaction.balanceAfter,
        fees: transaction.fees,
        category: transaction.category,
        metadata: transaction.metadata,
      };
      
      const existingIndex = existingTransactions.findIndex(t => t.id === transaction.id);
      if (existingIndex >= 0) {
        existingTransactions[existingIndex] = transactionData;
      } else {
        existingTransactions.push(transactionData);
      }
      setLocalStorageData('transactions', existingTransactions);
    } catch (error) {
      console.error('Failed to store transaction:', error);
    }
  }

  private async storeTransactions(transactions: Transaction[]): Promise<void> {
    if (transactions.length === 0) return;

    try {
      // Try Supabase first
      try {
        const { error } = await supabase
          .from('audit_logs')
          .insert(
            transactions.map(tx => ({
              table_name: 'transactions',
              record_id: tx.id,
              action: 'INSERT',
              new_data: {
                id: tx.id,
                account_id: tx.accountId,
                type: tx.type,
                amount: tx.amount,
                currency: tx.currency,
                description: tx.description,
                reference: tx.reference,
                status: tx.status,
                timestamp: tx.timestamp,
                balance_after: tx.balanceAfter,
                fees: tx.fees,
                category: tx.category,
                metadata: tx.metadata,
              },
              user_id: 'system',
              user_email: 'system@monza.tech',
              user_role: 'system',
              ip_address: '127.0.0.1',
              user_agent: 'MonzaTech-System',
              timestamp: new Date().toISOString()
            }))
          );

        if (error) throw error;
      } catch (supabaseError) {
        console.warn('Supabase insert failed, using localStorage fallback:', supabaseError);
      }

      // Always store in localStorage as backup
      const existingTransactions = getLocalStorageData('transactions');
      transactions.forEach(tx => {
        const transactionData = {
          id: tx.id,
          account_id: tx.accountId,
          type: tx.type,
          amount: tx.amount,
          currency: tx.currency,
          description: tx.description,
          reference: tx.reference,
          status: tx.status,
          timestamp: tx.timestamp,
          balance_after: tx.balanceAfter,
          fees: tx.fees,
          category: tx.category,
          metadata: tx.metadata,
        };
        
        const existingIndex = existingTransactions.findIndex(t => t.id === tx.id);
        if (existingIndex >= 0) {
          existingTransactions[existingIndex] = transactionData;
        } else {
          existingTransactions.push(transactionData);
        }
      });
      setLocalStorageData('transactions', existingTransactions);
    } catch (error) {
      console.error('Failed to store transactions:', error);
    }
  }

  // Bank management
  async addBankAccount(config: Omit<BankConfig, 'id'>): Promise<string> {
    try {
      const bankId = `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const bankData = {
        id: bankId,
        bank_name: config.bankName,
        api_endpoint: config.apiEndpoint,
        api_key: config.apiKey,
        account_number: config.accountNumber,
        account_type: config.accountType,
        currency: config.currency,
        is_active: config.isActive,
        features: config.features,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Try Supabase first
      try {
        const { error } = await supabase
          .from('audit_logs')
          .insert({
            table_name: 'bank_configs',
            record_id: bankId,
            action: 'INSERT',
            new_data: bankData,
            user_id: 'system',
            user_email: 'system@monza.tech',
            user_role: 'system',
            ip_address: '127.0.0.1',
            user_agent: 'MonzaTech-System',
            timestamp: new Date().toISOString()
          });

        if (error) throw error;
      } catch (supabaseError) {
        console.warn('Supabase insert failed, using localStorage fallback:', supabaseError);
      }

      // Always store in localStorage as backup
      const existingBanks = getLocalStorageData('bank_configs');
      existingBanks.push(bankData);
      setLocalStorageData('bank_configs', existingBanks);

      this.bankConfigs.set(bankId, { ...config, id: bankId });

      return bankId;
    } catch (error) {
      console.error('Failed to add bank account:', error);
      throw error;
    }
  }

  // Test bank connection
  async testBankConnection(bankId: string): Promise<boolean> {
    const bank = this.bankConfigs.get(bankId);
    if (!bank) return false;

    try {
      const response = await fetch(`${bank.apiEndpoint}/api/v1/health`, {
        headers: {
          'Authorization': `Bearer ${bank.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      return response.ok;
    } catch (error) {
      console.error(`Bank connection test failed for ${bank.bankName}:`, error);
      return false;
    }
  }

  // Cleanup
  cleanup(): void {
    this.stopTransactionSync();
  }
}

export default BankingIntegrationService; 