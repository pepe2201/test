// modules/core/config.inc
// Compile-time configuration. Override per environment if needed.

#if defined _rp_config_included
    #endinput
#endif
#define _rp_config_included

// ---------------------------------------------------------------------------
// Server identity
// ---------------------------------------------------------------------------
#define SERVER_NAME             "samp-rp | open.mp Roleplay"
#define SERVER_LANGUAGE         "EN/DE"
#define SERVER_WEBSITE          "https://example.org"

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------
#define MYSQL_HOST              "127.0.0.1"
#define MYSQL_USER              "samp_rp"
#define MYSQL_PASS              "change_me"
#define MYSQL_DB                "samp_rp"
#define MYSQL_PORT              3306

// ---------------------------------------------------------------------------
// Player & character
// ---------------------------------------------------------------------------
#define MAX_INVENTORY_SLOTS     24
#define MAX_LOGIN_ATTEMPTS      3
#define BCRYPT_COST             12
#define MIN_PASSWORD_LEN        6
#define MAX_PASSWORD_LEN        32

// Spawn (Idlewood, LS) when no last position is stored
#define SPAWN_X                 1684.0
#define SPAWN_Y                 -2244.0
#define SPAWN_Z                 13.5
#define SPAWN_A                 0.0

// ---------------------------------------------------------------------------
// Economy
// ---------------------------------------------------------------------------
#define STARTING_CASH           500
#define PAYCHECK_INTERVAL_MIN   60       // minutes between paychecks
#define BANK_INTEREST_BPS       50       // 0.50 % per paycheck
#define MAX_CASH_SANE           50000000 // anti-cheat sanity bound

// ---------------------------------------------------------------------------
// Admin levels
// ---------------------------------------------------------------------------
#define ADMIN_NONE              0
#define ADMIN_TRIAL             1
#define ADMIN_MOD               2
#define ADMIN_ADMIN             3
#define ADMIN_HEAD              4
#define ADMIN_LEAD              5
#define ADMIN_OWNER             6

// ---------------------------------------------------------------------------
// Faction types (mirrors `factions.type` column)
// ---------------------------------------------------------------------------
#define FAC_TYPE_CIVILIAN       0
#define FAC_TYPE_LAW            1
#define FAC_TYPE_MEDIC          2
#define FAC_TYPE_NEWS           3
#define FAC_TYPE_MAFIA          4
#define FAC_TYPE_GANG           5

// ---------------------------------------------------------------------------
// Colors (RGBA)
// ---------------------------------------------------------------------------
#define COL_WHITE               0xFFFFFFFF
#define COL_RED                 0xFF4040FF
#define COL_GREEN               0x4DFF4DFF
#define COL_YELLOW              0xFFD700FF
#define COL_BLUE                0x1E90FFFF
#define COL_GREY                0xAFAFAFFF
#define COL_LIGHTBLUE           0x80B0FFFF
#define COL_OOC                 0xC0C0C0FF
#define COL_ME                  0xC2A2DAAA
#define COL_DO                  0xC2A2DAAA
#define COL_ADMIN               0xFFAA00FF

// Embeddable color tags for SendClientMessage formatting
#define EMB_WHITE               "{FFFFFF}"
#define EMB_RED                 "{FF4040}"
#define EMB_GREEN               "{4DFF4D}"
#define EMB_YELLOW              "{FFD700}"
#define EMB_BLUE                "{1E90FF}"
#define EMB_GREY                "{AFAFAF}"

// ---------------------------------------------------------------------------
// Business types (mirrors `businesses.type` column)
// ---------------------------------------------------------------------------
#define BIZ_TYPE_247        0
#define BIZ_TYPE_GAS        1
#define BIZ_TYPE_GUNSHOP    2
#define BIZ_TYPE_RESTAURANT 3
#define BIZ_TYPE_CLOTHES    4

// ---------------------------------------------------------------------------
// Phone
// ---------------------------------------------------------------------------
#define PHONE_NUMBER_MIN    1000000
#define PHONE_NUMBER_MAX    9999999
#define PHONE_RING_TIMEOUT  20      // seconds before unanswered call drops

// ---------------------------------------------------------------------------
// Drugs
// ---------------------------------------------------------------------------
#define DRUG_EFFECT_DURATION_S  60   // seconds
#define DRUG_PRICE_WEED         50
#define DRUG_PRICE_COKE        150
#define DRUG_PRICE_METH        120

// ---------------------------------------------------------------------------
// Dialog IDs (range-based to avoid collisions across modules)
// ---------------------------------------------------------------------------
#define DLG_LOGIN               1000
#define DLG_REGISTER            1001
#define DLG_CHAR_CREATE         1002
#define DLG_BANK_MAIN           1100
#define DLG_BANK_DEPOSIT        1101
#define DLG_BANK_WITHDRAW       1102
#define DLG_HOUSE_BUY           1200
#define DLG_HOUSE_MENU          1201
#define DLG_VEHICLE_MENU        1300
#define DLG_INVENTORY           1400
#define DLG_FACTION_MENU        1500
#define DLG_JOB_MENU            1600
#define DLG_ADMIN_MENU          1900
#define DLG_BIZ_MENU            1700
#define DLG_BIZ_BUY             1701
#define DLG_BIZ_PRICE           1702
#define DLG_BIZ_GUNS            1703
#define DLG_BIZ_CLOTHES         1704
#define DLG_PHONE_INBOX         1800
#define DLG_DRUG_BUY            2000
