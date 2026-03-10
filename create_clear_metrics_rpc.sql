-- Function to completely clear all test metrics, batches, and expenses for a specific organization
CREATE OR REPLACE FUNCTION clear_test_metrics(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Delete all expenses for the organization
  DELETE FROM expenses WHERE organization_id = p_org_id;
  
  -- 2. Delete all audit logs (this clears mortality records and history)
  DELETE FROM audit_logs WHERE organization_id = p_org_id;

  -- 3. Delete all batches (this relies on your schema's ON DELETE CASCADE for related tasks/stickies)
  --    If ON DELETE CASCADE is missing on certain tables referencing batches, this might fail.
  --    In that case, delete them explicitly first.
  DELETE FROM batch_tasks WHERE batch_id IN (SELECT id FROM batches WHERE organization_id = p_org_id);
  DELETE FROM batches WHERE organization_id = p_org_id;
  
  -- 4. Delete the monthly metrics cache for the organization
  DELETE FROM monthly_metrics WHERE organization_id = p_org_id;

  -- (Optional) If you also want to delete all rooms and clone maps to start 100% fresh, uncomment below:
  -- DELETE FROM clone_maps WHERE room_id IN (SELECT id FROM rooms WHERE organization_id = p_org_id);
  -- DELETE FROM rooms WHERE organization_id = p_org_id;

END;
$$;
