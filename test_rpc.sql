DO $$ 
DECLARE
  v_res JSONB;
BEGIN
  v_res := execute_growy_batch(
    '00000000-0000-0000-0000-000000000000'::UUID, -- dummy org id
    '00000000-0000-0000-0000-000000000000'::UUID, -- dummy profile id
    '[{"name": "create_room_sticky", "args": {"content": "Test", "color": "yellow", "roomId": "00000000-0000-0000-0000-000000000000"}}]'::JSONB
  );
  RAISE NOTICE '%', v_res;
END $$;
