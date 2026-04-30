import * as Notifications from "expo-notifications";
import { Expense, ReminderSettings } from "./types";

const DEFAULT_HOUR = 20;
const DEFAULT_MINUTE = 0;

function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, "0");
  const dd = `${date.getDate()}`.padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseTime(value: string): { hour: number; minute: number } {
  const match = value.trim().match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    return { hour: DEFAULT_HOUR, minute: DEFAULT_MINUTE };
  }

  return { hour: Number(match[1]), minute: Number(match[2]) };
}

function hasExpenseOnDate(expenses: Expense[], date: string): boolean {
  return expenses.some((expense) => expense.date === date);
}

function getNextTriggerDate(time: string, hasExpenseToday: boolean): Date {
  const now = new Date();
  const { hour, minute } = parseTime(time);
  const trigger = new Date(now);
  trigger.setHours(hour, minute, 0, 0);

  if (hasExpenseToday || trigger <= now) {
    trigger.setDate(trigger.getDate() + 1);
  }

  return trigger;
}

export async function ensureReminderPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function clearDailyReminder(
  settings: ReminderSettings,
): Promise<ReminderSettings> {
  if (settings.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(
      settings.notificationId,
    );
  }

  return { ...settings, notificationId: undefined };
}

export async function scheduleDailyReminder(
  settings: ReminderSettings,
  expenses: Expense[],
): Promise<ReminderSettings> {
  if (!settings.enabled) {
    return clearDailyReminder(settings);
  }

  const hasPermission = await ensureReminderPermissions();
  if (!hasPermission) {
    return settings;
  }

  if (settings.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(
      settings.notificationId,
    );
  }

  const today = formatDate(new Date());
  const hasToday = hasExpenseOnDate(expenses, today);
  const triggerDate = getNextTriggerDate(settings.time, hasToday);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily reminder",
        body: "Did you spend anything today? Don't forget to log it!",
        sound: "default",
      },
      trigger: { date: triggerDate },
    });

  return { ...settings, notificationId };
}
