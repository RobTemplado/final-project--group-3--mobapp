import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Category,
  CurrencySettings,
  Expense,
  MerchantCategoryMap,
  ReminderSettings,
  User,
} from './types';

const STORAGE_KEYS = {
  users: 'final-project:users',
  expenses: 'final-project:expenses',
  categories: 'final-project:categories',
  merchantCategoryMap: 'final-project:merchant-category-map',
  reminderSettings: 'final-project:reminder-settings',
  currencySettings: 'final-project:currency-settings',
};

export const defaultCategories: Category[] = [
  { id: 'cat-food', name: 'Food', limit: 300 },
  { id: 'cat-transport', name: 'Transport', limit: 200 },
  { id: 'cat-utilities', name: 'Utilities', limit: 250 },
];

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function loadUsers(): Promise<User[]> {
  return readJson<User[]>(STORAGE_KEYS.users, []);
}

export async function saveUsers(users: User[]): Promise<void> {
  await writeJson(STORAGE_KEYS.users, users);
}

export async function loadExpenses(): Promise<Expense[]> {
  return readJson<Expense[]>(STORAGE_KEYS.expenses, []);
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
  await writeJson(STORAGE_KEYS.expenses, expenses);
}

export async function loadCategories(): Promise<Category[]> {
  return readJson<Category[]>(STORAGE_KEYS.categories, defaultCategories);
}

export async function saveCategories(categories: Category[]): Promise<void> {
  await writeJson(STORAGE_KEYS.categories, categories);
}

export async function loadMerchantCategoryMap(): Promise<MerchantCategoryMap> {
  return readJson<MerchantCategoryMap>(STORAGE_KEYS.merchantCategoryMap, {});
}

export async function saveMerchantCategoryMap(
  map: MerchantCategoryMap,
): Promise<void> {
  await writeJson(STORAGE_KEYS.merchantCategoryMap, map);
}

export async function loadReminderSettings(): Promise<ReminderSettings | null> {
  return readJson<ReminderSettings | null>(STORAGE_KEYS.reminderSettings, null);
}

export async function saveReminderSettings(
  settings: ReminderSettings,
): Promise<void> {
  await writeJson(STORAGE_KEYS.reminderSettings, settings);
}

export async function loadCurrencySettings(): Promise<CurrencySettings | null> {
  return readJson<CurrencySettings | null>(STORAGE_KEYS.currencySettings, null);
}

export async function saveCurrencySettings(
  settings: CurrencySettings,
): Promise<void> {
  await writeJson(STORAGE_KEYS.currencySettings, settings);
}
