DO $$ 
DECLARE
  v_res JSONB;
BEGIN
  v_res := execute_growy_batch(
    '00d0c36b-287e-40af-bef5-e01614db2ed3'::UUID, -- Example Org ID
    'b4c6e910-c0be-4b95-a226-ebc62e51fc43'::UUID, -- Example User ID
    '[{"name": "create_room_sticky", "args": {"content": "Test direct RPC", "color": "yellow", "roomId": "21e285a7-ab98-490c-ad3a-3cff532fa74d"}}]'::JSONB
  );
  RAISE NOTICE 'SUCCESS: %', v_res;
END $$;
