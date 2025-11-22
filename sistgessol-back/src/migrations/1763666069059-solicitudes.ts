import { MigrationInterface, QueryRunner } from "typeorm";

export class Solicitudes1763666069059 implements MigrationInterface {
    name = 'Solicitudes1763666069059'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`solicitud_historial_estados\` (\`id\` int NOT NULL AUTO_INCREMENT, \`solicitudId\` int NOT NULL, \`estadoId\` int NOT NULL, \`autorUserId\` int NOT NULL, \`comentario\` text NULL, \`soporteId\` int NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`solicitud_estados\` (\`id\` int NOT NULL AUTO_INCREMENT, \`code\` varchar(30) NOT NULL, \`name\` varchar(50) NOT NULL, \`order\` int NOT NULL DEFAULT '0', \`isFinal\` tinyint NOT NULL DEFAULT 0, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, UNIQUE INDEX \`IDX_752aeef5de5d83bc3d8ac718cd\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`solicitud_respuestas\` (\`id\` int NOT NULL AUTO_INCREMENT, \`solicitudId\` int NOT NULL, \`autorUserId\` int NOT NULL, \`contenido\` text NOT NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`solicitudes\` (\`id\` int NOT NULL AUTO_INCREMENT, \`tittle\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, \`estadoId\` int NOT NULL, \`clienteId\` int NOT NULL, \`soporteId\` int NULL, \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` timestamp(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`token\` DROP FOREIGN KEY \`FK_94f168faad896c0786646fa3d4a\``);
        await queryRunner.query(`ALTER TABLE \`token\` CHANGE \`createdAt\` \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE \`token\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`token\` CHANGE \`userId\` \`userId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_472b25323af01488f1f66a06b67\``);
        await queryRunner.query(`ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_1655726bef24a1949216c6b5d91\``);
        await queryRunner.query(`ALTER TABLE \`user_roles\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`user_roles\` CHANGE \`userId\` \`userId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`user_roles\` CHANGE \`rolId\` \`rolId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`roles\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`token\` ADD CONSTRAINT \`FK_94f168faad896c0786646fa3d4a\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`solicitud_historial_estados\` ADD CONSTRAINT \`FK_0de04632985f6d3b2d966c74455\` FOREIGN KEY (\`solicitudId\`) REFERENCES \`solicitudes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`solicitud_historial_estados\` ADD CONSTRAINT \`FK_efa82268798587dc26df02b3478\` FOREIGN KEY (\`estadoId\`) REFERENCES \`solicitud_estados\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`solicitud_historial_estados\` ADD CONSTRAINT \`FK_5da3a417265f33247e12dcb8422\` FOREIGN KEY (\`autorUserId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`solicitud_historial_estados\` ADD CONSTRAINT \`FK_ed2390395079267bad60cc6f96e\` FOREIGN KEY (\`soporteId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`solicitud_respuestas\` ADD CONSTRAINT \`FK_fdc98e59be33dbd2ac7edc51980\` FOREIGN KEY (\`solicitudId\`) REFERENCES \`solicitudes\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`solicitud_respuestas\` ADD CONSTRAINT \`FK_69ad59de9e5edd2252618813c38\` FOREIGN KEY (\`autorUserId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`solicitudes\` ADD CONSTRAINT \`FK_1a38dcf37f2498453aa38462a57\` FOREIGN KEY (\`estadoId\`) REFERENCES \`solicitud_estados\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`solicitudes\` ADD CONSTRAINT \`FK_8647c62a4fb649befc52fc26622\` FOREIGN KEY (\`clienteId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`solicitudes\` ADD CONSTRAINT \`FK_496f1786260a757501756e7744e\` FOREIGN KEY (\`soporteId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_roles\` ADD CONSTRAINT \`FK_472b25323af01488f1f66a06b67\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_roles\` ADD CONSTRAINT \`FK_1655726bef24a1949216c6b5d91\` FOREIGN KEY (\`rolId\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_1655726bef24a1949216c6b5d91\``);
        await queryRunner.query(`ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_472b25323af01488f1f66a06b67\``);
        await queryRunner.query(`ALTER TABLE \`solicitudes\` DROP FOREIGN KEY \`FK_496f1786260a757501756e7744e\``);
        await queryRunner.query(`ALTER TABLE \`solicitudes\` DROP FOREIGN KEY \`FK_8647c62a4fb649befc52fc26622\``);
        await queryRunner.query(`ALTER TABLE \`solicitudes\` DROP FOREIGN KEY \`FK_1a38dcf37f2498453aa38462a57\``);
        await queryRunner.query(`ALTER TABLE \`solicitud_respuestas\` DROP FOREIGN KEY \`FK_69ad59de9e5edd2252618813c38\``);
        await queryRunner.query(`ALTER TABLE \`solicitud_respuestas\` DROP FOREIGN KEY \`FK_fdc98e59be33dbd2ac7edc51980\``);
        await queryRunner.query(`ALTER TABLE \`solicitud_historial_estados\` DROP FOREIGN KEY \`FK_ed2390395079267bad60cc6f96e\``);
        await queryRunner.query(`ALTER TABLE \`solicitud_historial_estados\` DROP FOREIGN KEY \`FK_5da3a417265f33247e12dcb8422\``);
        await queryRunner.query(`ALTER TABLE \`solicitud_historial_estados\` DROP FOREIGN KEY \`FK_efa82268798587dc26df02b3478\``);
        await queryRunner.query(`ALTER TABLE \`solicitud_historial_estados\` DROP FOREIGN KEY \`FK_0de04632985f6d3b2d966c74455\``);
        await queryRunner.query(`ALTER TABLE \`token\` DROP FOREIGN KEY \`FK_94f168faad896c0786646fa3d4a\``);
        await queryRunner.query(`ALTER TABLE \`roles\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`user_roles\` CHANGE \`rolId\` \`rolId\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`user_roles\` CHANGE \`userId\` \`userId\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`user_roles\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`user_roles\` ADD CONSTRAINT \`FK_1655726bef24a1949216c6b5d91\` FOREIGN KEY (\`rolId\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user_roles\` ADD CONSTRAINT \`FK_472b25323af01488f1f66a06b67\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`token\` CHANGE \`userId\` \`userId\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`token\` CHANGE \`deletedAt\` \`deletedAt\` timestamp(6) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`token\` CHANGE \`createdAt\` \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`token\` ADD CONSTRAINT \`FK_94f168faad896c0786646fa3d4a\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`DROP TABLE \`solicitudes\``);
        await queryRunner.query(`DROP TABLE \`solicitud_respuestas\``);
        await queryRunner.query(`DROP INDEX \`IDX_752aeef5de5d83bc3d8ac718cd\` ON \`solicitud_estados\``);
        await queryRunner.query(`DROP TABLE \`solicitud_estados\``);
        await queryRunner.query(`DROP TABLE \`solicitud_historial_estados\``);
    }

}
