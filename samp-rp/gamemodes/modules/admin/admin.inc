// modules/admin/admin.inc
// Admin commands gated by Player_GetAdminLevel(). Levels are persisted in
// accounts.admin_level; promote with /setlevel (owner only).

#if defined _rp_admin_included
    #endinput
#endif
#define _rp_admin_included

#define REQUIRE_LEVEL(%0,%1) if (Player_GetAdminLevel(%0) < %1) return SendError(%0, "Insufficient admin level.")

CMD:a(playerid, params[])
{
    REQUIRE_LEVEL(playerid, ADMIN_TRIAL);
    if (isnull(params)) return SendError(playerid, "Usage: /a <message>");
    new pname[MAX_PLAYER_NAME], buf[200];
    GetPlayerName(playerid, pname, sizeof pname);
    format(buf, sizeof buf, "[A][lvl %d] %s: %s",
        Player_GetAdminLevel(playerid), pname, params);
    SendAdminMessage(ADMIN_TRIAL, COL_ADMIN, buf);
    return 1;
}

CMD:goto(playerid, params[])
{
    REQUIRE_LEVEL(playerid, ADMIN_MOD);
    new target;
    if (sscanf(params, "u", target))
        return SendError(playerid, "Usage: /goto <player>");
    if (!IsPlayerConnected(target)) return SendError(playerid, "Player not online.");
    new Float: x, Float: y, Float: z;
    GetPlayerPos(target, x, y, z);
    SetPlayerPos(playerid, x + 1.0, y, z);
    SetPlayerInterior(playerid,    GetPlayerInterior(target));
    SetPlayerVirtualWorld(playerid, GetPlayerVirtualWorld(target));
    return 1;
}

CMD:gethere(playerid, params[])
{
    REQUIRE_LEVEL(playerid, ADMIN_MOD);
    new target;
    if (sscanf(params, "u", target))
        return SendError(playerid, "Usage: /gethere <player>");
    if (!IsPlayerConnected(target)) return SendError(playerid, "Player not online.");
    new Float: x, Float: y, Float: z;
    GetPlayerPos(playerid, x, y, z);
    SetPlayerPos(target, x + 1.0, y, z);
    SetPlayerInterior(target,    GetPlayerInterior(playerid));
    SetPlayerVirtualWorld(target, GetPlayerVirtualWorld(playerid));
    return 1;
}

CMD:akick(playerid, params[])
{
    REQUIRE_LEVEL(playerid, ADMIN_MOD);
    new target, reason[120];
    if (sscanf(params, "us[120]", target, reason))
        return SendError(playerid, "Usage: /akick <player> <reason>");
    if (!IsPlayerConnected(target)) return SendError(playerid, "Player not online.");
    new aname[MAX_PLAYER_NAME], tname[MAX_PLAYER_NAME], buf[180];
    GetPlayerName(playerid, aname, sizeof aname);
    GetPlayerName(target,   tname, sizeof tname);
    format(buf, sizeof buf, "[ADMIN] %s kicked %s: %s", aname, tname, reason);
    SendClientMessageToAll(COL_ADMIN, buf);
    Kick(target);
    return 1;
}

CMD:aban(playerid, params[])
{
    REQUIRE_LEVEL(playerid, ADMIN_ADMIN);
    new target, reason[120];
    if (sscanf(params, "us[120]", target, reason))
        return SendError(playerid, "Usage: /aban <player> <reason>");
    if (!IsPlayerConnected(target)) return SendError(playerid, "Player not online.");

    new q[300], ip[20], aname[MAX_PLAYER_NAME], tname[MAX_PLAYER_NAME];
    GetPlayerIp(target,   ip,    sizeof ip);
    GetPlayerName(playerid, aname, sizeof aname);
    GetPlayerName(target,   tname, sizeof tname);

    mysql_format(g_DB, q, sizeof q,
        "UPDATE accounts SET banned=1, ban_reason='%e', banned_by='%e', banned_until=NULL WHERE id=%d",
        reason, aname, Player_GetAccountId(target));
    mysql_tquery(g_DB, q);
    mysql_format(g_DB, q, sizeof q,
        "INSERT INTO bans (account_id, ip, reason, banned_by) VALUES (%d, '%e', '%e', '%e')",
        Player_GetAccountId(target), ip, reason, aname);
    mysql_tquery(g_DB, q);

    new buf[180];
    format(buf, sizeof buf, "[ADMIN] %s banned %s: %s", aname, tname, reason);
    SendClientMessageToAll(COL_ADMIN, buf);
    Kick(target);
    return 1;
}

CMD:setlevel(playerid, params[])
{
    REQUIRE_LEVEL(playerid, ADMIN_OWNER);
    new target, level;
    if (sscanf(params, "ui", target, level))
        return SendError(playerid, "Usage: /setlevel <player> <0-6>");
    if (!IsPlayerConnected(target)) return SendError(playerid, "Player not online.");
    if (level < 0 || level > 6)     return SendError(playerid, "Level must be 0-6.");

    Player_SetAdminLevel(target, level);
    new q[120];
    mysql_format(g_DB, q, sizeof q,
        "UPDATE accounts SET admin_level=%d WHERE id=%d",
        level, Player_GetAccountId(target));
    mysql_tquery(g_DB, q);

    new tname[MAX_PLAYER_NAME], buf[120];
    GetPlayerName(target, tname, sizeof tname);
    format(buf, sizeof buf, "Set %s to admin level %d.", tname, level);
    SendSuccess(playerid, buf);
    return 1;
}

CMD:setcash(playerid, params[])
{
    REQUIRE_LEVEL(playerid, ADMIN_HEAD);
    new target, amount;
    if (sscanf(params, "ui", target, amount))
        return SendError(playerid, "Usage: /setcash <player> <amount>");
    if (!IsPlayerConnected(target)) return SendError(playerid, "Player not online.");
    Money_Set(target, amount);
    return SendSuccess(playerid, "Cash set.");
}

CMD:heal(playerid, params[])
{
    REQUIRE_LEVEL(playerid, ADMIN_MOD);
    new target;
    if (sscanf(params, "u", target)) target = playerid;
    if (!IsPlayerConnected(target)) return SendError(playerid, "Player not online.");
    SetPlayerHealth(target, 100.0);
    SetPlayerArmour(target, 100.0);
    return SendSuccess(playerid, "Healed.");
}

CMD:freeze(playerid, params[])
{
    REQUIRE_LEVEL(playerid, ADMIN_MOD);
    new target;
    if (sscanf(params, "u", target))
        return SendError(playerid, "Usage: /freeze <player>");
    if (!IsPlayerConnected(target)) return SendError(playerid, "Player not online.");
    TogglePlayerControllable(target, false);
    return SendSuccess(playerid, "Frozen.");
}

CMD:unfreeze(playerid, params[])
{
    REQUIRE_LEVEL(playerid, ADMIN_MOD);
    new target;
    if (sscanf(params, "u", target))
        return SendError(playerid, "Usage: /unfreeze <player>");
    if (!IsPlayerConnected(target)) return SendError(playerid, "Player not online.");
    TogglePlayerControllable(target, true);
    return SendSuccess(playerid, "Unfrozen.");
}
