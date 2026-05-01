// modules/player/character.inc
// In-memory player data plus persistence to the `characters` table.
// Every other module reads/writes player state through these accessors so
// the storage layer can be swapped (e.g. cached writes) without touching them.

#if defined _rp_character_included
    #endinput
#endif
#define _rp_character_included

enum E_PLAYER_DATA
{
    e_account_id,
    e_char_id,
    e_admin_level,
    e_vip_level,
    e_logged_in,
    e_login_attempts,
    e_cash,
    e_bank,
    e_level,
    e_exp,
    e_skin,
    e_sex,
    e_age,
    Float: e_health,
    Float: e_armour,
    e_faction_id,
    e_faction_rank,
    e_job_id,
    e_house_id,
    e_phone,
    e_minutes_played,
    e_jail_time,
    e_wanted_level,
    bool: e_in_house,
    e_current_house,
    bool: e_in_vehicle_owned,
    e_current_vehicle_db,
    e_last_payday_tick,
    e_spawn_pos_loaded,
    Float: e_spawn_x,
    Float: e_spawn_y,
    Float: e_spawn_z,
    Float: e_spawn_a,
    e_spawn_int,
    e_spawn_vw,
}

new gPlayer[MAX_PLAYERS][E_PLAYER_DATA];

// ---------------------------------------------------------------------------
// Reset on connect / disconnect — single source of truth for default state
// ---------------------------------------------------------------------------
stock Player_ResetData(playerid)
{
    for (new i = 0; i < _:E_PLAYER_DATA; i++) gPlayer[playerid][E_PLAYER_DATA:i] = 0;
    gPlayer[playerid][e_health]  = 100.0;
    gPlayer[playerid][e_cash]    = 0;
    gPlayer[playerid][e_skin]    = 0;
    gPlayer[playerid][e_account_id]   = 0;
    gPlayer[playerid][e_char_id]      = 0;
    gPlayer[playerid][e_logged_in]    = 0;
    gPlayer[playerid][e_login_attempts] = 0;
    gPlayer[playerid][e_spawn_pos_loaded] = 0;
}

// ---------------------------------------------------------------------------
// Accessors — every module goes through these.
// ---------------------------------------------------------------------------
stock Player_IsLoggedIn(playerid)        return gPlayer[playerid][e_logged_in] == 1;
stock Player_GetAccountId(playerid)      return gPlayer[playerid][e_account_id];
stock Player_GetCharId(playerid)         return gPlayer[playerid][e_char_id];
stock Player_GetAdminLevel(playerid)     return gPlayer[playerid][e_admin_level];
stock Player_GetCash(playerid)           return gPlayer[playerid][e_cash];
stock Player_GetBank(playerid)           return gPlayer[playerid][e_bank];
stock Player_GetLevel(playerid)          return gPlayer[playerid][e_level];
stock Player_GetFaction(playerid)        return gPlayer[playerid][e_faction_id];
stock Player_GetFactionRank(playerid)    return gPlayer[playerid][e_faction_rank];
stock Player_GetJob(playerid)            return gPlayer[playerid][e_job_id];
stock Player_GetHouseId(playerid)        return gPlayer[playerid][e_house_id];
stock Player_GetWanted(playerid)         return gPlayer[playerid][e_wanted_level];

stock Player_SetCash(playerid, value)        gPlayer[playerid][e_cash] = value;
stock Player_SetBank(playerid, value)        gPlayer[playerid][e_bank] = value;
stock Player_SetAdminLevel(playerid, value)  gPlayer[playerid][e_admin_level] = value;
stock Player_SetFaction(playerid, fac, rank) {
    gPlayer[playerid][e_faction_id]   = fac;
    gPlayer[playerid][e_faction_rank] = rank;
}
stock Player_SetJob(playerid, job)            gPlayer[playerid][e_job_id] = job;
stock Player_SetWanted(playerid, value)       gPlayer[playerid][e_wanted_level] = value;

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------
forward OnCharacterLoaded(playerid);
public  OnCharacterLoaded(playerid)
{
    new rows = cache_num_rows();
    if (rows == 0)
    {
        // No character yet — open creation dialog
        Player_ShowCharCreateDialog(playerid);
        return 1;
    }
    cache_get_value_name_int  (0, "id",            gPlayer[playerid][e_char_id]);
    cache_get_value_name_int  (0, "skin",          gPlayer[playerid][e_skin]);
    cache_get_value_name_int  (0, "sex",           gPlayer[playerid][e_sex]);
    cache_get_value_name_int  (0, "age",           gPlayer[playerid][e_age]);
    cache_get_value_name_int  (0, "cash",          gPlayer[playerid][e_cash]);
    cache_get_value_name_int  (0, "bank",          gPlayer[playerid][e_bank]);
    cache_get_value_name_int  (0, "level",         gPlayer[playerid][e_level]);
    cache_get_value_name_int  (0, "exp",           gPlayer[playerid][e_exp]);
    cache_get_value_name_float(0, "health",        gPlayer[playerid][e_health]);
    cache_get_value_name_float(0, "armour",        gPlayer[playerid][e_armour]);
    cache_get_value_name_float(0, "pos_x",         gPlayer[playerid][e_spawn_x]);
    cache_get_value_name_float(0, "pos_y",         gPlayer[playerid][e_spawn_y]);
    cache_get_value_name_float(0, "pos_z",         gPlayer[playerid][e_spawn_z]);
    cache_get_value_name_float(0, "pos_a",         gPlayer[playerid][e_spawn_a]);
    cache_get_value_name_int  (0, "interior",      gPlayer[playerid][e_spawn_int]);
    cache_get_value_name_int  (0, "virtual_world", gPlayer[playerid][e_spawn_vw]);
    cache_get_value_name_int  (0, "faction_id",    gPlayer[playerid][e_faction_id]);
    cache_get_value_name_int  (0, "faction_rank",  gPlayer[playerid][e_faction_rank]);
    cache_get_value_name_int  (0, "job_id",        gPlayer[playerid][e_job_id]);
    cache_get_value_name_int  (0, "house_id",      gPlayer[playerid][e_house_id]);
    cache_get_value_name_int  (0, "phone_number",  gPlayer[playerid][e_phone]);
    cache_get_value_name_int  (0, "minutes_played",gPlayer[playerid][e_minutes_played]);
    cache_get_value_name_int  (0, "jail_time",     gPlayer[playerid][e_jail_time]);
    cache_get_value_name_int  (0, "wanted_level",  gPlayer[playerid][e_wanted_level]);

    gPlayer[playerid][e_spawn_pos_loaded] = 1;
    SetSpawnInfo(playerid, NO_TEAM, gPlayer[playerid][e_skin],
        gPlayer[playerid][e_spawn_x], gPlayer[playerid][e_spawn_y],
        gPlayer[playerid][e_spawn_z], gPlayer[playerid][e_spawn_a],
        0, 0, 0, 0, 0, 0);

    SpawnPlayer(playerid);
    Inventory_Load(playerid);
    return 1;
}

stock Player_LoadCharacter(playerid)
{
    new q[160];
    mysql_format(g_DB, q, sizeof q,
        "SELECT * FROM characters WHERE account_id=%d LIMIT 1",
        Player_GetAccountId(playerid));
    mysql_pquery(g_DB, q, "OnCharacterLoaded", "d", playerid);
}

stock Player_SaveCharacter(playerid)
{
    if (!Player_IsLoggedIn(playerid))      return 0;
    if (Player_GetCharId(playerid) == 0)   return 0;

    new Float: x, Float: y, Float: z, Float: a;
    GetPlayerPos(playerid, x, y, z);
    GetPlayerFacingAngle(playerid, a);
    new Float: hp, Float: ar;
    GetPlayerHealth(playerid, hp);
    GetPlayerArmour(playerid, ar);

    new q[600];
    mysql_format(g_DB, q, sizeof q,
        "UPDATE characters SET cash=%d,bank=%d,level=%d,exp=%d,\
         health=%f,armour=%f,pos_x=%f,pos_y=%f,pos_z=%f,pos_a=%f,\
         interior=%d,virtual_world=%d,faction_id=%d,faction_rank=%d,\
         job_id=%d,minutes_played=%d,jail_time=%d,wanted_level=%d,\
         last_seen=NOW() WHERE id=%d",
        gPlayer[playerid][e_cash], gPlayer[playerid][e_bank],
        gPlayer[playerid][e_level], gPlayer[playerid][e_exp],
        hp, ar, x, y, z, a,
        GetPlayerInterior(playerid), GetPlayerVirtualWorld(playerid),
        gPlayer[playerid][e_faction_id], gPlayer[playerid][e_faction_rank],
        gPlayer[playerid][e_job_id], gPlayer[playerid][e_minutes_played],
        gPlayer[playerid][e_jail_time], gPlayer[playerid][e_wanted_level],
        gPlayer[playerid][e_char_id]);
    mysql_tquery(g_DB, q);
    return 1;
}

// Forward declared — implemented in account.inc
forward Player_ShowCharCreateDialog(playerid);
