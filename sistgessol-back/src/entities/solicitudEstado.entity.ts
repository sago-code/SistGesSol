// Clase: SolicitudEstado
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { Solicitud } from './solicitudes.entity';
import { SolicitudHistorialEstado } from './solicitudHistorialEstado.entity';

@Entity({ name: 'solicitud_estados' })
export class SolicitudEstado {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 30, unique: true })
    code: string;

    @Column({ type: 'varchar', length: 50 })
    name: string;

    @Column({ type: 'int', default: 0 })
    order: number;

    @Column({ type: 'boolean', default: false })
    isFinal: boolean;

    @OneToMany(() => Solicitud, (solicitud) => solicitud.estado)
    solicitudes: Solicitud[];

    @OneToMany(() => SolicitudHistorialEstado, (hist) => hist.estado)
    historialEstados: SolicitudHistorialEstado[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deletedAt: Date;
}