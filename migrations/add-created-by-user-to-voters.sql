-- Add createdByUserId column to voters table
ALTER TABLE public.voters
ADD COLUMN "createdByUserId" integer;

-- Add foreign key constraint to users table
ALTER TABLE public.voters
ADD CONSTRAINT fk_voters_created_by_user_id 
FOREIGN KEY ("createdByUserId") REFERENCES public.users(id) ON DELETE SET NULL;

-- Create index for faster queries
CREATE INDEX idx_voters_created_by_user_id ON public.voters("createdByUserId");
