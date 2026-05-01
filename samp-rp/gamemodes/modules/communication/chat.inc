// modules/communication/chat.inc
// Roleplay chat: replaces the default text chat with a proximity-based local
// chat at 20m, plus standard RP commands.
//
// Ranges (matches Godfather conventions):
//   /low    5m      whisper
//   normal  20m     speech
//   /shout  40m     shout
//   /me     20m     action emote
//   /do     20m     scene description
//   /b /ooc 20m     out-of-character (grey)

#if defined _rp_chat_included
    #endinput
#endif
#define _rp_chat_included

#define CHAT_RANGE_LOW      5.0
#define CHAT_RANGE_NORMAL   20.0
#define CHAT_RANGE_SHOUT    40.0

hook OnPlayerText(playerid, text[])
{
    if (!Player_IsLoggedIn(playerid)) return 0;

    new name[MAX_PLAYER_NAME], buf[160];
    GetPlayerName(playerid, name, sizeof name);
    format(buf, sizeof buf, "%s says: %s", name, text);
    SendNearbyMessage(playerid, CHAT_RANGE_NORMAL, COL_WHITE, buf);
    return 0; // suppress default broadcast
}

CMD:low(playerid, params[])
{
    if (isnull(params)) return SendError(playerid, "Usage: /low <text>");
    new name[MAX_PLAYER_NAME], buf[160];
    GetPlayerName(playerid, name, sizeof name);
    format(buf, sizeof buf, "%s says (low): %s", name, params);
    SendNearbyMessage(playerid, CHAT_RANGE_LOW, COL_GREY, buf);
    return 1;
}

CMD:shout(playerid, params[])
{
    if (isnull(params)) return SendError(playerid, "Usage: /shout <text>");
    new name[MAX_PLAYER_NAME], buf[160];
    GetPlayerName(playerid, name, sizeof name);
    format(buf, sizeof buf, "%s shouts: %s!", name, params);
    SendNearbyMessage(playerid, CHAT_RANGE_SHOUT, COL_YELLOW, buf);
    return 1;
}
ALIAS:shout("s", "y");

CMD:me(playerid, params[])
{
    if (isnull(params)) return SendError(playerid, "Usage: /me <action>");
    new name[MAX_PLAYER_NAME], buf[160];
    GetPlayerName(playerid, name, sizeof name);
    format(buf, sizeof buf, "* %s %s", name, params);
    SendNearbyMessage(playerid, CHAT_RANGE_NORMAL, COL_ME, buf);
    return 1;
}

CMD:do(playerid, params[])
{
    if (isnull(params)) return SendError(playerid, "Usage: /do <description>");
    new name[MAX_PLAYER_NAME], buf[160];
    GetPlayerName(playerid, name, sizeof name);
    format(buf, sizeof buf, "* %s (( %s ))", params, name);
    SendNearbyMessage(playerid, CHAT_RANGE_NORMAL, COL_DO, buf);
    return 1;
}

CMD:ooc(playerid, params[])
{
    if (isnull(params)) return SendError(playerid, "Usage: /ooc <text>");
    new name[MAX_PLAYER_NAME], buf[160];
    GetPlayerName(playerid, name, sizeof name);
    format(buf, sizeof buf, "(( %s: %s ))", name, params);
    SendNearbyMessage(playerid, CHAT_RANGE_NORMAL, COL_OOC, buf);
    return 1;
}
ALIAS:ooc("b");

CMD:pm(playerid, params[])
{
    new target, msg[120];
    if (sscanf(params, "us[120]", target, msg))
        return SendError(playerid, "Usage: /pm <player> <message>");
    if (!IsPlayerConnected(target) || !Player_IsLoggedIn(target))
        return SendError(playerid, "Player not online.");

    new sname[MAX_PLAYER_NAME], tname[MAX_PLAYER_NAME], buf[160];
    GetPlayerName(playerid, sname, sizeof sname);
    GetPlayerName(target,   tname, sizeof tname);

    format(buf, sizeof buf, "PM from %s: %s", sname, msg);
    SendClientMessage(target,   COL_LIGHTBLUE, buf);
    format(buf, sizeof buf, "PM to %s: %s",   tname, msg);
    SendClientMessage(playerid, COL_LIGHTBLUE, buf);
    return 1;
}
