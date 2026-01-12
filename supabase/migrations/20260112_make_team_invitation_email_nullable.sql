-- Make email column nullable in team_invitations table to support generic invite links
ALTER TABLE team_invitations ALTER COLUMN email DROP NOT NULL;
