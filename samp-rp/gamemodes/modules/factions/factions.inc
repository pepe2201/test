// modules/factions/factions.inc
// Factions are loaded once at startup into an in-memory table. Membership is
// stored on the character (faction_id, faction_rank) — joining is a single
// UPDATE plus an in-memory bookkeeping write.

#if defined _rp_factions_included
    #endinput
#endif
#define _rp_factions_included

#define MAX_FACTIONS 32

enum E_FACTION_DATA
{
    e_fac_id,
    e_fac_name[48],
    e_fac_type,
    e_fac_color,
    e_fac_max_rank,
    e_fac_motd[160],
    bool: e_fac_loaded,
}

new gFaction[MAX_FACTIONS][E_FACTION_DATA];

stock Faction_LoadAll()
{
    mysql_pquery(g_DB,
        "SELECT id,name,type,color,max_rank,motd FROM factions ORDER BY id",
        "OnFactionsLoaded");
}

forward OnFactionsLoaded();
public  OnFactionsLoaded()
{
    new rows = cache_num_rows();
    if (rows > MAX_FACTIONS) rows = MAX_FACTIONS;
    for (new r = 0; r < rows; r++)
    {
        cache_get_value_name_int(r, "id",       gFaction[r][e_fac_id]);
        cache_get_value_name    (r, "name",     gFaction[r][e_fac_name],   48);
        cache_get_value_name_int(r, "type",     gFaction[r][e_fac_type]);
        cache_get_value_name_int(r, "color",    gFaction[r][e_fac_color]);
        cache_get_value_name_int(r, "max_rank", gFaction[r][e_fac_max_rank]);
        cache_get_value_name    (r, "motd",     gFaction[r][e_fac_motd],   160);
        gFaction[r][e_fac_loaded] = true;
    }
    printf("[FAC] %d factions loaded", rows);
    return 1;
}

stock Faction_FindIndexById(faction_id)
{
    if (faction_id <= 0) return -1;
    for (new i = 0; i < MAX_FACTIONS; i++)
        if (gFaction[i][e_fac_loaded] && gFaction[i][e_fac_id] == faction_id) return i;
    return -1;
}

stock Faction_GetName(faction_id, dest[], len = sizeof dest)
{
    new idx = Faction_FindIndexById(faction_id);
    if (idx == -1) { dest[0] = 0; return 0; }
    dest[0] = 0;
    strcat(dest, gFaction[idx][e_fac_name], len);
    return 1;
}

stock Faction_GetType(faction_id)
{
    new idx = Faction_FindIndexById(faction_id);
    if (idx == -1) return -1;
    return gFaction[idx][e_fac_type];
}

stock bool: Faction_IsLaw(faction_id)
{
    return Faction_GetType(faction_id) == FAC_TYPE_LAW;
}

stock bool: Faction_IsMedic(faction_id)
{
    return Faction_GetType(faction_id) == FAC_TYPE_MEDIC;
}

stock Faction_Join(playerid, faction_id, rank = 1)
{
    Player_SetFaction(playerid, faction_id, rank);
    new q[140];
    mysql_format(g_DB, q, sizeof q,
        "UPDATE characters SET faction_id=%d, faction_rank=%d WHERE id=%d",
        faction_id, rank, Player_GetCharId(playerid));
    mysql_tquery(g_DB, q);
    new fname[48];
    Faction_GetName(faction_id, fname);
    new buf[120];
    format(buf, sizeof buf, "You joined %s (rank %d).", fname, rank);
    SendSuccess(playerid, buf);
    return 1;
}

stock Faction_Leave(playerid)
{
    Player_SetFaction(playerid, 0, 0);
    new q[140];
    mysql_format(g_DB, q, sizeof q,
        "UPDATE characters SET faction_id=NULL, faction_rank=0 WHERE id=%d",
        Player_GetCharId(playerid));
    mysql_tquery(g_DB, q);
    SendInfo(playerid, "You left your faction.");
    return 1;
}

// /f <message> — faction radio
CMD:f(playerid, params[])
{
    if (!Player_IsLoggedIn(playerid)) return SendError(playerid, "Not logged in.");
    new fac = Player_GetFaction(playerid);
    if (fac == 0) return SendError(playerid, "You are not in a faction.");
    if (isnull(params)) return SendError(playerid, "Usage: /f <message>");

    new fname[48], pname[MAX_PLAYER_NAME], buf[200];
    Faction_GetName(fac, fname);
    GetPlayerName(playerid, pname, sizeof pname);
    format(buf, sizeof buf, "** [%s] %s: %s **", fname, pname, params);
    new idx = Faction_FindIndexById(fac);
    SendFactionMessage(fac, (idx == -1) ? COL_YELLOW : gFaction[idx][e_fac_color], buf);
    return 1;
}
