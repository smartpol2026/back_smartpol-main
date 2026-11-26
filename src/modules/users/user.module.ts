import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { CampaignUser } from '../../database/entities/campaign-user.entity';
import { Role } from '../../database/entities/role.entity';
import { Campaign } from '../../database/entities/campaigns.entity';
import { WitnessTableAssignment } from '../../database/entities/witness-table-assignment.entity';
import { VotingBooth } from '../../database/entities/voting-booth.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      CampaignUser,
      Role,
      Campaign,
      WitnessTableAssignment,
      VotingBooth,
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
