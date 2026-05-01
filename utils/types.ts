export type Role = 'Admin' | 'User' | 'Guest';

export type User = {
  id: string;
  name: string;
  password: string;
  role: Role;
};

export type Category = {
  id: string;
  name: string;
  limit: number;
};

export type ReceiptLineItem = {
  id: string;
  name: string;
  amount: number;
};

export type MerchantCategoryMap = Record<string, string>;

export type ReminderSettings = {
  enabled: boolean;
  time: string;
  notificationId?: string;
};

export type ExchangeRates = Record<string, number>;

export type CurrencySettings = {
  homeCurrency: string;
  rates: ExchangeRates;
  updatedAt?: string;
};

export type Expense = {
  id: string;
  userId: string;
  amount: number;
  categoryId: string;
  date: string;
  currency?: string;
  homeAmount?: number;
  exchangeRate?: number;
  exchangeDate?: string;
  merchant?: string;
  receiptImageUri?: string;
  lineItems?: ReceiptLineItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  notes?: string;
  tags?: string[];
};

export type OcrResult = {
  amount?: number;
  date?: string;
  categoryName?: string;
  merchant?: string;
};
