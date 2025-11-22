// Clase: Solicitud
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { SolicitudEstado } from './solicitudEstado.entity';
import { SolicitudRespuesta } from './solicitudRespuesta.entity';
import { SolicitudHistorialEstado } from './solicitudHistorialEstado.entity';

@Entity({ name: 'solicitudes' })
export class Solicitud {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 255 })
    tittle: string;

    @Column({ length: 255 })
    description: string;

    @Column()
    estadoId: number;

    @ManyToOne(() => SolicitudEstado)
    @JoinColumn({ name: 'estadoId' })
    estado: SolicitudEstado;

    
    @Column()
    clienteId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'clienteId' })
    cliente: User;

    @Column({ nullable: true })
    soporteId: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'soporteId' })
    soporte: User;

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt: Date;

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deletedAt: Date;

    @OneToMany(() => SolicitudRespuesta, (respuesta) => respuesta.solicitud)
    respuestas: SolicitudRespuesta[];

    @OneToMany(() => SolicitudHistorialEstado, (hist) => hist.solicitud)
    historialEstados: SolicitudHistorialEstado[];
}