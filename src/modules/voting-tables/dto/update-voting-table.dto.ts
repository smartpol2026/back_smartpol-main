import { PartialType } from '@nestjs/swagger';
import { CreateVotingTableDto } from './create-voting-table.dto';

export class UpdateVotingTableDto extends PartialType(CreateVotingTableDto) {}