// modules/communication/phone.inc
// Phone system. Each character has a phone_number (assigned on creation,
// stored in characters.phone_number). A phone item is required to call/sms.
//
// State machine per player:
//   IDLE -> OUT_RING / IN_RING -> IN_CALL -> IDLE
//
// Commands:
//   /call <number>  /pickup  /hangup   - voice call
//   /tell <text>                       - speak through the active call
//   /sms <number> <text>               - asynchronous text message
//   /inbox                             - read last 20 received SMS
//
// SMS go through the `sms` table so they survive offline.

#if defined _rp_phone_included
    #endinput
#endif
#define _rp_phone_included

#define PHONE_IDLE      0
#define PHONE_OUT_RING  1
#define PHONE_IN_RING   2
#define PHONE_IN_CALL   3

new gPhoneState[MAX_PLAYERS];
new gPhonePartner[MAX_PLAYERS];   // -1 = none
new gPhoneRingTimer[MAX_PLAYERS]; // SetTimerEx id

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
stock Phone_HasPhone(playerid)
{
    return Inventory_HasItem(playerid, ITEM_PHONE);
}

stock Phone_FindByNumber(number)
{
    foreach (new i: Player)
        if (Player_IsLoggedIn(i) && gPlayer[i][e_phone] == number)
            return i;
    return -1;
}

stock Phone_Reset(playerid)
{
    gPhoneState[playerid]   = PHONE_IDLE;
    gPhonePartner[playerid] = -1;
    if (gPhoneRingTimer[playerid] != 0)
    {
        KillTimer(gPhoneRingTimer[playerid]);
        gPhoneRingTimer[playerid] = 0;
    }
}

stock Phone_AssignNumber(playerid)
{
    if (gPlayer[playerid][e_phone] != 0) return gPlayer[playerid][e_phone];
    new number = PHONE_NUMBER_MIN + random(PHONE_NUMBER_MAX - PHONE_NUMBER_MIN);
    gPlayer[playerid][e_phone] = number;
    new q[140];
    mysql_format(g_DB, q, sizeof q,
        "UPDATE characters SET phone_number=%d WHERE id=%d",
        number, Player_GetCharId(playerid));
    mysql_tquery(g_DB, q);
    return number;
}

// ---------------------------------------------------------------------------
// Lifecycle hooks
// ---------------------------------------------------------------------------
hook OnPlayerConnect(playerid)
{
    gPhoneState[playerid]     = PHONE_IDLE;
    gPhonePartner[playerid]   = -1;
    gPhoneRingTimer[playerid] = 0;
    return 1;
}

hook OnPlayerDisconnect(playerid, reason)
{
    if (gPhoneState[playerid] != PHONE_IDLE)
    {
        new partner = gPhonePartner[playerid];
        if (partner != -1 && IsPlayerConnected(partner))
        {
            SendInfo(partner, "*Call dropped — other side disconnected.*");
            Phone_Reset(partner);
        }
        Phone_Reset(playerid);
    }
    return 1;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------
CMD:phone(playerid, params[])
{
    if (!Player_IsLoggedIn(playerid)) return SendError(playerid, "Not logged in.");
    Phone_AssignNumber(playerid); // ensure assigned for legacy chars
    new buf[140];
    format(buf, sizeof buf,
        "Your number: {FFD700}%d{FFFFFF} | Phone item: %s",
        gPlayer[playerid][e_phone],
        Phone_HasPhone(playerid) ? "{4DFF4D}yes" : "{FF4040}no");
    SendClientMessage(playerid, COL_WHITE, buf);
    return 1;
}

CMD:call(playerid, params[])
{
    if (!Phone_HasPhone(playerid))           return SendError(playerid, "You don't have a phone.");
    if (gPhoneState[playerid] != PHONE_IDLE) return SendError(playerid, "Phone is busy.");
    new number;
    if (sscanf(params, "i", number)) return SendError(playerid, "Usage: /call <number>");
    if (number == gPlayer[playerid][e_phone])
        return SendError(playerid, "You can't call yourself.");

    new target = Phone_FindByNumber(number);
    if (target == -1 || !Phone_HasPhone(target))
        return SendInfo(playerid, "*beep beep beep* — number unavailable.");
    if (gPhoneState[target] != PHONE_IDLE)
        return SendInfo(playerid, "*beep beep beep* — line busy.");

    gPhoneState[playerid]   = PHONE_OUT_RING;
    gPhonePartner[playerid] = target;
    gPhoneState[target]     = PHONE_IN_RING;
    gPhonePartner[target]   = playerid;

    SendInfo(playerid, "*Ringing...*  /hangup to cancel.");
    new buf[120];
    format(buf, sizeof buf,
        "*Phone ringing — caller: %d.  /pickup or /hangup.*",
        gPlayer[playerid][e_phone]);
    SendClientMessage(target, COL_LIGHTBLUE, buf);

    gPhoneRingTimer[playerid] = SetTimerEx("PhoneRingTimeout",
        PHONE_RING_TIMEOUT * 1000, false, "d", playerid);
    return 1;
}

CMD:pickup(playerid, params[])
{
    if (gPhoneState[playerid] != PHONE_IN_RING)
        return SendError(playerid, "No incoming call.");
    new partner = gPhonePartner[playerid];
    if (partner == -1 || !IsPlayerConnected(partner))
    {
        Phone_Reset(playerid);
        return SendError(playerid, "Caller hung up.");
    }
    if (gPhoneRingTimer[partner] != 0)
    {
        KillTimer(gPhoneRingTimer[partner]);
        gPhoneRingTimer[partner] = 0;
    }
    gPhoneState[playerid] = PHONE_IN_CALL;
    gPhoneState[partner]  = PHONE_IN_CALL;
    SendInfo(playerid, "*Connected.*  Use /tell to speak.");
    SendInfo(partner,  "*Call connected.*  Use /tell to speak.");
    return 1;
}

CMD:hangup(playerid, params[])
{
    if (gPhoneState[playerid] == PHONE_IDLE)
        return SendError(playerid, "No active call.");
    new partner = gPhonePartner[playerid];
    Phone_Reset(playerid);
    if (partner != -1 && IsPlayerConnected(partner))
    {
        Phone_Reset(partner);
        SendInfo(partner, "*Other side hung up.*");
    }
    SendInfo(playerid, "*Call ended.*");
    return 1;
}

CMD:tell(playerid, params[])
{
    if (gPhoneState[playerid] != PHONE_IN_CALL)
        return SendError(playerid, "You are not on a call.");
    if (isnull(params)) return SendError(playerid, "Usage: /tell <message>");
    new partner = gPhonePartner[playerid];
    if (partner == -1) { Phone_Reset(playerid); return 1; }

    new pname[MAX_PLAYER_NAME], buf[180];
    GetPlayerName(playerid, pname, sizeof pname);
    format(buf, sizeof buf, "(phone) %s: %s", pname, params);
    SendClientMessage(partner,  COL_YELLOW, buf);
    SendClientMessage(playerid, COL_YELLOW, buf);

    // Bystanders see a /me action
    new amebuf[180];
    format(amebuf, sizeof amebuf, "* %s talks into their phone.", pname);
    SendNearbyMessage(playerid, 10.0, COL_ME, amebuf);
    return 1;
}

forward PhoneRingTimeout(playerid);
public  PhoneRingTimeout(playerid)
{
    if (!IsPlayerConnected(playerid))            return;
    if (gPhoneState[playerid] != PHONE_OUT_RING) return;
    new partner = gPhonePartner[playerid];
    SendInfo(playerid, "*No answer.*");
    if (partner != -1 && IsPlayerConnected(partner))
    {
        SendInfo(partner, "*Missed call.*");
        Phone_Reset(partner);
    }
    Phone_Reset(playerid);
}

// ---------------------------------------------------------------------------
// SMS (async, persisted)
// ---------------------------------------------------------------------------
CMD:sms(playerid, params[])
{
    if (!Phone_HasPhone(playerid)) return SendError(playerid, "You don't have a phone.");
    new number, msg[160];
    if (sscanf(params, "is[160]", number, msg))
        return SendError(playerid, "Usage: /sms <number> <text>");
    if (number == gPlayer[playerid][e_phone])
        return SendError(playerid, "Can't text yourself.");

    new target = Phone_FindByNumber(number);
    if (target == -1)
    {
        // Recipient offline — look up char id by phone number, store anyway
        SetPVarInt(playerid, "sms_pending_number", number);
        SetPVarString(playerid, "sms_pending_body", msg);
        new q[120];
        mysql_format(g_DB, q, sizeof q,
            "SELECT id FROM characters WHERE phone_number=%d LIMIT 1", number);
        mysql_pquery(g_DB, q, "OnSmsLookupOffline", "d", playerid);
        return 1;
    }

    new q[300];
    mysql_format(g_DB, q, sizeof q,
        "INSERT INTO sms (from_char_id, from_number, to_char_id, body) \
         VALUES (%d, %d, %d, '%e')",
        Player_GetCharId(playerid), gPlayer[playerid][e_phone],
        Player_GetCharId(target), msg);
    mysql_tquery(g_DB, q);

    new buf[200];
    format(buf, sizeof buf, "*SMS from %d: %s*", gPlayer[playerid][e_phone], msg);
    SendClientMessage(target, COL_LIGHTBLUE, buf);
    SendSuccess(playerid, "SMS sent.");
    return 1;
}

forward OnSmsLookupOffline(playerid);
public  OnSmsLookupOffline(playerid)
{
    if (!IsPlayerConnected(playerid)) return 1;
    if (cache_num_rows() == 0)
    {
        DeletePVar(playerid, "sms_pending_number");
        DeletePVar(playerid, "sms_pending_body");
        return SendError(playerid, "Number unknown.");
    }
    new to_char;
    cache_get_value_name_int(0, "id", to_char);

    new number = GetPVarInt(playerid, "sms_pending_number");
    new body[160];
    GetPVarString(playerid, "sms_pending_body", body, sizeof body);
    DeletePVar(playerid, "sms_pending_number");
    DeletePVar(playerid, "sms_pending_body");

    new q[300];
    mysql_format(g_DB, q, sizeof q,
        "INSERT INTO sms (from_char_id, from_number, to_char_id, body) \
         VALUES (%d, %d, %d, '%e')",
        Player_GetCharId(playerid), gPlayer[playerid][e_phone], to_char, body);
    mysql_tquery(g_DB, q);
    new buf[60];
    format(buf, sizeof buf, "SMS sent to %d (offline).", number);
    SendSuccess(playerid, buf);
    return 1;
}

CMD:inbox(playerid, params[])
{
    new q[180];
    mysql_format(g_DB, q, sizeof q,
        "SELECT from_number, body, sent_at FROM sms \
         WHERE to_char_id=%d ORDER BY sent_at DESC LIMIT 20",
        Player_GetCharId(playerid));
    mysql_pquery(g_DB, q, "OnInboxLoaded", "d", playerid);
    return 1;
}

forward OnInboxLoaded(playerid);
public  OnInboxLoaded(playerid)
{
    if (!IsPlayerConnected(playerid)) return 1;
    new rows = cache_num_rows();
    if (rows == 0)
    {
        ShowPlayerDialog(playerid, DLG_PHONE_INBOX, DIALOG_STYLE_MSGBOX,
            "Inbox", "Empty.", "Close", "");
        return 1;
    }
    new buf[1500], line[220], from, body[160], sent[24];
    for (new r = 0; r < rows; r++)
    {
        cache_get_value_name_int(r, "from_number", from);
        cache_get_value_name(r, "body",    body, sizeof body);
        cache_get_value_name(r, "sent_at", sent, sizeof sent);
        format(line, sizeof line, "{AFAFAF}%s {FFD700}from %d{FFFFFF}\n%s\n\n",
            sent, from, body);
        if (strlen(buf) + strlen(line) >= sizeof buf - 2) break;
        strcat(buf, line);
    }
    ShowPlayerDialog(playerid, DLG_PHONE_INBOX, DIALOG_STYLE_MSGBOX,
        "Inbox (last 20)", buf, "Close", "");
    return 1;
}
