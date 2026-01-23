-- Drop the existing restrictive foreign key
ALTER TABLE post_drafts 
DROP CONSTRAINT IF EXISTS post_drafts_image_asset_id_fkey;

-- Recreate with ON DELETE SET NULL behavior
-- When an asset is deleted, any drafts referencing it will have their image_asset_id set to NULL
ALTER TABLE post_drafts 
ADD CONSTRAINT post_drafts_image_asset_id_fkey 
FOREIGN KEY (image_asset_id) 
REFERENCES assets(id) 
ON DELETE SET NULL;