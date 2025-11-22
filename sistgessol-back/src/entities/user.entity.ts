// Clase: User
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { UserRol } from './userRol.entity';
import { Token } from './token.entity';
import { Solicitud } from './solicitudes.entity';
import { SolicitudRespuesta } from './solicitudRespuesta.entity';
import { SolicitudHistorialEstado } from './solicitudHistorialEstado.entity';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 50 })
    firstName: string;

    @Column({ type: 'varchar', length: 50 })
    lastName: string;

    @Column({ unique: true })
    email: string;
    
    @Column({ type: 'varchar', length: 20, unique: true })
    phone: string;

    @Column({ type: 'varchar', length: 255, select: false })
    password: string;

    @OneToMany(() => Token, token => token.user)
    token!: Token[];

    @CreateDateColumn({ type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updatedAt!: Date;

    @DeleteDateColumn({ type: 'timestamp', nullable: true })
    deletedAt!: Date;

    @OneToMany(() => UserRol, (userRol) => userRol.user)
    userRoles: UserRol[];

    @OneToMany(() => Solicitud, (solicitud) => solicitud.cliente)
    solicitudesCreadas: Solicitud[];

    @OneToMany(() => Solicitud, (solicitud) => solicitud.soporte)
    solicitudesAsignadas: Solicitud[];

    @OneToMany(() => SolicitudRespuesta, (respuesta) => respuesta.autor)
    solicitudRespuestas: SolicitudRespuesta[];

    @OneToMany(() => SolicitudHistorialEstado, (hist) => hist.autor)
    solicitudHistorialEstados: SolicitudHistorialEstado[];

    @OneToMany(() => SolicitudHistorialEstado, (hist) => hist.soporte)
    solicitudHistorialEstadosComoSoporte: SolicitudHistorialEstado[];
}
