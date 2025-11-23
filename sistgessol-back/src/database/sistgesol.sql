-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 23-11-2025 a las 05:57:01
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sistgesol`
--

DELIMITER $$
--
-- Procedimientos
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_asignar_soporte_solicitud` (IN `p_solicitud_id` INT, IN `p_soporte_id` INT, IN `p_autor_user_id` INT, IN `p_comentario` TEXT, IN `p_estado_code` VARCHAR(30))   BEGIN
  DECLARE v_msg TEXT;
  DECLARE v_estado_code VARCHAR(30);
  DECLARE v_estado_id INT;
  DECLARE v_old_soporte_id INT;
  DECLARE v_is_final BOOLEAN;

  IF p_solicitud_id IS NULL THEN
    SET v_msg = 'Debe proporcionar p_solicitud_id';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
  END IF;

  IF p_soporte_id IS NULL THEN
    SET v_msg = 'Debe proporcionar p_soporte_id';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
  END IF;

  IF p_autor_user_id IS NULL THEN
    SET v_msg = 'Debe proporcionar p_autor_user_id';
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
  END IF;

  SET v_estado_code = NULLIF(TRIM(p_estado_code), '');
  IF v_estado_code IS NULL THEN
    SET v_estado_code = 'ASIGNADA';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM solicitudes WHERE id = p_solicitud_id AND deletedAt IS NULL) THEN
    SET v_msg = CONCAT('Solicitud ', p_solicitud_id, ' no existe o fue eliminada');
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_soporte_id AND deletedAt IS NULL) THEN
    SET v_msg = CONCAT('Soporte ', p_soporte_id, ' no existe o fue eliminado');
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
  END IF;

  SELECT id INTO v_estado_id
  FROM solicitud_estados
  WHERE code = v_estado_code AND deletedAt IS NULL
  LIMIT 1;

  IF v_estado_id IS NULL THEN
    SET v_msg = CONCAT('Estado "', v_estado_code, '" no existe en solicitud_estados');
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
  END IF;

  START TRANSACTION;

  SELECT s.soporteId, se.isFinal
    INTO v_old_soporte_id, v_is_final
  FROM solicitudes s
  JOIN solicitud_estados se ON se.id = s.estadoId
  WHERE s.id = p_solicitud_id
  FOR UPDATE;

  IF v_is_final THEN
    SET v_msg = 'No se puede asignar soporte: la solicitud está en un estado final';
    ROLLBACK;
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
  END IF;

  UPDATE solicitudes
     SET soporteId = p_soporte_id,
         estadoId = v_estado_id,
         updatedAt = NOW()
   WHERE id = p_solicitud_id;

  INSERT INTO solicitud_historial_estados
      (solicitudId, estadoId, autorUserId, comentario, soporteId, createdAt, updatedAt)
  VALUES
      (p_solicitud_id, v_estado_id, p_autor_user_id, p_comentario, p_soporte_id, NOW(), NOW());

  COMMIT;

  SELECT
    s.id AS solicitudId,
    v_estado_id AS estadoId,
    v_estado_code AS estadoCode,
    s.soporteId AS soporteId,
    v_old_soporte_id AS oldSoporteId,
    s.clienteId AS clienteId
  FROM solicitudes s
  WHERE s.id = p_solicitud_id
  LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_cambiar_estado_solicitud` (IN `p_solicitud_id` INT, IN `p_estado_code` VARCHAR(30), IN `p_autor_user_id` INT, IN `p_comentario` TEXT, IN `p_respuesta_contenido` TEXT)   BEGIN
    DECLARE v_msg TEXT;
    DECLARE v_estado_code VARCHAR(30);
    DECLARE v_estado_id INT;
    DECLARE v_is_final_actual BOOLEAN;
    DECLARE v_estado_id_actual INT;
    DECLARE v_soporte_id_actual INT;
    DECLARE v_respuesta_id INT DEFAULT NULL;

    IF p_solicitud_id IS NULL THEN
        SET v_msg = 'Debe proporcionar p_solicitud_id';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    SET v_estado_code = UPPER(NULLIF(TRIM(p_estado_code), ''));
    IF v_estado_code IS NULL THEN
        SET v_msg = 'Debe proporcionar p_estado_code';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    IF v_estado_code NOT IN ('EN_PROCESO', 'RESUELTA', 'CERRADA') THEN
        SET v_msg = CONCAT('Estado "', v_estado_code, '" no es permitido. Use EN_PROCESO, RESUELTA o CERRADA');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    IF p_autor_user_id IS NULL THEN
        SET v_msg = 'Debe proporcionar p_autor_user_id';
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM solicitudes WHERE id = p_solicitud_id AND deletedAt IS NULL) THEN
        SET v_msg = CONCAT('Solicitud ', p_solicitud_id, ' no existe o fue eliminada');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_autor_user_id AND deletedAt IS NULL) THEN
        SET v_msg = CONCAT('Autor ', p_autor_user_id, ' no existe o fue eliminado');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    SELECT id INTO v_estado_id
      FROM solicitud_estados
     WHERE code = v_estado_code AND deletedAt IS NULL
     LIMIT 1;

    IF v_estado_id IS NULL THEN
        SET v_msg = CONCAT('Estado "', v_estado_code, '" no existe en solicitud_estados');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    START TRANSACTION;

    SELECT s.estadoId, s.soporteId, se.isFinal
      INTO v_estado_id_actual, v_soporte_id_actual, v_is_final_actual
      FROM solicitudes s
      JOIN solicitud_estados se ON se.id = s.estadoId
     WHERE s.id = p_solicitud_id
     FOR UPDATE;

    IF v_is_final_actual THEN
        SET v_msg = 'No se puede cambiar estado: la solicitud está en un estado final';
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    IF v_estado_id_actual = v_estado_id THEN
        SET v_msg = CONCAT('La solicitud ya está en el estado "', v_estado_code, '"');
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    IF v_estado_code = 'EN_PROCESO' AND v_soporte_id_actual IS NULL THEN
        SET v_msg = 'No puede pasar a EN_PROCESO sin soporte asignado';
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    IF v_estado_code IN ('RESUELTA', 'CERRADA') AND (p_respuesta_contenido IS NULL OR TRIM(p_respuesta_contenido) = '') THEN
        SET v_msg = CONCAT('Debe proporcionar p_respuesta_contenido para estado ', v_estado_code);
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    UPDATE solicitudes
       SET estadoId = v_estado_id,
           updatedAt = NOW()
     WHERE id = p_solicitud_id;

    INSERT INTO solicitud_historial_estados
        (solicitudId, estadoId, autorUserId, comentario, soporteId, createdAt, updatedAt)
    VALUES
        (p_solicitud_id, v_estado_id, p_autor_user_id, p_comentario, v_soporte_id_actual, NOW(), NOW());

    IF v_estado_code IN ('RESUELTA', 'CERRADA') THEN
        INSERT INTO solicitud_respuestas
            (solicitudId, autorUserId, contenido, createdAt, updatedAt)
        VALUES
            (p_solicitud_id, p_autor_user_id, p_respuesta_contenido, NOW(), NOW());
        SET v_respuesta_id = LAST_INSERT_ID();
    END IF;

    COMMIT;

    SELECT
        p_solicitud_id AS solicitudId,
        v_estado_id AS estadoId,
        v_estado_code AS estadoCode,
        v_soporte_id_actual AS soporteId,
        v_respuesta_id AS respuestaId;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_cancelar_solicitud` (IN `p_solicitud_id` INT, IN `p_cliente_id` INT, IN `p_comentario` TEXT)   BEGIN
    DECLARE v_estado_id INT;
    DECLARE v_is_final BOOLEAN;
    DECLARE v_estado_code VARCHAR(30);
    DECLARE v_cancelada_id INT;
    DECLARE v_cliente_id INT;

    -- Traer estado actual y validar existencia
    SELECT s.estadoId, se.isFinal, se.code, s.clienteId
      INTO v_estado_id, v_is_final, v_estado_code, v_cliente_id
    FROM solicitudes s
    JOIN solicitud_estados se ON se.id = s.estadoId
    WHERE s.id = p_solicitud_id AND s.deletedAt IS NULL
    LIMIT 1;

    IF v_estado_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solicitud no encontrada';
    END IF;

    -- Validar propiedad del cliente
    IF v_cliente_id IS NULL OR v_cliente_id <> p_cliente_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No puede cancelar una solicitud que no le pertenece';
    END IF;

    -- Validar estado
    IF v_is_final THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se puede cancelar una solicitud en estado final';
    END IF;

    IF v_estado_code = 'CANCELADA' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La solicitud ya está cancelada';
    END IF;

    -- Obtener id del estado CANCELADA
    SELECT id INTO v_cancelada_id
    FROM solicitud_estados
    WHERE code = 'CANCELADA'
    LIMIT 1;

    IF v_cancelada_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Estado CANCELADA no configurado';
    END IF;

    -- Actualizar estado
    UPDATE solicitudes
       SET estadoId = v_cancelada_id
     WHERE id = p_solicitud_id;

    -- Registrar historial
    INSERT INTO solicitud_historial_estados (solicitudId, estadoId, autorUserId, comentario, createdAt, updatedAt)
    VALUES (p_solicitud_id, v_cancelada_id, p_cliente_id, p_comentario, NOW(), NOW());

    -- Respuesta
    SELECT s.id AS solicitudId, s.estadoId, se.code AS estadoCode, s.soporteId
    FROM solicitudes s
    JOIN solicitud_estados se ON se.id = s.estadoId
    WHERE s.id = p_solicitud_id
    LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_crear_solicitud` (IN `p_cliente_id` INT, IN `p_tittle` VARCHAR(255), IN `p_description` VARCHAR(255), IN `p_estado_code` VARCHAR(50), IN `p_autor_user_id` INT, IN `p_comentario` TEXT)   BEGIN
    -- Declaraciones al inicio
    DECLARE v_estado_id INT;
    DECLARE v_solicitud_id INT;
    DECLARE v_autor_id INT;
    DECLARE v_msg VARCHAR(255);

    -- Handler de errores para rollback
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error en sp_crear_solicitud';
    END;

    -- Defaults
    IF p_estado_code IS NULL OR p_estado_code = '' THEN
        SET p_estado_code = 'CREADA';
    END IF;

    SET v_autor_id = IFNULL(p_autor_user_id, p_cliente_id);

    START TRANSACTION;

    -- Obtener el id del estado por code
    SELECT id INTO v_estado_id
    FROM solicitud_estados
    WHERE code = p_estado_code
    LIMIT 1;

    IF v_estado_id IS NULL THEN
        SET v_msg = CONCAT('Estado ', p_estado_code, ' no encontrado en solicitud_estados');
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = v_msg;
    END IF;

    -- Insertar solicitud con soporteId = NULL por defecto
    INSERT INTO solicitudes (
        tittle,
        description,
        estadoId,
        clienteId,
        soporteId,
        createdAt,
        updatedAt
    ) VALUES (
        p_tittle,
        p_description,
        v_estado_id,
        p_cliente_id,
        NULL,
        NOW(),
        NOW()
    );

    SET v_solicitud_id = LAST_INSERT_ID();

    -- Insertar historial inicial de estado
    INSERT INTO solicitud_historial_estados (
        solicitudId,
        estadoId,
        autorUserId,
        comentario,
        createdAt,
        updatedAt
    ) VALUES (
        v_solicitud_id,
        v_estado_id,
        v_autor_id,
        p_comentario,
        NOW(),
        NOW()
    );

    COMMIT;

    -- Devolver el id creado
    SELECT v_solicitud_id AS solicitudId;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_create_user` (IN `p_first_name` VARCHAR(50), IN `p_last_name` VARCHAR(50), IN `p_email` VARCHAR(255), IN `p_phone` INT, IN `p_password_hash` VARCHAR(255), IN `p_role_id` INT)   BEGIN
    DECLARE v_user_id INT;
    DECLARE v_exists INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    IF p_role_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'RoleId es requerido';
    END IF;

    SELECT COUNT(*) INTO v_exists FROM roles WHERE id = p_role_id;
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Role no funciona';
    END IF;

    SELECT COUNT(*) INTO v_exists FROM users WHERE email = p_email;
    IF v_exists > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email ya registrado';
    END IF;

    -- Si la columna users.phone es VARCHAR(20), comparamos como texto
    SELECT COUNT(*) INTO v_exists FROM users WHERE phone = CAST(p_phone AS CHAR);
    IF v_exists > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Telefono ya registrado';
    END IF;

    -- Inserta usuario (password ya hasheada). Si users.phone es INT, puedes usar p_phone directamente.
    INSERT INTO users (firstName, lastName, email, phone, password)
    VALUES (p_first_name, p_last_name, p_email, CAST(p_phone AS CHAR), p_password_hash);

    SET v_user_id = LAST_INSERT_ID();

    INSERT INTO user_roles (userId, rolId)
    VALUES (v_user_id, p_role_id);

    COMMIT;

    SELECT * FROM users WHERE id = v_user_id;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_estadisticas_solicitudes_por_cliente` (IN `p_user_id` INT)   BEGIN
    DECLARE v_total_cliente INT DEFAULT 0;
    DECLARE v_total_global INT DEFAULT 0;
    DECLARE v_respondidas INT DEFAULT 0;
    DECLARE v_en_proceso INT DEFAULT 0;
    DECLARE v_sin_respuesta INT DEFAULT 0;

    -- Totales
    SELECT COUNT(*) INTO v_total_cliente
      FROM solicitudes s
     WHERE s.clienteId = p_user_id AND s.deletedAt IS NULL;

    SELECT COUNT(*) INTO v_total_global
      FROM solicitudes s
     WHERE s.deletedAt IS NULL;

    -- Respondidas (tienen al menos una respuesta)
    SELECT COUNT(DISTINCT s.id) INTO v_respondidas
      FROM solicitudes s
      JOIN solicitud_respuestas sr ON sr.solicitudId = s.id AND sr.deletedAt IS NULL
     WHERE s.clienteId = p_user_id AND s.deletedAt IS NULL;

    -- En proceso
    SELECT COUNT(*) INTO v_en_proceso
      FROM solicitudes s
      JOIN solicitud_estados se ON se.id = s.estadoId
     WHERE s.clienteId = p_user_id
       AND s.deletedAt IS NULL
       AND se.code = 'EN_PROCESO';

    -- Sin respuesta (CREADA o ASIGNADA y sin respuestas)
    SELECT COUNT(*) INTO v_sin_respuesta
      FROM solicitudes s
      JOIN solicitud_estados se ON se.id = s.estadoId
      LEFT JOIN solicitud_respuestas sr
             ON sr.solicitudId = s.id AND sr.deletedAt IS NULL
     WHERE s.clienteId = p_user_id
       AND s.deletedAt IS NULL
       AND sr.id IS NULL
       AND se.code IN ('CREADA', 'ASIGNADA');

    SELECT
        v_respondidas AS respondidas,
        v_en_proceso AS enProceso,
        v_sin_respuesta AS sinRespuesta,
        v_total_cliente AS totalCliente,
        v_total_global AS totalGlobal;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_estadisticas_solicitudes_por_soporte` (IN `p_user_id` INT)   BEGIN
  DECLARE v_resueltas INT DEFAULT 0;
  DECLARE v_asignadas INT DEFAULT 0;
  DECLARE v_en_proceso INT DEFAULT 0;
  DECLARE v_cerradas INT DEFAULT 0;
  DECLARE v_total_resp_soporte INT DEFAULT 0;
  DECLARE v_total_sistema INT DEFAULT 0;
  DECLARE v_total_resp_peers INT DEFAULT 0;
  DECLARE v_asignadas_mi INT DEFAULT 0;
  DECLARE v_asignadas_otros INT DEFAULT 0;
  DECLARE v_eficiencia DECIMAL(10,4) DEFAULT 0;

  SELECT COUNT(*) INTO v_resueltas
  FROM solicitudes s
  JOIN solicitud_estados se ON se.id = s.estadoId
  WHERE s.soporteId = p_user_id AND s.deletedAt IS NULL AND se.code = 'RESUELTA';

  SELECT COUNT(*) INTO v_asignadas
  FROM solicitudes s
  WHERE s.soporteId = p_user_id AND s.deletedAt IS NULL;

  SELECT COUNT(*) INTO v_en_proceso
  FROM solicitudes s
  JOIN solicitud_estados se ON se.id = s.estadoId
  WHERE s.soporteId = p_user_id AND s.deletedAt IS NULL AND se.code = 'EN_PROCESO';

  SELECT COUNT(*) INTO v_cerradas
  FROM solicitudes s
  JOIN solicitud_estados se ON se.id = s.estadoId
  WHERE s.soporteId = p_user_id AND s.deletedAt IS NULL AND se.code = 'CERRADA';

  SELECT COUNT(*) INTO v_total_resp_soporte
  FROM solicitud_respuestas sr
  WHERE sr.autorUserId = p_user_id AND sr.deletedAt IS NULL;

  SELECT COUNT(*) INTO v_total_sistema
  FROM solicitudes s
  WHERE s.deletedAt IS NULL;

  SELECT COUNT(*) INTO v_total_resp_peers
  FROM solicitud_respuestas sr
  JOIN user_roles ur ON ur.userId = sr.autorUserId AND ur.deletedAt IS NULL
  JOIN roles r ON r.id = ur.rolId AND r.deletedAt IS NULL
  WHERE sr.deletedAt IS NULL
    AND r.name = 'User'
    AND sr.autorUserId <> p_user_id;

  SELECT COUNT(*) INTO v_asignadas_mi
  FROM solicitudes s
  WHERE s.deletedAt IS NULL AND s.soporteId = p_user_id;

  SELECT COUNT(*) INTO v_asignadas_otros
  FROM solicitudes s
  WHERE s.deletedAt IS NULL AND s.soporteId IS NOT NULL AND s.soporteId <> p_user_id;

  SET v_eficiencia = IFNULL(v_total_resp_soporte / NULLIF(v_asignadas, 0), 0);

  SELECT
    v_resueltas AS resueltas,
    v_asignadas AS asignadas,
    v_en_proceso AS enProceso,
    v_cerradas AS cerradas,
    v_eficiencia AS eficienciaRespuesta,
    v_total_resp_soporte AS totalRespondidasSoporte,
    v_total_sistema AS totalSolicitudesSistema,
    v_total_resp_peers AS totalRespondidasPeers,
    v_asignadas_mi AS asignadasMi,
    v_asignadas_otros AS asignadasOtros;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_user_by_id` (IN `p_user_id` INT)   BEGIN
  SELECT 
    u.id,
    u.firstName,
    u.lastName,
    u.email,
    ur.rolId AS roleId,
    r.name AS roleName
  FROM users u
  LEFT JOIN user_roles ur
    ON ur.userId = u.id
   AND ur.deletedAt IS NULL
  LEFT JOIN roles r
    ON r.id = ur.rolId
  WHERE u.id = p_user_id
  ORDER BY ur.id ASC
  LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_listar_solicitudes_por_usuario` (IN `p_user_id` INT, IN `p_limit` INT, IN `p_offset` INT, IN `p_search` VARCHAR(255))   BEGIN
    DECLARE v_like VARCHAR(260);
    SET v_like = CONCAT('%', IFNULL(p_search, ''), '%');

    -- Datos paginados
    SELECT
        s.id AS solicitudId,
        s.tittle,
        s.description,
        se.id AS estadoId,
        se.code AS estadoCode,
        se.name AS estadoName,
        s.soporteId,
        s.clienteId AS clientId,
        s.createdAt,
        s.updatedAt,
        r.id AS respuestaId,
        r.contenido AS respuestaContenido,
        r.autorUserId AS respuestaAutorUserId,
        r.createdAt AS respuestaCreatedAt
    FROM solicitudes s
    JOIN solicitud_estados se ON se.id = s.estadoId
    LEFT JOIN (
        SELECT sr.*
        FROM solicitud_respuestas sr
        WHERE sr.deletedAt IS NULL
        ORDER BY sr.createdAt DESC
    ) r ON r.solicitudId = s.id
    WHERE s.clienteId = p_user_id
      AND s.deletedAt IS NULL
      AND (
           p_search IS NULL OR p_search = ''
           OR s.tittle LIKE v_like
           OR s.description LIKE v_like
      )
    ORDER BY s.createdAt DESC
    LIMIT p_limit OFFSET p_offset;

    -- Total
    SELECT COUNT(*) AS total
    FROM solicitudes s
    WHERE s.clienteId = p_user_id
      AND s.deletedAt IS NULL
      AND (
           p_search IS NULL OR p_search = ''
           OR s.tittle LIKE v_like
           OR s.description LIKE v_like
      );
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_listar_solicitudes_soporte` (IN `p_user_id` INT, IN `p_limit` INT, IN `p_offset` INT, IN `p_q` VARCHAR(255), IN `p_filter` VARCHAR(50))   BEGIN
  DECLARE v_q VARCHAR(255);
  DECLARE v_filter VARCHAR(50);

  SET v_q = NULLIF(TRIM(p_q), '');
  SET v_filter = UPPER(NULLIF(TRIM(p_filter), ''));

  IF v_filter = 'CREADAS' THEN
    SELECT
      s.id AS solicitudId,
      s.tittle AS tittle,
      s.description AS description,
      se.code AS estadoCode,
      s.soporteId AS soporteId,
      s.clienteId AS clienteId,
      s.createdAt AS createdAt,
      s.updatedAt AS updatedAt,
      COALESCE(
        (SELECT sr.id FROM solicitud_respuestas sr WHERE sr.solicitudId = s.id AND sr.autorUserId = s.soporteId AND sr.deletedAt IS NULL ORDER BY sr.createdAt DESC LIMIT 1),
        (SELECT sr2.id FROM solicitud_respuestas sr2 WHERE sr2.solicitudId = s.id AND sr2.deletedAt IS NULL ORDER BY sr2.createdAt DESC LIMIT 1)
      ) AS respuestaId,
      COALESCE(
        (SELECT sr.contenido FROM solicitud_respuestas sr WHERE sr.solicitudId = s.id AND sr.autorUserId = s.soporteId AND sr.deletedAt IS NULL ORDER BY sr.createdAt DESC LIMIT 1),
        (SELECT sr2.contenido FROM solicitud_respuestas sr2 WHERE sr2.solicitudId = s.id AND sr2.deletedAt IS NULL ORDER BY sr2.createdAt DESC LIMIT 1)
      ) AS respuestaContenido,
      COALESCE(
        (SELECT sr.createdAt FROM solicitud_respuestas sr WHERE sr.solicitudId = s.id AND sr.autorUserId = s.soporteId AND sr.deletedAt IS NULL ORDER BY sr.createdAt DESC LIMIT 1),
        (SELECT sr2.createdAt FROM solicitud_respuestas sr2 WHERE sr2.solicitudId = s.id AND sr2.deletedAt IS NULL ORDER BY sr2.createdAt DESC LIMIT 1)
      ) AS respuestaCreatedAt,
      (SELECT she.comentario FROM solicitud_historial_estados she WHERE she.solicitudId = s.id AND she.deletedAt IS NULL AND she.comentario IS NOT NULL ORDER BY she.createdAt DESC LIMIT 1) AS ultimoComentario
    FROM solicitudes s
    JOIN solicitud_estados se ON se.id = s.estadoId
    WHERE se.code = 'CREADA'
      AND s.deletedAt IS NULL
      AND (v_q IS NULL OR s.tittle LIKE CONCAT('%', v_q, '%') OR s.description LIKE CONCAT('%', v_q, '%'))
    ORDER BY s.createdAt DESC
    LIMIT p_limit OFFSET p_offset;

    SELECT COUNT(*) AS total
    FROM solicitudes s
    JOIN solicitud_estados se ON se.id = s.estadoId
    WHERE se.code = 'CREADA'
      AND s.deletedAt IS NULL
      AND (v_q IS NULL OR s.tittle LIKE CONCAT('%', v_q, '%') OR s.description LIKE CONCAT('%', v_q, '%'));

  ELSEIF v_filter = 'ASIGNADAS_MIAS' THEN
    SELECT
      s.id AS solicitudId,
      s.tittle AS tittle,
      s.description AS description,
      se.code AS estadoCode,
      s.soporteId AS soporteId,
      s.clienteId AS clienteId,
      s.createdAt AS createdAt,
      s.updatedAt AS updatedAt,
      COALESCE(
        (SELECT sr.id FROM solicitud_respuestas sr WHERE sr.solicitudId = s.id AND sr.autorUserId = s.soporteId AND sr.deletedAt IS NULL ORDER BY sr.createdAt DESC LIMIT 1),
        (SELECT sr2.id FROM solicitud_respuestas sr2 WHERE sr2.solicitudId = s.id AND sr2.deletedAt IS NULL ORDER BY sr2.createdAt DESC LIMIT 1)
      ) AS respuestaId,
      COALESCE(
        (SELECT sr.contenido FROM solicitud_respuestas sr WHERE sr.solicitudId = s.id AND sr.autorUserId = s.soporteId AND sr.deletedAt IS NULL ORDER BY sr.createdAt DESC LIMIT 1),
        (SELECT sr2.contenido FROM solicitud_respuestas sr2 WHERE sr2.solicitudId = s.id AND sr2.deletedAt IS NULL ORDER BY sr2.createdAt DESC LIMIT 1)
      ) AS respuestaContenido,
      COALESCE(
        (SELECT sr.createdAt FROM solicitud_respuestas sr WHERE sr.solicitudId = s.id AND sr.autorUserId = s.soporteId AND sr.deletedAt IS NULL ORDER BY sr.createdAt DESC LIMIT 1),
        (SELECT sr2.createdAt FROM solicitud_respuestas sr2 WHERE sr2.solicitudId = s.id AND sr2.deletedAt IS NULL ORDER BY sr2.createdAt DESC LIMIT 1)
      ) AS respuestaCreatedAt,
      (SELECT she.comentario FROM solicitud_historial_estados she WHERE she.solicitudId = s.id AND she.deletedAt IS NULL AND she.comentario IS NOT NULL ORDER BY she.createdAt DESC LIMIT 1) AS ultimoComentario
    FROM solicitudes s
    JOIN solicitud_estados se ON se.id = s.estadoId
    WHERE s.soporteId = p_user_id
      AND s.deletedAt IS NULL
      AND (v_q IS NULL OR s.tittle LIKE CONCAT('%', v_q, '%') OR s.description LIKE CONCAT('%', v_q, '%'))
    ORDER BY s.createdAt DESC
    LIMIT p_limit OFFSET p_offset;

    SELECT COUNT(*) AS total
    FROM solicitudes s
    JOIN solicitud_estados se ON se.id = s.estadoId
    WHERE s.soporteId = p_user_id
      AND s.deletedAt IS NULL
      AND (v_q IS NULL OR s.tittle LIKE CONCAT('%', v_q, '%') OR s.description LIKE CONCAT('%', v_q, '%'));

  ELSEIF v_filter = 'EN_PROCESO_MIAS' THEN
    SELECT
      s.id AS solicitudId,
      s.tittle AS tittle,
      s.description AS description,
      se.code AS estadoCode,
      s.soporteId AS soporteId,
      s.clienteId AS clienteId,
      s.createdAt AS createdAt,
      s.updatedAt AS updatedAt,
      COALESCE(
        (SELECT sr.id FROM solicitud_respuestas sr WHERE sr.solicitudId = s.id AND sr.autorUserId = s.soporteId AND sr.deletedAt IS NULL ORDER BY sr.createdAt DESC LIMIT 1),
        (SELECT sr2.id FROM solicitud_respuestas sr2 WHERE sr2.solicitudId = s.id AND sr2.deletedAt IS NULL ORDER BY sr2.createdAt DESC LIMIT 1)
      ) AS respuestaId,
      COALESCE(
        (SELECT sr.contenido FROM solicitud_respuestas sr WHERE sr.solicitudId = s.id AND sr.autorUserId = s.soporteId AND sr.deletedAt IS NULL ORDER BY sr.createdAt DESC LIMIT 1),
        (SELECT sr2.contenido FROM solicitud_respuestas sr2 WHERE sr2.solicitudId = s.id AND sr2.deletedAt IS NULL ORDER BY sr2.createdAt DESC LIMIT 1)
      ) AS respuestaContenido,
      COALESCE(
        (SELECT sr.createdAt FROM solicitud_respuestas sr WHERE sr.solicitudId = s.id AND sr.autorUserId = s.soporteId AND sr.deletedAt IS NULL ORDER BY sr.createdAt DESC LIMIT 1),
        (SELECT sr2.createdAt FROM solicitud_respuestas sr2 WHERE sr2.solicitudId = s.id AND sr2.deletedAt IS NULL ORDER BY sr2.createdAt DESC LIMIT 1)
      ) AS respuestaCreatedAt,
      (SELECT she.comentario FROM solicitud_historial_estados she WHERE she.solicitudId = s.id AND she.deletedAt IS NULL AND she.comentario IS NOT NULL ORDER BY she.createdAt DESC LIMIT 1) AS ultimoComentario
    FROM solicitudes s
    JOIN solicitud_estados se ON se.id = s.estadoId
    WHERE se.code = 'EN_PROCESO'
      AND s.deletedAt IS NULL
      AND EXISTS (
        SELECT 1 FROM solicitud_historial_estados she
        WHERE she.solicitudId = s.id
          AND she.estadoId = s.estadoId
          AND she.autorUserId = p_user_id
      )
      AND (v_q IS NULL OR s.tittle LIKE CONCAT('%', v_q, '%') OR s.description LIKE CONCAT('%', v_q, '%'))
    ORDER BY s.createdAt DESC
    LIMIT p_limit OFFSET p_offset;

    SELECT COUNT(*) AS total
    FROM solicitudes s
    JOIN solicitud_estados se ON se.id = s.estadoId
    WHERE se.code = 'EN_PROCESO'
      AND s.deletedAt IS NULL
      AND EXISTS (
        SELECT 1 FROM solicitud_historial_estados she
        WHERE she.solicitudId = s.id
          AND she.estadoId = s.estadoId
          AND she.autorUserId = p_user_id
      )
      AND (v_q IS NULL OR s.tittle LIKE CONCAT('%', v_q, '%') OR s.description LIKE CONCAT('%', v_q, '%'));

  ELSEIF v_filter = 'RESPONDIDAS_MIAS' THEN
    SELECT
      s.id AS solicitudId,
      s.tittle AS tittle,
      s.description AS description,
      se.code AS estadoCode,
      s.soporteId AS soporteId,
      s.clienteId AS clienteId,
      s.createdAt AS createdAt,
      s.updatedAt AS updatedAt,
      (SELECT sr.id FROM solicitud_respuestas sr WHERE sr.solicitudId = s.id AND sr.autorUserId = p_user_id AND sr.deletedAt IS NULL ORDER BY sr.createdAt DESC LIMIT 1) AS respuestaId,
      (SELECT sr.contenido FROM solicitud_respuestas sr WHERE sr.solicitudId = s.id AND sr.autorUserId = p_user_id AND sr.deletedAt IS NULL ORDER BY sr.createdAt DESC LIMIT 1) AS respuestaContenido,
      (SELECT sr.createdAt FROM solicitud_respuestas sr WHERE sr.solicitudId = s.id AND sr.autorUserId = p_user_id AND sr.deletedAt IS NULL ORDER BY sr.createdAt DESC LIMIT 1) AS respuestaCreatedAt,
      (SELECT she.comentario FROM solicitud_historial_estados she WHERE she.solicitudId = s.id AND she.deletedAt IS NULL AND she.comentario IS NOT NULL ORDER BY she.createdAt DESC LIMIT 1) AS ultimoComentario
    FROM solicitudes s
    JOIN solicitud_estados se ON se.id = s.estadoId
    WHERE s.deletedAt IS NULL
      AND EXISTS (
        SELECT 1 FROM solicitud_respuestas sr
        WHERE sr.solicitudId = s.id
          AND sr.autorUserId = p_user_id
      )
      AND (v_q IS NULL OR s.tittle LIKE CONCAT('%', v_q, '%') OR s.description LIKE CONCAT('%', v_q, '%'))
    ORDER BY s.createdAt DESC
    LIMIT p_limit OFFSET p_offset;

    SELECT COUNT(*) AS total
    FROM solicitudes s
    JOIN solicitud_estados se ON se.id = s.estadoId
    WHERE s.deletedAt IS NULL
      AND EXISTS (
        SELECT 1 FROM solicitud_respuestas sr
        WHERE sr.solicitudId = s.id
          AND sr.autorUserId = p_user_id
      )
      AND (v_q IS NULL OR s.tittle LIKE CONCAT('%', v_q, '%') OR s.description LIKE CONCAT('%', v_q, '%'));

  ELSE
    SELECT
      s.id AS solicitudId,
      s.tittle AS tittle,
      s.description AS description,
      se.code AS estadoCode,
      s.soporteId AS soporteId,
      s.clienteId AS clienteId,
      s.createdAt AS createdAt,
      s.updatedAt AS updatedAt,
      COALESCE(
        (SELECT sr.id FROM solicitud_respuestas sr WHERE sr.solicitudId = s.id AND sr.autorUserId = s.soporteId AND sr.deletedAt IS NULL ORDER BY sr.createdAt DESC LIMIT 1),
        (SELECT sr2.id FROM solicitud_respuestas sr2 WHERE sr2.solicitudId = s.id AND sr2.deletedAt IS NULL ORDER BY sr2.createdAt DESC LIMIT 1)
      ) AS respuestaId,
      COALESCE(
        (SELECT sr.contenido FROM solicitud_respuestas sr WHERE sr.solicitudId = s.id AND sr.autorUserId = s.soporteId AND sr.deletedAt IS NULL ORDER BY sr.createdAt DESC LIMIT 1),
        (SELECT sr2.contenido FROM solicitud_respuestas sr2 WHERE sr2.solicitudId = s.id AND sr2.deletedAt IS NULL ORDER BY sr2.createdAt DESC LIMIT 1)
      ) AS respuestaContenido,
      COALESCE(
        (SELECT sr.createdAt FROM solicitud_respuestas sr WHERE sr.solicitudId = s.id AND sr.autorUserId = s.soporteId AND sr.deletedAt IS NULL ORDER BY sr.createdAt DESC LIMIT 1),
        (SELECT sr2.createdAt FROM solicitud_respuestas sr2 WHERE sr2.solicitudId = s.id AND sr2.deletedAt IS NULL ORDER BY sr2.createdAt DESC LIMIT 1)
      ) AS respuestaCreatedAt,
      (SELECT she.comentario FROM solicitud_historial_estados she WHERE she.solicitudId = s.id AND she.deletedAt IS NULL AND she.comentario IS NOT NULL ORDER BY she.createdAt DESC LIMIT 1) AS ultimoComentario
    FROM solicitudes s
    JOIN solicitud_estados se ON se.id = s.estadoId
    WHERE s.deletedAt IS NULL
      AND (v_q IS NULL OR s.tittle LIKE CONCAT('%', v_q, '%') OR s.description LIKE CONCAT('%', v_q, '%'))
    ORDER BY s.createdAt DESC
    LIMIT p_limit OFFSET p_offset;

    SELECT COUNT(*) AS total
    FROM solicitudes s
    JOIN solicitud_estados se ON se.id = s.estadoId
    WHERE s.deletedAt IS NULL
      AND (v_q IS NULL OR s.tittle LIKE CONCAT('%', v_q, '%') OR s.description LIKE CONCAT('%', v_q, '%'));
  END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_login_user` (IN `p_email` VARCHAR(255))   BEGIN
    DECLARE v_user_id INT;

    -- Se busca usuario por email que no esté soft-deleted
    SELECT u.id
    INTO v_user_id
    FROM users u
    WHERE u.email = p_email
      AND u.deletedAt IS NULL
    LIMIT 1;

    IF v_user_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Usuario no encontrado o eliminado';
    END IF;

    -- Devolver datos mínimos para login + roleId (sin objeto rol)
    SELECT
        u.id AS id,
        u.firstName,
        u.lastName,
        u.email,
        u.phone,
        u.password AS passwordHash,
        ur.rolId AS roleId
    FROM users u
    LEFT JOIN user_roles ur
        ON ur.userId = u.id
       AND ur.deletedAt IS NULL
    WHERE u.id = v_user_id
    ORDER BY ur.id ASC
    LIMIT 1;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_soft_delete_solicitud` (IN `p_solicitud_id` INT, IN `p_cliente_id` INT)   BEGIN
    DECLARE v_cliente_id INT;
    DECLARE v_estado_code VARCHAR(30);

    SELECT s.clienteId, se.code
      INTO v_cliente_id, v_estado_code
    FROM solicitudes s
    JOIN solicitud_estados se ON se.id = s.estadoId
    WHERE s.id = p_solicitud_id AND s.deletedAt IS NULL
    LIMIT 1;

    IF v_cliente_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solicitud no encontrada';
    END IF;

    IF v_cliente_id <> p_cliente_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No puede borrar una solicitud que no le pertenece';
    END IF;

    IF v_estado_code <> 'CANCELADA' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Solo se pueden borrar solicitudes canceladas';
    END IF;

    UPDATE solicitudes
       SET deletedAt = NOW()
     WHERE id = p_solicitud_id;

    SELECT s.id AS solicitudId, s.deletedAt
    FROM solicitudes s
    WHERE s.id = p_solicitud_id
    LIMIT 1;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `migrations`
--

CREATE TABLE `migrations` (
  `id` int(11) NOT NULL,
  `timestamp` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `migrations`
--

INSERT INTO `migrations` (`id`, `timestamp`, `name`) VALUES
(1, 1763609675821, 'UserRoles1763609675821'),
(2, 1763647172083, 'Tokens1763647172083'),
(3, 1763666069059, 'Solicitudes1763666069059');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `createdAt` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deletedAt` timestamp(6) NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `name`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Admin', '2025-11-20 03:41:34.595495', '2025-11-20 03:41:34.595495', NULL),
(2, 'User', '2025-11-20 03:41:34.608365', '2025-11-20 03:41:34.608365', NULL),
(3, 'Client', '2025-11-20 03:41:34.616442', '2025-11-20 03:41:34.616442', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitudes`
--

CREATE TABLE `solicitudes` (
  `id` int(11) NOT NULL,
  `tittle` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `estadoId` int(11) NOT NULL,
  `clienteId` int(11) NOT NULL,
  `soporteId` int(11) DEFAULT NULL,
  `createdAt` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deletedAt` timestamp(6) NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `solicitudes`
--

INSERT INTO `solicitudes` (`id`, `tittle`, `description`, `estadoId`, `clienteId`, `soporteId`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'instalar driver video', 'necesito que por favor me instalen ese driver en mi pc', 4, 8, 9, '2025-11-22 08:13:41.000000', '2025-11-23 03:16:31.000000', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitud_estados`
--

CREATE TABLE `solicitud_estados` (
  `id` int(11) NOT NULL,
  `code` varchar(30) NOT NULL,
  `name` varchar(50) NOT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `isFinal` tinyint(4) NOT NULL DEFAULT 0,
  `createdAt` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deletedAt` timestamp(6) NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `solicitud_estados`
--

INSERT INTO `solicitud_estados` (`id`, `code`, `name`, `order`, `isFinal`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'CREADA', 'Creada', 1, 0, '2025-11-20 19:36:23.314891', '2025-11-20 19:36:23.314891', NULL),
(2, 'ASIGNADA', 'Asignada', 2, 0, '2025-11-20 19:36:23.347571', '2025-11-20 19:36:23.347571', NULL),
(3, 'EN_PROCESO', 'En proceso', 3, 0, '2025-11-20 19:36:23.393697', '2025-11-20 19:36:23.393697', NULL),
(4, 'RESUELTA', 'Resuelta', 4, 1, '2025-11-20 19:36:23.426836', '2025-11-20 19:36:23.426836', NULL),
(5, 'CERRADA', 'Cerrada', 5, 1, '2025-11-20 19:36:23.437342', '2025-11-20 19:36:23.437342', NULL),
(6, 'CANCELADA', 'Cancelada', 6, 1, '2025-11-22 07:20:39.353474', '2025-11-22 07:20:39.353474', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitud_historial_estados`
--

CREATE TABLE `solicitud_historial_estados` (
  `id` int(11) NOT NULL,
  `solicitudId` int(11) NOT NULL,
  `estadoId` int(11) NOT NULL,
  `autorUserId` int(11) NOT NULL,
  `comentario` text DEFAULT NULL,
  `soporteId` int(11) DEFAULT NULL,
  `createdAt` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deletedAt` timestamp(6) NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `solicitud_historial_estados`
--

INSERT INTO `solicitud_historial_estados` (`id`, `solicitudId`, `estadoId`, `autorUserId`, `comentario`, `soporteId`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, 1, 8, NULL, NULL, '2025-11-22 08:13:41.000000', '2025-11-22 08:13:41.000000', NULL),
(2, 1, 2, 9, NULL, 9, '2025-11-23 01:17:39.000000', '2025-11-23 01:17:39.000000', NULL),
(3, 1, 3, 9, NULL, 9, '2025-11-23 03:15:41.000000', '2025-11-23 03:15:41.000000', NULL),
(4, 1, 4, 9, 'La pc del usuario quedo con todos los driver actualizados', 9, '2025-11-23 03:16:31.000000', '2025-11-23 03:16:31.000000', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitud_respuestas`
--

CREATE TABLE `solicitud_respuestas` (
  `id` int(11) NOT NULL,
  `solicitudId` int(11) NOT NULL,
  `autorUserId` int(11) NOT NULL,
  `contenido` text NOT NULL,
  `createdAt` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deletedAt` timestamp(6) NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `solicitud_respuestas`
--

INSERT INTO `solicitud_respuestas` (`id`, `solicitudId`, `autorUserId`, `contenido`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 1, 9, 'Se le instalo el driver al usuario', '2025-11-23 03:16:31.000000', '2025-11-23 03:16:31.000000', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `token`
--

CREATE TABLE `token` (
  `id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `createdAt` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `deletedAt` timestamp(6) NULL DEFAULT NULL,
  `userId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `token`
--

INSERT INTO `token` (`id`, `token`, `createdAt`, `deletedAt`, `userId`) VALUES
(1, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsInJvbGVJZCI6MSwiaWF0IjoxNzYzNjU3ODA1LCJleHAiOjE3NjM2NjE0MDV9.3pMMPmiDxXC8xTi3CpasJYphSKg5P-3w-ohnFc9iBPY', '2025-11-20 16:56:45.919060', '2025-11-20 16:59:46.086000', 5),
(2, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsInJvbGVJZCI6MiwiaWF0IjoxNzYzNzA1MzMyLCJleHAiOjE3NjM3MDg5MzJ9.ecDg5RGi2p6D0hZOAChk4TC0kuJDzBeOxVvSCM6EHrY', '2025-11-21 06:08:52.245161', NULL, 6),
(3, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsInJvbGVJZCI6MiwiaWF0IjoxNzYzNzA1NjY4LCJleHAiOjE3NjM3MDkyNjh9.Yt35TYGssn1wQFLJrkKTJrDdv3kpxo0I_1lH2l34Ri4', '2025-11-21 06:14:28.207597', NULL, 6),
(4, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsInJvbGVJZCI6MiwiaWF0IjoxNzYzNzA1Nzc0LCJleHAiOjE3NjM3MDkzNzR9.3_zBjqL2cTG6-mPCXbUrEULrgqt1hhgc7B4e5AXF0rE', '2025-11-21 06:16:14.846093', NULL, 6),
(5, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsInJvbGVJZCI6MiwiaWF0IjoxNzYzNzA1ODgzLCJleHAiOjE3NjM3MDk0ODN9.BbAHpHY977TkNIRXtHqQeJqKM3BS9Je5qYMFxeNRG0g', '2025-11-21 06:18:03.801166', NULL, 6),
(6, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsInJvbGVJZCI6MiwiaWF0IjoxNzYzNzM1NzQ0LCJleHAiOjE3NjM3MzkzNDR9.ron5Yds3H3nWCPKWcC6AzjKAdmctXOPHa_hfyuWb8Z8', '2025-11-21 14:35:44.613266', NULL, 6),
(7, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcsInJvbGVJZCI6MywiaWF0IjoxNzYzNzM2MTY1LCJleHAiOjE3NjM3Mzk3NjV9.5do11eUuxdynB6BMJS4oOxK8dsJ35uGYL-R75RKo7Tc', '2025-11-21 14:42:45.585733', NULL, 7),
(8, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInJvbGVJZCI6MywiaWF0IjoxNzYzNzM3NDc5LCJleHAiOjE3NjM3NDEwNzl9.N39KYrAoVs8l3S8g8Tz_oQASr2jJEWWLuUPv5pkeyPo', '2025-11-21 15:04:39.542997', NULL, 8),
(9, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInJvbGVJZCI6MywiaWF0IjoxNzYzNzU5MjE1LCJleHAiOjE3NjM3NjI4MTV9.3IKefrggMGsRpw7Z0dKUVG214wuA8uElbZGk2vKAhYw', '2025-11-21 21:06:55.136671', NULL, 8),
(10, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInJvbGVJZCI6MywiaWF0IjoxNzYzNzYxMzYyLCJleHAiOjE3NjM3NjQ5NjJ9.nEId7xloO-QU3FZqEl8WYMgktTFa-3LlVrGNzYhJORQ', '2025-11-21 21:42:42.746642', NULL, 8),
(11, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInJvbGVJZCI6MywiaWF0IjoxNzYzNzYyMTU5LCJleHAiOjE3NjM3NjU3NTl9.LIBYjypdu6njRD3KHGJAt32PvxlTLSXMhJSN3vZ-mss', '2025-11-21 21:55:59.694473', NULL, 8),
(12, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInJvbGVJZCI6MywiaWF0IjoxNzYzNzYyNzUzLCJleHAiOjE3NjM3NjYzNTN9.YXPUT0nhyfFS_6FrJhV5AXfg2Tb1gw_HFuVRtRMoqg8', '2025-11-21 22:05:53.672494', NULL, 8),
(13, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInJvbGVJZCI6MywiaWF0IjoxNzYzNzY4NDY5LCJleHAiOjE3NjM3NzIwNjl9.EnpBQ1jZ-cufpOFyc8tRMPae1KrZfstCG8ohuwd6oEI', '2025-11-21 23:41:09.819086', NULL, 8),
(14, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInJvbGVJZCI6MywiaWF0IjoxNzYzNzY4OTQ2LCJleHAiOjE3NjM3NzI1NDZ9.yhshmrArJiCgZYoSv7LudO2ayhVPDz2AhqX4QMnueCo', '2025-11-21 23:49:06.618161', NULL, 8),
(15, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInJvbGVJZCI6MywiaWF0IjoxNzYzNzg0MzkyLCJleHAiOjE3NjM3ODc5OTJ9.h6xdv3e5lPcqxZZnyNwwufcb__4hdeQD6JdXZcNuE-M', '2025-11-22 04:06:32.044377', NULL, 8),
(16, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInJvbGVJZCI6MywiaWF0IjoxNzYzNzkwMjE4LCJleHAiOjE3NjM3OTM4MTh9.8vDtkG_Euw09ryw5RAvh5n4mF3qqMsPxrher_Rt5NJA', '2025-11-22 05:43:38.564634', NULL, 8),
(17, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInJvbGVJZCI6MywiaWF0IjoxNzYzNzk5MTkzLCJleHAiOjE3NjM4MDI3OTN9.BzdJY2R_45puCT0UOTiXbPTOEg4HJ-P7uYaSzlhMtBc', '2025-11-22 08:13:13.073537', NULL, 8),
(18, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInJvbGVJZCI6MywiaWF0IjoxNzYzODAzNDgwLCJleHAiOjE3NjM4MDcwODB9.K5XpFBUa4oFC65iR-TAo8PEyys9XKvF0EZ4PK5OqT90', '2025-11-22 09:24:40.566601', NULL, 8),
(19, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInJvbGVJZCI6MywiaWF0IjoxNzYzODE5Nzk2LCJleHAiOjE3NjM4MjMzOTZ9.DiemMylckdVmpoiFppdzpIeYkJlPy-i4d1JtY8UNH1A', '2025-11-22 13:56:36.549798', NULL, 8),
(20, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInJvbGVJZCI6MywiaWF0IjoxNzYzODIzODA5LCJleHAiOjE3NjM4Mjc0MDl9.c79D8julHh-GjDOFhF3WahgUzIUOj2sTEfxXtEABy1s', '2025-11-22 15:03:29.976513', NULL, 8),
(21, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInJvbGVJZCI6MywiaWF0IjoxNzYzODI3NzkzLCJleHAiOjE3NjM4MzEzOTN9.k6cpY9oIX7vCFJSbnvzsPMAQLLzamy9ky8IrVHr_qTA', '2025-11-22 16:09:53.451096', NULL, 8),
(22, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInJvbGVJZCI6MywiaWF0IjoxNzYzODMxNDgzLCJleHAiOjE3NjM4MzUwODN9.GZLJISIi3k6cP6372fKi1rhPrnIsb7cu2dlCPaVa5Tw', '2025-11-22 17:11:23.571195', NULL, 8),
(23, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInJvbGVJZCI6MywiaWF0IjoxNzYzODU2MzU1LCJleHAiOjE3NjM4NTk5NTV9.AEtVfFXcD2KKoqBu9915uRNXyin5sYoItCEgeX43KPs', '2025-11-23 00:05:55.656862', NULL, 8),
(24, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksInJvbGVJZCI6MiwiaWF0IjoxNzYzODU4NTk3LCJleHAiOjE3NjM4NjIxOTd9.KYTjDG2GyPuo0kqEWYqL48HCtjv-SIefGZDZC_lj_lI', '2025-11-23 00:43:17.201982', NULL, 9),
(25, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksInJvbGVJZCI6MiwiaWF0IjoxNzYzODYzNjgzLCJleHAiOjE3NjM4NjcyODN9.zI7njdNhlnKguAHVervLgZvaN-qbvLJFty1hDh3kfL8', '2025-11-23 02:08:03.856690', NULL, 9),
(26, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksInJvbGVJZCI6MiwiaWF0IjoxNzYzODY3NzI0LCJleHAiOjE3NjM4NzEzMjR9.ymv6g2UB9rLi2J93umgaRD0gI3A7Jz3OuRuEzzR5ql4', '2025-11-23 03:15:24.670156', NULL, 9),
(27, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksInJvbGVJZCI6MiwiaWF0IjoxNzYzODcyMTA2LCJleHAiOjE3NjM4NzU3MDZ9._3142ZBt_I39xUVoqkt1Y3VK-Ip3383vQCuprtNbK60', '2025-11-23 04:28:26.882565', NULL, 9),
(28, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInJvbGVJZCI6MywiaWF0IjoxNzYzODczMDQ0LCJleHAiOjE3NjM4NzY2NDR9.X4vPcMAlCcjCTXBONIEOqBtgugfuF9IFlTmAKz5sANM', '2025-11-23 04:44:04.179606', NULL, 8),
(29, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksInJvbGVJZCI6MiwiaWF0IjoxNzYzODczMTgyLCJleHAiOjE3NjM4NzY3ODJ9.1AlxDusa8Rw2XIw8J2GbnLHamabBZEK5PbGbqjZ5SXc', '2025-11-23 04:46:22.900685', NULL, 9),
(30, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsInJvbGVJZCI6MywiaWF0IjoxNzYzODczMjc3LCJleHAiOjE3NjM4NzY4Nzd9.cG-AeXKKEVhdhjxU6ZTfDkkXQozXdY6wxC2dKhw1Dk0', '2025-11-23 04:47:57.022343', NULL, 8),
(31, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksInJvbGVJZCI6MiwiaWF0IjoxNzYzODczMzUyLCJleHAiOjE3NjM4NzY5NTJ9.a_lvtTVzmUlOQELvnnifjLlqakIT2zFVJ-GCCkApwRw', '2025-11-23 04:49:12.142018', NULL, 9);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `firstName` varchar(50) NOT NULL,
  `lastName` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `createdAt` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deletedAt` timestamp(6) NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `firstName`, `lastName`, `email`, `phone`, `password`, `createdAt`, `updatedAt`, `deletedAt`) VALUES
(1, 'Santiago', 'Gomez', 'santiago.gomez+test1@example.com', '1155553333', '$2b$10$nw6qWX0q51JgwJZ1GxH92.WK.VdnE2fN1CCTB9oHh08kkUTDl3Ffu', '2025-11-20 08:26:42.639769', '2025-11-20 08:26:42.639769', NULL),
(2, 'Ana', 'Lopez', 'ana.lopez+test2@example.com', '1144442222', '$2b$10$a5EXgUA2XKJOVB1cDIhOreNTLkaJs95mo3QMYsyLeNaeERFJdAGpO', '2025-11-20 08:27:56.329049', '2025-11-20 08:27:56.329049', NULL),
(3, 'Lucas', 'Fernandez', 'lucas.fernandez+test4@example.com', '1167894321', '$2b$10$noaJELbVQBxq29OsjsND.O0N6IWUP8GFju7tnaTybRTyw0Eta.T6m', '2025-11-20 08:31:15.779259', '2025-11-20 08:31:15.779259', NULL),
(4, 'Martina', 'Rodriguez', 'martina.rodriguez+test3@example.com', '1122334455', '$2b$10$exnkhlyGMmkELGj9yIrNhexoYm2YTt8u6Xv/qHSjV9I/0zBKkIyWi', '2025-11-20 08:33:29.096562', '2025-11-20 08:33:29.096562', NULL),
(5, 'Valentina', 'Suarez', 'valentina.suarez+test5@example.com', '1133017788', '$2b$10$YifjdIAqHOZYexkixl6v/u9cXBTjLQloCHpOk7iQZ6ltf9zxRe/OS', '2025-11-20 08:36:59.648106', '2025-11-20 08:36:59.648106', NULL),
(6, 'Sofía', 'Gómez', 'sofia.gomez+test6@example.com', '1155523344', '$2b$10$dKnEOKTAZ09fWeCIBW1azOzeMcky0b28Btuc6Ooeq2NHzoATMH97O', '2025-11-20 08:48:39.467525', '2025-11-20 08:48:39.467525', NULL),
(7, 'Santiago', 'Orjuela Vera', 'orjuelasantiago1152002@gmail.com', '2147483647', '$2b$10$tp3PVd08HLkG1HEMgZ2y/eyjPmeS.YjgWNuh/k7vaUeghXAKMh2Pe', '2025-11-21 14:42:40.297925', '2025-11-21 14:42:40.297925', NULL),
(8, 'pepe', 'turaja', 'pepe@pepillo.com', '434543242', '$2b$10$.rh/Z41MdanLdcbU2prG8uD.YhNdipNOnMBQ4BWY5hJrEXUlGlJZO', '2025-11-21 15:04:36.516720', '2025-11-22 17:20:52.000000', NULL),
(9, 'soporte', 'prueba', 'soporte@prueba.com', '45635789', '$2b$10$gPjIt8xMnj/hzGSgwYAviecnrQv4qJuUvDA7JW0vWa487FzJIcvfa', '2025-11-23 00:42:34.313785', '2025-11-23 00:42:34.313785', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_roles`
--

CREATE TABLE `user_roles` (
  `id` int(11) NOT NULL,
  `createdAt` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deletedAt` timestamp(6) NULL DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `rolId` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `user_roles`
--

INSERT INTO `user_roles` (`id`, `createdAt`, `updatedAt`, `deletedAt`, `userId`, `rolId`) VALUES
(1, '2025-11-20 08:26:42.642030', '2025-11-20 08:26:42.642030', NULL, 1, 1),
(2, '2025-11-20 08:27:56.329822', '2025-11-20 08:27:56.329822', NULL, 2, 2),
(3, '2025-11-20 08:31:15.782167', '2025-11-20 08:31:15.782167', NULL, 3, 2),
(4, '2025-11-20 08:33:29.098504', '2025-11-20 08:33:29.098504', NULL, 4, 1),
(5, '2025-11-20 08:36:59.650325', '2025-11-20 08:36:59.650325', NULL, 5, 1),
(6, '2025-11-20 08:48:39.469457', '2025-11-20 08:48:39.469457', NULL, 6, 2),
(7, '2025-11-21 14:42:40.298486', '2025-11-21 14:42:40.298486', NULL, 7, 3),
(8, '2025-11-21 15:04:36.517475', '2025-11-21 15:04:36.517475', NULL, 8, 3),
(9, '2025-11-23 00:42:34.316202', '2025-11-23 00:42:34.316202', NULL, 9, 2);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `solicitudes`
--
ALTER TABLE `solicitudes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_1a38dcf37f2498453aa38462a57` (`estadoId`),
  ADD KEY `FK_8647c62a4fb649befc52fc26622` (`clienteId`),
  ADD KEY `FK_496f1786260a757501756e7744e` (`soporteId`);

--
-- Indices de la tabla `solicitud_estados`
--
ALTER TABLE `solicitud_estados`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `IDX_752aeef5de5d83bc3d8ac718cd` (`code`);

--
-- Indices de la tabla `solicitud_historial_estados`
--
ALTER TABLE `solicitud_historial_estados`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_0de04632985f6d3b2d966c74455` (`solicitudId`),
  ADD KEY `FK_efa82268798587dc26df02b3478` (`estadoId`),
  ADD KEY `FK_5da3a417265f33247e12dcb8422` (`autorUserId`),
  ADD KEY `FK_ed2390395079267bad60cc6f96e` (`soporteId`);

--
-- Indices de la tabla `solicitud_respuestas`
--
ALTER TABLE `solicitud_respuestas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_fdc98e59be33dbd2ac7edc51980` (`solicitudId`),
  ADD KEY `FK_69ad59de9e5edd2252618813c38` (`autorUserId`);

--
-- Indices de la tabla `token`
--
ALTER TABLE `token`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_94f168faad896c0786646fa3d4a` (`userId`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`),
  ADD UNIQUE KEY `IDX_a000cca60bcf04454e72769949` (`phone`);

--
-- Indices de la tabla `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK_472b25323af01488f1f66a06b67` (`userId`),
  ADD KEY `FK_1655726bef24a1949216c6b5d91` (`rolId`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `solicitudes`
--
ALTER TABLE `solicitudes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `solicitud_estados`
--
ALTER TABLE `solicitud_estados`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `solicitud_historial_estados`
--
ALTER TABLE `solicitud_historial_estados`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `solicitud_respuestas`
--
ALTER TABLE `solicitud_respuestas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `token`
--
ALTER TABLE `token`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `user_roles`
--
ALTER TABLE `user_roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `solicitudes`
--
ALTER TABLE `solicitudes`
  ADD CONSTRAINT `FK_1a38dcf37f2498453aa38462a57` FOREIGN KEY (`estadoId`) REFERENCES `solicitud_estados` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_496f1786260a757501756e7744e` FOREIGN KEY (`soporteId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_8647c62a4fb649befc52fc26622` FOREIGN KEY (`clienteId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `solicitud_historial_estados`
--
ALTER TABLE `solicitud_historial_estados`
  ADD CONSTRAINT `FK_0de04632985f6d3b2d966c74455` FOREIGN KEY (`solicitudId`) REFERENCES `solicitudes` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_5da3a417265f33247e12dcb8422` FOREIGN KEY (`autorUserId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_ed2390395079267bad60cc6f96e` FOREIGN KEY (`soporteId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_efa82268798587dc26df02b3478` FOREIGN KEY (`estadoId`) REFERENCES `solicitud_estados` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `solicitud_respuestas`
--
ALTER TABLE `solicitud_respuestas`
  ADD CONSTRAINT `FK_69ad59de9e5edd2252618813c38` FOREIGN KEY (`autorUserId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_fdc98e59be33dbd2ac7edc51980` FOREIGN KEY (`solicitudId`) REFERENCES `solicitudes` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `token`
--
ALTER TABLE `token`
  ADD CONSTRAINT `FK_94f168faad896c0786646fa3d4a` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

--
-- Filtros para la tabla `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `FK_1655726bef24a1949216c6b5d91` FOREIGN KEY (`rolId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION,
  ADD CONSTRAINT `FK_472b25323af01488f1f66a06b67` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
