-- Fix ghost batches for genetic 'PRUEBA' in 'Sala Vegetación'
-- This sets their stage to 'completed' so they no longer block deletion.

UPDATE public.batches b
SET stage = 'completed'
FROM public.genetics g, public.rooms r
WHERE b.genetic_id = g.id
  AND b.current_room_id = r.id
  AND g.name = 'PRUEBA'
  AND r.name = 'Sala Vegetación'
  AND b.stage != 'completed';
