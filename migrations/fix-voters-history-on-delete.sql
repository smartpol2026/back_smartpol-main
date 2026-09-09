-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_log_new_voter ON public.voters;
DROP FUNCTION IF EXISTS public.log_new_voter_to_history();

-- Drop existing table
DROP TABLE IF EXISTS public.voters_history;

-- Create voters history table (simple clone, no relationships)
CREATE TABLE public.voters_history (
    id SERIAL PRIMARY KEY,
    "firstName" character varying NOT NULL,
    "lastName" character varying NOT NULL,
    identification character varying NOT NULL,
    gender character varying,
    "bloodType" character varying,
    "birthDate" date,
    phone character varying,
    neighborhood character varying,
    email character varying,
    occupation character varying,
    "politicalStatus" character varying,
    address character varying,
    "departmentId" integer,
    "municipalityId" integer,
    "votingBoothId" integer,
    "votingTableId" character varying,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "recordedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_voters_history_identification ON public.voters_history(identification);
CREATE INDEX idx_voters_history_recorded_at ON public.voters_history("recordedAt");

-- Create trigger function to log new voters to history
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
