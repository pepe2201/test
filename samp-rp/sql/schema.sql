-- samp-rp schema
-- MySQL 5.7+ / MariaDB 10.4+

CREATE DATABASE IF NOT EXISTS samp_rp
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE samp_rp;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- accounts: one row per registered account
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    username        VARCHAR(24) NOT NULL,
    password_hash   CHAR(60) NOT NULL,        -- bcrypt
    email           VARCHAR(120) DEFAULT NULL,
    admin_level     TINYINT UNSIGNED NOT NULL DEFAULT 0,
    vip_level       TINYINT UNSIGNED NOT NULL DEFAULT 0,
    last_ip         VARCHAR(45) DEFAULT NULL, -- IPv4 or IPv6
    last_login      DATETIME DEFAULT NULL,
    register_date   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    banned          TINYINT(1) NOT NULL DEFAULT 0,
    ban_reason      VARCHAR(160) DEFAULT NULL,
    banned_by       VARCHAR(24) DEFAULT NULL,
    banned_until    DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username),
    KEY idx_last_ip (last_ip)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- characters: one per account (extend to many later)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS characters (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id      INT UNSIGNED NOT NULL,
    name            VARCHAR(24) NOT NULL,
    skin            SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    sex             TINYINT UNSIGNED NOT NULL DEFAULT 0,
    age             TINYINT UNSIGNED NOT NULL DEFAULT 18,
    cash            INT NOT NULL DEFAULT 500,
    bank            INT NOT NULL DEFAULT 0,
    level           SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    exp             INT UNSIGNED NOT NULL DEFAULT 0,
    health          FLOAT NOT NULL DEFAULT 100.0,
    armour          FLOAT NOT NULL DEFAULT 0.0,
    pos_x           FLOAT NOT NULL DEFAULT 1684.0,
    pos_y           FLOAT NOT NULL DEFAULT -2244.0,
    pos_z           FLOAT NOT NULL DEFAULT 13.5,
    pos_a           FLOAT NOT NULL DEFAULT 0.0,
    interior        INT NOT NULL DEFAULT 0,
    virtual_world   INT NOT NULL DEFAULT 0,
    faction_id      INT UNSIGNED DEFAULT NULL,
    faction_rank    TINYINT UNSIGNED NOT NULL DEFAULT 0,
    job_id          INT UNSIGNED DEFAULT NULL,
    house_id        INT UNSIGNED DEFAULT NULL,
    phone_number    INT UNSIGNED DEFAULT NULL,
    minutes_played  INT UNSIGNED NOT NULL DEFAULT 0,
    jail_time       INT UNSIGNED NOT NULL DEFAULT 0,
    wanted_level    TINYINT UNSIGNED NOT NULL DEFAULT 0,
    last_seen       DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_name (name),
    KEY idx_account (account_id),
    CONSTRAINT fk_char_account FOREIGN KEY (account_id)
        REFERENCES accounts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- inventory: 24 slots per character, slot_index 0..23
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    character_id  INT UNSIGNED NOT NULL,
    slot_index    TINYINT UNSIGNED NOT NULL,
    item_id       SMALLINT UNSIGNED NOT NULL,
    amount        INT UNSIGNED NOT NULL DEFAULT 1,
    metadata      VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_char_slot (character_id, slot_index),
    CONSTRAINT fk_inv_char FOREIGN KEY (character_id)
        REFERENCES characters(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- factions: organisations (LSPD, FBI, mafia families, …)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS factions (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name          VARCHAR(48) NOT NULL,
    type          TINYINT UNSIGNED NOT NULL DEFAULT 0, -- 0 civ, 1 cop, 2 medic, 2 news, 3 mafia, 4 gang
    color         INT UNSIGNED NOT NULL DEFAULT 16777215,
    bank          BIGINT NOT NULL DEFAULT 0,
    max_rank      TINYINT UNSIGNED NOT NULL DEFAULT 6,
    motd          VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_name (name)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- jobs: trucker, taxi, mechanic, lawyer, …
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name          VARCHAR(48) NOT NULL,
    min_level     SMALLINT UNSIGNED NOT NULL DEFAULT 1,
    base_pay      INT UNSIGNED NOT NULL DEFAULT 100,
    PRIMARY KEY (id),
    UNIQUE KEY uk_name (name)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- vehicles: persistent vehicles (player-owned and faction-owned)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    model         SMALLINT UNSIGNED NOT NULL,
    owner_char    INT UNSIGNED DEFAULT NULL,
    owner_faction INT UNSIGNED DEFAULT NULL,
    plate         VARCHAR(10) DEFAULT NULL,
    pos_x         FLOAT NOT NULL,
    pos_y         FLOAT NOT NULL,
    pos_z         FLOAT NOT NULL,
    pos_a         FLOAT NOT NULL DEFAULT 0.0,
    color1        SMALLINT NOT NULL DEFAULT 0,
    color2        SMALLINT NOT NULL DEFAULT 0,
    fuel          SMALLINT UNSIGNED NOT NULL DEFAULT 100,
    locked        TINYINT(1) NOT NULL DEFAULT 1,
    health        FLOAT NOT NULL DEFAULT 1000.0,
    interior      INT NOT NULL DEFAULT 0,
    virtual_world INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_owner_char (owner_char),
    KEY idx_owner_fac (owner_faction)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- houses
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS houses (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    owner_char    INT UNSIGNED DEFAULT NULL,
    price         INT UNSIGNED NOT NULL DEFAULT 50000,
    locked        TINYINT(1) NOT NULL DEFAULT 1,
    interior_id   TINYINT UNSIGNED NOT NULL DEFAULT 1,
    ext_x         FLOAT NOT NULL,
    ext_y         FLOAT NOT NULL,
    ext_z         FLOAT NOT NULL,
    int_x         FLOAT NOT NULL DEFAULT 2196.85,
    int_y         FLOAT NOT NULL DEFAULT -1204.43,
    int_z         FLOAT NOT NULL DEFAULT 1049.02,
    PRIMARY KEY (id),
    KEY idx_owner (owner_char)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- businesses
-- Types: 0=24/7 store, 1=gas station, 2=gun shop, 3=restaurant, 4=clothes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS businesses (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    owner_char    INT UNSIGNED DEFAULT NULL,
    type          TINYINT UNSIGNED NOT NULL DEFAULT 0,
    name          VARCHAR(64) NOT NULL,
    price         INT UNSIGNED NOT NULL DEFAULT 100000,
    till          BIGINT NOT NULL DEFAULT 0,
    product_price INT UNSIGNED NOT NULL DEFAULT 50,
    locked        TINYINT(1) NOT NULL DEFAULT 0,
    interior_id   TINYINT UNSIGNED NOT NULL DEFAULT 17, -- 24/7 default
    pos_x         FLOAT NOT NULL,
    pos_y         FLOAT NOT NULL,
    pos_z         FLOAT NOT NULL,
    int_x         FLOAT NOT NULL DEFAULT -25.88,
    int_y         FLOAT NOT NULL DEFAULT -185.86,
    int_z         FLOAT NOT NULL DEFAULT 1003.55,
    PRIMARY KEY (id),
    KEY idx_owner (owner_char)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- sms: persistent inbox per character (last 50 kept by app logic)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sms (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    from_char_id    INT UNSIGNED NOT NULL,
    from_number     INT UNSIGNED NOT NULL,
    to_char_id      INT UNSIGNED NOT NULL,
    body            VARCHAR(160) NOT NULL,
    sent_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_to (to_char_id, sent_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- bans: separate from accounts so we can also IP-ban
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bans (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    account_id    INT UNSIGNED DEFAULT NULL,
    ip            VARCHAR(45) DEFAULT NULL,
    reason        VARCHAR(160) NOT NULL,
    banned_by     VARCHAR(24) NOT NULL,
    banned_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at    DATETIME DEFAULT NULL,  -- NULL == permanent
    PRIMARY KEY (id),
    KEY idx_account (account_id),
    KEY idx_ip (ip)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------------
-- seed data
-- ---------------------------------------------------------------------------
INSERT IGNORE INTO factions (id, name, type, color, max_rank) VALUES
    (1, 'Los Santos Police Department', 1, 0x1E90FFAA, 8),
    (2, 'Federal Bureau of Investigation', 1, 0x000080AA, 8),
    (3, 'Los Santos Medical', 2, 0xFF6347AA, 6),
    (4, 'San News', 0, 0xFFD700AA, 6),
    (5, 'La Cosa Nostra', 3, 0x8B0000AA, 7),
    (6, 'Triads', 3, 0x008000AA, 7);

INSERT IGNORE INTO jobs (id, name, min_level, base_pay) VALUES
    (1, 'Trucker',  1, 200),
    (2, 'Taxi',     1, 150),
    (3, 'Mechanic', 2, 250),
    (4, 'Pilot',    5, 500),
    (5, 'Lawyer',   3, 300);

-- A handful of seed businesses scattered in LS to test ownership flow.
INSERT IGNORE INTO businesses (id, type, name, price, product_price, pos_x, pos_y, pos_z, interior_id, int_x, int_y, int_z) VALUES
    (1, 0, '24/7 Idlewood',        80000,   50, 2104.0, -1806.0, 13.5, 17,  -25.88,  -185.86, 1003.55),
    (2, 1, 'Xoomer Gas',          120000,   12, 1597.5, 2199.5, 10.8,  0,  1597.50, 2199.50,   10.82),
    (3, 2, 'Ammu-Nation Pershing',150000,  500, 1366.0, -1279.0, 13.5,  1,  286.15,   -39.50, 1001.51),
    (4, 3, 'Cluckin Bell',         70000,   20, 2412.0, -1976.0, 13.5,  9,  365.93, -10.49,  1001.85),
    (5, 4, 'Binco LS',             60000,  100, 2247.0, -1665.0, 15.5, 15,  207.74,  -109.0, 1005.13);

SET FOREIGN_KEY_CHECKS = 1;
