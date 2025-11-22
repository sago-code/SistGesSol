import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, DeleteDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Token {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    token!: string;

    @ManyToOne(() => User, user => user.token)
    user!: User;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deletedAt?: Date;
}