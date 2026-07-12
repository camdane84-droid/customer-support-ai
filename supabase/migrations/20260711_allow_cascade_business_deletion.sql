-- The last-owner guard on business_members fired for EVERY delete, including
-- the ON DELETE CASCADE from businesses. That made it impossible to delete a
-- business (or an account that owns one): the cascade hit the sole owner row,
-- raised, and aborted the whole statement — /api/account/delete has been
-- silently broken for owners because of this.
--
-- The guard now only protects member management on businesses that still
-- exist. When the business row is already gone (cascade), the member rows may
-- follow it.
CREATE OR REPLACE FUNCTION prevent_last_owner_removal()
RETURNS TRIGGER AS $$
DECLARE
  owner_count INTEGER;
BEGIN
  -- Only check if deleting an owner
  IF OLD.role = 'owner' THEN
    -- Business already deleted → this is the cascade cleaning up; allow it
    IF NOT EXISTS (SELECT 1 FROM businesses WHERE id = OLD.business_id) THEN
      RETURN OLD;
    END IF;

    SELECT COUNT(*) INTO owner_count
    FROM business_members
    WHERE business_id = OLD.business_id
    AND role = 'owner'
    AND id != OLD.id;

    IF owner_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last owner from a business';
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;
