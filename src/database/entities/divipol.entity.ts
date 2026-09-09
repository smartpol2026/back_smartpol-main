import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('divipol')
export class Divipol {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  departamento: string;

  @Column()
  municipio: string;

  @Column()
  puesto: number;

  @Column()
  mesa: number;

  @Column()
  total_por_mesa: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
