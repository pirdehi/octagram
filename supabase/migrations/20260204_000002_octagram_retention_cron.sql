-- Optional: schedule daily deletion of expired runs using pg_cron.
-- This is best-effort: if pg_cron isn't available on your plan, this script will still succeed.

do $$
begin
  -- pg_cron may not be available on all plans; swallow errors.
  begin
    create extension if not exists pg_cron;
  exception when others then
    raise notice 'pg_cron extension not available; skipping schedule.';
  end;

  -- If cron is available, schedule the cleanup (UTC 03:00 daily).
  begin
    perform cron.schedule(
      'octagram_delete_expired_runs_daily',
      '0 3 * * *',
      $$select public.delete_expired_runs();$$
    );
  exception when others then
    raise notice 'Unable to schedule cron job; you can schedule delete_expired_runs manually.';
  end;
end $$;

