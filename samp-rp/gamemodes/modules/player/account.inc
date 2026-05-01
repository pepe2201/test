// modules/player/account.inc
// Register / login flow with bcrypt-hashed passwords. Drives the dialog FSM
// for unauthenticated players.

#if defined _rp_account_included
    #endinput
#endif
#define _rp_account_included

#include <samp_bcrypt>

// ---------------------------------------------------------------------------
// Connect — kick off the account lookup
// ---------------------------------------------------------------------------
hook OnPlayerConnect(playerid)
{
    Player_ResetData(playerid);

    // Strip RCON access by default
    SetPVarInt(playerid, "muted", 0);

    new pname[MAX_PLAYER_NAME];
    GetPlayerName(playerid, pname, sizeof pname);

    new q[140];
    mysql_format(g_DB, q, sizeof q,
        "SELECT id, password_hash, admin_level, vip_level, banned, ban_reason \
         FROM accounts WHERE username='%e' LIMIT 1", pname);
    mysql_pquery(g_DB, q, "OnAccountLookup", "d", playerid);

    GameTextForPlayer(playerid, "~w~samp-rp~n~~y~Login", 4000, 4);
    return 1;
}

forward OnAccountLookup(playerid);
public  OnAccountLookup(playerid)
{
    new rows = cache_num_rows();
    if (rows == 0)
    {
        ShowRegisterDialog(playerid, false);
        return 1;
    }

    new banned;
    cache_get_value_name_int(0, "banned",      banned);
    cache_get_value_name_int(0, "id",          gPlayer[playerid][e_account_id]);
    cache_get_value_name_int(0, "admin_level", gPlayer[playerid][e_admin_level]);
    cache_get_value_name_int(0, "vip_level",   gPlayer[playerid][e_vip_level]);

    if (banned)
    {
        new reason[160];
        cache_get_value_name(0, "ban_reason", reason, sizeof reason);
        new buf[200];
        format(buf, sizeof buf, "You are banned. Reason: %s", reason);
        SendClientMessage(playerid, COL_RED, buf);
        Kick(playerid);
        return 1;
    }
    ShowLoginDialog(playerid, false);
    return 1;
}

// ---------------------------------------------------------------------------
// Dialogs
// ---------------------------------------------------------------------------
ShowLoginDialog(playerid, retry)
{
    static const caption[] = "Login";
    new body[256];
    if (retry)
        format(body, sizeof body,
            ""EMB_RED"Wrong password. "EMB_WHITE"Enter your password:\n\n"EMB_GREY"Attempts left: %d",
            MAX_LOGIN_ATTEMPTS - gPlayer[playerid][e_login_attempts]);
    else
        format(body, sizeof body,
            ""EMB_WHITE"Welcome back. Enter your password:");

    ShowPlayerDialog(playerid, DLG_LOGIN, DIALOG_STYLE_PASSWORD,
        caption, body, "Login", "Quit");
}

ShowRegisterDialog(playerid, mismatch)
{
    static const caption[] = "Register";
    new body[256];
    if (mismatch)
        format(body, sizeof body,
            ""EMB_RED"Password too short / invalid.\n\n"
            ""EMB_WHITE"Choose a password (%d-%d chars):",
            MIN_PASSWORD_LEN, MAX_PASSWORD_LEN);
    else
        format(body, sizeof body,
            ""EMB_WHITE"Welcome. This name is not registered.\n\n"
            "Choose a password (%d-%d chars):",
            MIN_PASSWORD_LEN, MAX_PASSWORD_LEN);

    ShowPlayerDialog(playerid, DLG_REGISTER, DIALOG_STYLE_PASSWORD,
        caption, body, "Register", "Quit");
}

public Player_ShowCharCreateDialog(playerid)
{
    new name[MAX_PLAYER_NAME], q[200];
    GetPlayerName(playerid, name, sizeof name);
    mysql_format(g_DB, q, sizeof q,
        "INSERT INTO characters (account_id, name, cash) \
         VALUES (%d, '%e', %d)",
        Player_GetAccountId(playerid), name, STARTING_CASH);
    mysql_pquery(g_DB, q, "OnCharacterCreated", "d", playerid);
    return 1;
}

forward OnCharacterCreated(playerid);
public  OnCharacterCreated(playerid)
{
    new id = cache_insert_id();
    gPlayer[playerid][e_char_id] = id;
    gPlayer[playerid][e_cash]    = STARTING_CASH;
    SendInfo(playerid, "Character created. Welcome to the city.");
    SetSpawnInfo(playerid, NO_TEAM, 0, SPAWN_X, SPAWN_Y, SPAWN_Z, SPAWN_A, 0,0,0,0,0,0);
    SpawnPlayer(playerid);
    return 1;
}

// ---------------------------------------------------------------------------
// Dialog responses
// ---------------------------------------------------------------------------
hook OnDialogResponse(playerid, dialogid, response, listitem, inputtext[])
{
    switch (dialogid)
    {
        case DLG_REGISTER:
        {
            if (!response) { Kick(playerid); return 1; }
            new len = strlen(inputtext);
            if (len < MIN_PASSWORD_LEN || len > MAX_PASSWORD_LEN)
            {
                ShowRegisterDialog(playerid, true);
                return 1;
            }
            bcrypt_hash(playerid, "OnRegisterHash", inputtext, BCRYPT_COST);
            return 1;
        }
        case DLG_LOGIN:
        {
            if (!response) { Kick(playerid); return 1; }
            new q[140];
            mysql_format(g_DB, q, sizeof q,
                "SELECT password_hash FROM accounts WHERE id=%d LIMIT 1",
                Player_GetAccountId(playerid));

            // Re-fetch hash, then bcrypt_check on result.
            // We pass the typed password through a PVar so it survives the async hop.
            SetPVarString(playerid, "pw_attempt", inputtext);
            mysql_pquery(g_DB, q, "OnLoginHashFetched", "d", playerid);
            return 1;
        }
    }
    return 0;
}

forward OnRegisterHash(playerid);
public  OnRegisterHash(playerid)
{
    new hash[BCRYPT_HASH_LENGTH];
    bcrypt_get_hash(hash);

    new ip[20], pname[MAX_PLAYER_NAME];
    GetPlayerIp(playerid,   ip,    sizeof ip);
    GetPlayerName(playerid, pname, sizeof pname);

    new q[300];
    mysql_format(g_DB, q, sizeof q,
        "INSERT INTO accounts (username, password_hash, last_ip, last_login) \
         VALUES ('%e', '%e', '%e', NOW())",
        pname, hash, ip);
    mysql_pquery(g_DB, q, "OnAccountInserted", "d", playerid);
    return 1;
}

forward OnAccountInserted(playerid);
public  OnAccountInserted(playerid)
{
    gPlayer[playerid][e_account_id] = cache_insert_id();
    gPlayer[playerid][e_logged_in]  = 1;
    SendSuccess(playerid, "Account registered. Creating your character...");
    Player_ShowCharCreateDialog(playerid);
    return 1;
}

forward OnLoginHashFetched(playerid);
public  OnLoginHashFetched(playerid)
{
    if (cache_num_rows() == 0) { Kick(playerid); return 1; }
    new hash[BCRYPT_HASH_LENGTH];
    cache_get_value_name(0, "password_hash", hash, sizeof hash);

    new attempt[MAX_PASSWORD_LEN + 1];
    GetPVarString(playerid, "pw_attempt", attempt, sizeof attempt);
    DeletePVar(playerid, "pw_attempt");

    bcrypt_verify(playerid, "OnLoginVerified", attempt, hash);
    return 1;
}

forward OnLoginVerified(playerid, bool: success);
public  OnLoginVerified(playerid, bool: success)
{
    if (!success)
    {
        gPlayer[playerid][e_login_attempts]++;
        if (gPlayer[playerid][e_login_attempts] >= MAX_LOGIN_ATTEMPTS)
        {
            SendClientMessage(playerid, COL_RED, "Too many failed attempts.");
            Kick(playerid);
            return 1;
        }
        ShowLoginDialog(playerid, true);
        return 1;
    }
    gPlayer[playerid][e_logged_in] = 1;

    new ip[20];
    GetPlayerIp(playerid, ip, sizeof ip);
    new q[200];
    mysql_format(g_DB, q, sizeof q,
        "UPDATE accounts SET last_ip='%e', last_login=NOW() WHERE id=%d",
        ip, Player_GetAccountId(playerid));
    mysql_tquery(g_DB, q);

    SendSuccess(playerid, "Logged in.");
    Player_LoadCharacter(playerid);
    return 1;
}

// ---------------------------------------------------------------------------
// Disconnect — persist + cleanup
// ---------------------------------------------------------------------------
hook OnPlayerDisconnect(playerid, reason)
{
    if (Player_IsLoggedIn(playerid))
    {
        Player_SaveCharacter(playerid);
        Inventory_Save(playerid);
    }
    Player_ResetData(playerid);
    return 1;
}
