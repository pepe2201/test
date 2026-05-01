// modules/core/utils.inc
// Cross-cutting helpers: messaging, name lookup, money sync.

#if defined _rp_utils_included
    #endinput
#endif
#define _rp_utils_included

// ---------------------------------------------------------------------------
// Use this pattern to look up a name into a local buffer:
//   new name[MAX_PLAYER_NAME]; GetPlayerName(playerid, name, sizeof name);
// Pawn doesn't support returning strings reliably, so all callers do this
// explicitly rather than relying on a helper.
// ---------------------------------------------------------------------------

stock SendError(playerid, const msg[])
{
    new buf[160];
    format(buf, sizeof buf, "[ERROR] %s", msg);
    return SendClientMessage(playerid, COL_RED, buf);
}

stock SendInfo(playerid, const msg[])
{
    new buf[160];
    format(buf, sizeof buf, "[INFO] %s", msg);
    return SendClientMessage(playerid, COL_LIGHTBLUE, buf);
}

stock SendSuccess(playerid, const msg[])
{
    new buf[160];
    format(buf, sizeof buf, "[OK] %s", msg);
    return SendClientMessage(playerid, COL_GREEN, buf);
}

stock SendFactionMessage(faction_id, color, const msg[])
{
    foreach (new i: Player)
        if (Player_GetFaction(i) == faction_id)
            SendClientMessage(i, color, msg);
}

stock SendAdminMessage(min_level, color, const msg[])
{
    foreach (new i: Player)
        if (Player_GetAdminLevel(i) >= min_level)
            SendClientMessage(i, color, msg);
}

stock SendNearbyMessage(playerid, Float: range, color, const msg[])
{
    new Float: x, Float: y, Float: z,
        vw = GetPlayerVirtualWorld(playerid),
        ix = GetPlayerInterior(playerid);
    GetPlayerPos(playerid, x, y, z);
    foreach (new i: Player)
    {
        if (GetPlayerVirtualWorld(i) != vw) continue;
        if (GetPlayerInterior(i)     != ix) continue;
        if (!IsPlayerInRangeOfPoint(i, range, x, y, z)) continue;
        SendClientMessage(i, color, msg);
    }
}

stock IsValidName(const name[])
{
    new len = strlen(name);
    if (len < 3 || len > 24) return 0;
    for (new i = 0; i < len; i++)
    {
        new c = name[i];
        if (!((c >= 'a' && c <= 'z') ||
              (c >= 'A' && c <= 'Z') ||
              (c >= '0' && c <= '9') ||
               c == '_' || c == '.'))
            return 0;
    }
    return 1;
}

// Anti-cheat-aware money setter. Always go through this.
stock Money_Set(playerid, amount)
{
    if (amount < 0) amount = 0;
    if (amount > MAX_CASH_SANE) amount = MAX_CASH_SANE;
    ResetPlayerMoney(playerid);
    GivePlayerMoney(playerid, amount);
    Player_SetCash(playerid, amount);
}

stock Money_Give(playerid, delta)
{
    Money_Set(playerid, Player_GetCash(playerid) + delta);
}
