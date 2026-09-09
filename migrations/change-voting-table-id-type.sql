-- Change votingTableId column from INTEGER to VARCHAR
ALTER TABLE voters
ALTER COLUMN "votingTableId" TYPE varchar(255);
