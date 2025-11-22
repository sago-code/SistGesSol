import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Solicitud } from './solicitudes.entity';
import { User } from './user.entity';

@Entity({ name: 'solicitud_respuestas' })
export class SolicitudRespuesta {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    solicitudId: number;

    @ManyToOne(() => Solicitud)
    @JoinColumn({ name: 'solicitudId' })
    solicitud: Solicitud;

    @Column()
    autorUserId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'autorUserId' })
    autor: User;

    @Column({ type: 'text' })
    contenido: string;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deletedAt: Date;
}