export type AnalyticsEventName =
  | "trial_started"
  | "trial_letter_completed"
  | "trial_activity_completed"
  | "trial_completed"
  | "locked_letter_clicked"
  | "locked_feature_clicked"
  | "parent_screen_opened"
  | "purchase_started"
  | "purchase_completed"
  | "purchase_restored";

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  data?: Record<string, string | number | boolean>;
  at: number;
}

const MAX_EVENTS = 50;
const recent: AnalyticsEvent[] = [];

/** Internal-only hook: events stay in memory and are never sent anywhere. */
export function trackEvent(name: AnalyticsEventName, data?: AnalyticsEvent["data"]): void {
  recent.push({ name, data, at: Date.now() });
  if (recent.length > MAX_EVENTS) {
    recent.shift();
  }
}

export function recentAnalyticsEvents(): readonly AnalyticsEvent[] {
  return recent.slice();
}
