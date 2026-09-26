ALTER TABLE public.profiles
  ADD COLUMN target_bedtime time NOT NULL DEFAULT '22:30',
  ADD COLUMN reminder_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN reminder_minutes integer NOT NULL DEFAULT 30 CHECK (reminder_minutes BETWEEN 0 AND 120),
  ADD COLUMN night_lock_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN wake_target time NOT NULL DEFAULT '06:30';