-- Add foreign key constraint to member_id linking it to profiles
ALTER TABLE chakra_dispensary_movements
ADD CONSTRAINT chakra_dispensary_movements_member_id_fkey
FOREIGN KEY (member_id)
REFERENCES profiles(id)
ON DELETE SET NULL;
