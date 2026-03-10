CREATE OR REPLACE FUNCTION clear_test_metrics(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Borrar gastos explícitos
  DELETE FROM chakra_expenses WHERE organization_id = p_org_id;
  
  -- 2. Borrar extracciones de laboratorio
  DELETE FROM chakra_extractions WHERE organization_id = p_org_id;
  
  -- 3. Borrar el historial de auditoría
  DELETE FROM audit_logs WHERE organization_id = p_org_id;

  -- 4. Borrar tareas ligadas a los lotes (si existe la relación)
  -- Nota: Asumimos que la tabla se llama 'tasks', si es un foreign key a batch_id
  DELETE FROM tasks WHERE batch_id IN (SELECT id FROM batches WHERE organization_id = p_org_id);

  -- 5. Borrar notas ligadas a los lotes
  -- Nota: Asumimos que la tabla se llama 'stickies'
  DELETE FROM stickies WHERE batch_id IN (SELECT id FROM batches WHERE organization_id = p_org_id);

  -- 6. Finalmente, borrar todos los lotes
  DELETE FROM batches WHERE organization_id = p_org_id;
  
END;
$$;
