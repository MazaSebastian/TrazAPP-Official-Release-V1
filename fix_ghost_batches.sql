-- Fix ghost batches for genetic '111asd' in 'Campo 1'
-- This sets their stage to 'completed' so they no longer block deletion.

UPDATE public.batches b
SET stage = 'completed'
FROM public.genetics g, public.rooms r
WHERE b.genetic_id = g.id
  AND b.current_room_id = r.id
  AND g.name = '111asd'
  AND r.name = 'Campo 1'
  AND b.stage != 'completed';
