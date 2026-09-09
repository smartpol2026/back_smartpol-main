export class VoterSearchByIdentificationDto {
  // Status can be 'assigned', 'in_history', or 'not_found'
  // - assigned: voter exists with assignments in user's organization
  // - in_history: voter exists only in history table (allow autocomplete)
  // - not_found: voter doesn't exist anywhere or exists but in other org (allow creation)
  status: 'assigned' | 'in_history' | 'not_found';

  // If status is 'assigned', these fields will be populated
  voter?: {
    id: number;
    firstName: string;
    lastName: string;
    identification: string;
    gender: string;
    bloodType: string;
    birthDate: Date;
    phone: string;
    address: string;
    departmentId: number;
    municipalityId: number;
    neighborhood: string;
    email: string;
    occupation: string;
    votingBoothId: number;
    votingTableId: string;
    politicalStatus: string;
    hasVoted: boolean;
  };

  // If status is 'assigned', this field will be populated
  assignedLeader?: {
    id: number;
    name: string;
    document: string;
    municipality: string;
    phone: string;
  };

  // If status is 'assigned', this field will be populated
  assignedCandidates?: Array<{
    id: number;
    name: string;
    party: string;
    number: number;
    organizationId: number | null;
    campaignName: string;
  }>;

  // If status is 'in_history', these fields will be populated with data from voters_history
  votersHistoryData?: {
    firstName: string;
    lastName: string;
    identification: string;
    gender: string;
    bloodType: string;
    birthDate: Date;
    phone: string;
    address: string;
    departmentId: number;
    municipalityId: number;
    neighborhood: string;
    email: string;
    occupation: string;
    votingBoothId: number;
    votingTableId: string;
    politicalStatus: string;
  };

  message?: string;
}
