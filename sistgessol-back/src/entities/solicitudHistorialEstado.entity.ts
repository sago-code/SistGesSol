import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Solicitud } from './solicitudes.entity';
import { SolicitudEstado } from './solicitudEstado.entity';
import { User } from './user.entity';

@Entity({ name: 'solicitud_historial_estados' })
export class SolicitudHistorialEstado {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    solicitudId: number;

    @ManyToOne(() => Solicitud)
    @JoinColumn({ name: 'solicitudId' })
    solicitud: Solicitud;

    @Column()
    estadoId: number;

    @ManyToOne(() => SolicitudEstado)
    @JoinColumn({ name: 'estadoId' })
    estado: SolicitudEstado;

    @Column()
    autorUserId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'autorUserId' })
    autor: User;

    @Column({ type: 'text', nullable: true })
    comentario: string | null;

    @Column({ nullable: true })
    soporteId: number | null;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'soporteId' })
    soporte: User | null;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deletedAt: Date | null;
}