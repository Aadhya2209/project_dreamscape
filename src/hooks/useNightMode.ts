import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useProfile } from "./useProfile";

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
// true when m is inside [start, end) on a 24h clock that may wrap past midnight
const inWindow = (m: number, start: number, end: number) => start <= end ? m >= start && m < end : m >= start || m < end;

export const useNightMode = () => {
  const { data: p } = useProfile();
  const [tick, setTick] = useState(0);
  const [snoozeUntil, setSnoozeUntil] = useState(() => Number(sessionStorage.getItem("nightLockSnooze") || 0));

  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 30000); return () => clearInterval(t); }, []);

  // Bedtime reminder, once per day
  useEffect(() => {
    if (!p?.reminder_enabled) return;
    const bed = toMin(p.target_bedtime);
    const remindAt = (bed - p.reminder_minutes + 1440) % 1440;
    const today = new Date().toDateString();
    if (inWindow(nowMin(), remindAt, (remindAt + 10) % 1440) && localStorage.getItem("bedReminder") !== today) {
      localStorage.setItem("bedReminder", today);
      const msg = p.reminder_minutes ? `Bedtime in ${p.reminder_minutes} minutes — time to wind down 🌙` : "It's bedtime 🌙";
      toast(msg, { duration: 15000 });
      if ("Notification" in window && Notification.permission === "granted") new Notification("DreamScape", { body: msg });
    }
  }, [p, tick]);

  const locked = !!p?.night_lock_enabled && Date.now() > snoozeUntil &&
    inWindow(nowMin(), toMin(p.target_bedtime), toMin(p.wake_target));

  const snooze = () => {
    const until = Date.now() + 5 * 60000;
    sessionStorage.setItem("nightLockSnooze", String(until));
    setSnoozeUntil(until);
    setTimeout(() => setTick((x) => x + 1), 5 * 60000 + 500);
  };

  return { locked, snooze, wake: p?.wake_target?.slice(0, 5) };
};
