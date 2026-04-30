import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Category,
  CurrencySettings,
  Expense,
  ReminderSettings,
  Role,
  User,
} from "../utils/types";
import {
  defaultCategories,
  loadCategories,
  loadCurrencySettings,
  loadExpenses,
  loadReminderSettings,
  loadUsers,
  saveCategories,
  saveCurrencySettings,
  saveExpenses,
  saveReminderSettings,
  saveUsers,
} from "../utils/storage";
import { clearDailyReminder, scheduleDailyReminder } from "../utils/reminders";

type AuthResult = { ok: true } | { ok: false; error: string };

type AddExpenseInput = {
  amount: number;
  categoryId: string;
  date: string;
  currency: string;
  merchant?: string;
  receiptImageUri?: string;
  lineItems?: Expense["lineItems"];
  subtotal?: number;
  tax?: number;
  total?: number;
  notes?: string;
  tags?: string[];
};

type AppContextValue = {
  users: User[];
  expenses: Expense[];
  categories: Category[];
  currentUser: User | null;
  isLoading: boolean;
  reminderSettings: ReminderSettings;
  currencySettings: CurrencySettings;
  updateReminderSettings: (next: ReminderSettings) => Promise<void>;
  updateCurrencySettings: (next: CurrencySettings) => Promise<void>;
  registerUser: (
    name: string,
    password: string,
    role: Role,
  ) => Promise<AuthResult>;
  login: (name: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  addCategory: (name: string, limit: number) => Promise<Category>;
  addExpense: (input: AddExpenseInput) => Promise<AuthResult>;
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

const defaultReminderSettings: ReminderSettings = {
  enabled: false,
  time: "20:00",
};

const defaultCurrencySettings: CurrencySettings = {
  homeCurrency: "USD",
  rates: {
    USD: 1,
  },
};

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AppContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(
    defaultReminderSettings,
  );
  const [currencySettings, setCurrencySettings] = useState<CurrencySettings>(
    defaultCurrencySettings,
  );

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const [
        loadedUsers,
        loadedExpenses,
        loadedCategories,
        loadedReminders,
        loadedCurrencySettings,
      ] = await Promise.all([
        loadUsers(),
        loadExpenses(),
        loadCategories(),
        loadReminderSettings(),
        loadCurrencySettings(),
      ]);

      if (!isMounted) {
        return;
      }

      const seededUsers = loadedUsers.length
        ? loadedUsers
        : [
            {
              id: createId("user"),
              name: "admin",
              password: "admin",
              role: "Admin",
            },
            {
              id: createId("user"),
              name: "demo",
              password: "demo",
              role: "User",
            },
          ];

      if (!loadedUsers.length) {
        await saveUsers(seededUsers);
      }

      setUsers(seededUsers);
      setExpenses(loadedExpenses);
      setCategories(
        loadedCategories.length ? loadedCategories : defaultCategories,
      );
      setReminderSettings({
        ...defaultReminderSettings,
        ...(loadedReminders ?? {}),
      });
      setCurrencySettings({
        ...defaultCurrencySettings,
        ...(loadedCurrencySettings ?? {}),
        rates: {
          ...defaultCurrencySettings.rates,
          ...(loadedCurrencySettings?.rates ?? {}),
        },
      });
      setIsLoading(false);
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const updateReminderSettings = async (next: ReminderSettings) => {
    setReminderSettings(next);
    await saveReminderSettings(next);
  };

  const updateCurrencySettings = async (next: CurrencySettings) => {
    setCurrencySettings(next);
    await saveCurrencySettings(next);
  };

  useEffect(() => {
    let isMounted = true;

    const syncReminder = async () => {
      if (!currentUser) {
        if (!reminderSettings.notificationId) {
          return;
        }
        const cleared = await clearDailyReminder(reminderSettings);
        if (isMounted) {
          setReminderSettings(cleared);
          await saveReminderSettings(cleared);
        }
        return;
      }

      const userExpenses = expenses.filter(
        (expense) => expense.userId === currentUser.id,
      );
      const next = await scheduleDailyReminder(reminderSettings, userExpenses);
      if (
        isMounted &&
        next.notificationId !== reminderSettings.notificationId
      ) {
        setReminderSettings(next);
        await saveReminderSettings(next);
      }
    };

    syncReminder();

    return () => {
      isMounted = false;
    };
  }, [
    currentUser?.id,
    expenses,
    reminderSettings.enabled,
    reminderSettings.time,
  ]);

  const registerUser = async (
    name: string,
    password: string,
    role: Role,
  ): Promise<AuthResult> => {
    const trimmed = name.trim();
    if (!trimmed || !password.trim()) {
      return { ok: false, error: "Name and password are required." };
    }

    const exists = users.some(
      (user) => user.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exists) {
      return { ok: false, error: "That name is already registered." };
    }

    const newUser: User = {
      id: createId("user"),
      name: trimmed,
      password: password.trim(),
      role,
    };

    const nextUsers = [...users, newUser];
    setUsers(nextUsers);
    await saveUsers(nextUsers);
    setCurrentUser(newUser);

    return { ok: true };
  };

  const login = async (name: string, password: string): Promise<AuthResult> => {
    const match = users.find(
      (user) =>
        user.name.toLowerCase() === name.trim().toLowerCase() &&
        user.password === password.trim(),
    );

    if (!match) {
      return { ok: false, error: "Invalid credentials." };
    }

    setCurrentUser(match);
    return { ok: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addCategory = async (
    name: string,
    limit: number,
  ): Promise<Category> => {
    const trimmed = name.trim();
    const existing = categories.find(
      (category) => category.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) {
      return existing;
    }

    const newCategory: Category = {
      id: createId("cat"),
      name: trimmed,
      limit,
    };

    const nextCategories = [...categories, newCategory];
    setCategories(nextCategories);
    await saveCategories(nextCategories);

    return newCategory;
  };

  const addExpense = async (input: AddExpenseInput): Promise<AuthResult> => {
    if (!currentUser) {
      return { ok: false, error: "You must be logged in." };
    }

    const category = categories.find((item) => item.id === input.categoryId);
    if (!category) {
      return { ok: false, error: "Select a valid category." };
    }

    const currentTotal = expenses
      .filter(
        (expense) =>
          expense.userId === currentUser.id &&
          expense.categoryId === input.categoryId,
      )
      .reduce((sum, expense) => sum + expense.amount, 0);

    if (currentTotal + input.amount > category.limit) {
      return { ok: false, error: "Category limit exceeded." };
    }

    const homeCurrency = currencySettings.homeCurrency;
    const rate =
      input.currency === homeCurrency
        ? 1
        : currencySettings.rates[input.currency];
    if (!rate || rate <= 0) {
      return { ok: false, error: "Missing exchange rate for this currency." };
    }

    const homeAmount = input.amount * rate;

    const newExpense: Expense = {
      id: createId("exp"),
      userId: currentUser.id,
      amount: input.amount,
      categoryId: input.categoryId,
      date: input.date,
      currency: input.currency,
      homeAmount,
      exchangeRate: rate,
      exchangeDate: input.date,
      merchant: input.merchant,
      receiptImageUri: input.receiptImageUri,
      lineItems: input.lineItems,
      subtotal: input.subtotal,
      tax: input.tax,
      total: input.total,
      notes: input.notes,
      tags: input.tags,
    };

    const nextExpenses = [newExpense, ...expenses];
    setExpenses(nextExpenses);
    await saveExpenses(nextExpenses);

    return { ok: true };
  };

  const value = useMemo<AppContextValue>(
    () => ({
      users,
      expenses,
      categories,
      currentUser,
      isLoading,
      reminderSettings,
      currencySettings,
      updateReminderSettings,
      updateCurrencySettings,
      registerUser,
      login,
      logout,
      addCategory,
      addExpense,
    }),
    [
      users,
      expenses,
      categories,
      currentUser,
      isLoading,
      reminderSettings,
      currencySettings,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppContextProvider");
  }
  return context;
}
