-- Add createdByUserId column to voters_history table
ALTER TABLE public.voters_history
ADD COLUMN "createdByUserId" integer;

-- Create index for faster queries
CREATE INDEX idx_voters_history_created_by_user_id ON public.voters_history("createdByUserId");

-- Drop existing trigger and function to update them
DROP TRIGGER IF EXISTS trigger_log_new_voter ON public.voters;
DROP FUNCTION IF EXISTS public.log_new_voter_to_history();

-- Create updated trigger function to log new voters with createdByUserId
CREATE OR REPLACE FUNCTION public.log_new_voter_to_history()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.voters_history (
        "firstName",
        "lastName",
        identification,
        gender,
        "bloodType",
        "birthDate",
        phone,
        neighborhood,
        email,
        occupation,
        "politicalStatus",
        address,
        "departmentId",
        "municipalityId",
        "votingBoothId",
        "votingTableId",
        "createdAt",
        "createdByUserId",
        "recordedAt"
    ) VALUES (
        NEW."firstName",
        NEW."lastName",
        NEW.identification,
        NEW.gender,
        NEW."bloodType",
        NEW."birthDate",
        NEW.phone,
        NEW.neighborhood,
        NEW.email,
        NEW.occupation,
        NEW."politicalStatus",
        NEW.address,
        NEW."departmentId",
        NEW."municipalityId",
        NEW."votingBoothId",
        NEW."votingTableId",
        NEW."createdAt",
        NEW."createdByUserId",
        CURRENT_TIMESTAMP
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on voters table
CREATE TRIGGER trigger_log_new_voter
AFTER INSERT ON public.voters
FOR EACH ROW
EXECUTE FUNCTION public.log_new_voter_to_history();
