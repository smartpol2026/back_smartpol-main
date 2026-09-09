import { PartialType } from '@nestjs/swagger';
import { CreateVotingBoothDto } from './create-voting-booth.dto';

export class UpdateVotingBoothDto extends PartialType(CreateVotingBoothDto) {}