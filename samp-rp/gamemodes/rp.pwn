// =====================================================================
// samp-rp — entry point
// =====================================================================
// Modern, modular SA-MP / open.mp roleplay gamemode.
//
// Build:    sampctl package build
// Run:      sampctl package run
// Schema:   mysql -u root -p < sql/schema.sql
//
// Each subsystem lives under modules/<area>/<file>.inc and registers itself
// via y_hooks. Adding a new module = create the file + add one #include line
// here. Order below matters only for: core (first), player (before any module
// that touches gPlayer), then anything else.
// =====================================================================

#include <a_samp>
#include <a_mysql>
#include <streamer>
#include <sscanf2>
#include <Pawn.CMD>

#define YSI_NO_HEAP_MALLOC
#include <YSI_Coding\y_hooks>
#include <YSI_Data\y_iterate>

// ----- core --------------------------------------------------------------
#include "modules/core/config.inc"
#include "modules/core/database.inc"
// utils.inc references player accessors; include it after character.inc.

// ----- player ------------------------------------------------------------
#include "modules/player/character.inc"
#include "modules/core/utils.inc"
#include "modules/player/inventory.inc"
#include "modules/player/account.inc"

// ----- world & content --------------------------------------------------
#include "modules/factions/factions.inc"
#include "modules/jobs/jobs.inc"
#include "modules/world/vehicles.inc"
#include "modules/world/houses.inc"
#include "modules/economy/banking.inc"
#include "modules/communication/chat.inc"
#include "modules/admin/admin.inc"
#include "modules/misc/anticheat.inc"

// =====================================================================
// Lifecycle
// =====================================================================
main()
{
    print("\n----------------------------------");
    print(" samp-rp gamemode loading");
    print("----------------------------------\n");
}

public OnGameModeInit()
{
    SetGameModeText("samp-rp");
    ShowPlayerMarkers(PLAYER_MARKERS_MODE_STREAMED);
    ShowNameTags(1);
    EnableStuntBonusForAll(0);
    DisableInteriorEnterExits();
    UsePlayerPedAnims();

    DB_Connect();

    Faction_LoadAll();
    Job_LoadAll();
    Vehicle_LoadAll();
    House_LoadAll();

    SetTimer("AC_Tick",          1000, true);
    SetTimer("AC_PosTick",       1000, true);
    SetTimer("Vehicle_FuelTick",60000, true);
    SetTimer("Paycheck_Tick",   60000, true);

    return 1;
}

public OnGameModeExit()
{
    foreach (new i: Player)
    {
        if (Player_IsLoggedIn(i))
        {
            Player_SaveCharacter(i);
            Inventory_Save(i);
        }
    }
    DB_Close();
    return 1;
}

public OnPlayerRequestClass(playerid, classid)
{
    SetPlayerPos(playerid, SPAWN_X, SPAWN_Y, SPAWN_Z + 25.0);
    SetPlayerCameraPos(playerid, SPAWN_X, SPAWN_Y, SPAWN_Z + 30.0);
    SetPlayerCameraLookAt(playerid, SPAWN_X, SPAWN_Y, SPAWN_Z);
    return 1;
}

public OnPlayerSpawn(playerid)
{
    if (!Player_IsLoggedIn(playerid))
    {
        SetPlayerPos(playerid, SPAWN_X, SPAWN_Y, SPAWN_Z);
        TogglePlayerControllable(playerid, false);
        return 1;
    }
    if (gPlayer[playerid][e_spawn_pos_loaded])
    {
        SetPlayerPos(playerid,
            gPlayer[playerid][e_spawn_x], gPlayer[playerid][e_spawn_y],
            gPlayer[playerid][e_spawn_z]);
        SetPlayerFacingAngle(playerid, gPlayer[playerid][e_spawn_a]);
        SetPlayerInterior(playerid,    gPlayer[playerid][e_spawn_int]);
        SetPlayerVirtualWorld(playerid, gPlayer[playerid][e_spawn_vw]);
    }
    SetPlayerHealth(playerid, gPlayer[playerid][e_health]);
    SetPlayerArmour(playerid, gPlayer[playerid][e_armour]);
    Money_Set(playerid, Player_GetCash(playerid));
    TogglePlayerControllable(playerid, true);
    return 1;
}

public OnPlayerDeath(playerid, killerid, reason)
{
    SendDeathMessage(killerid, playerid, reason);
    if (Player_IsLoggedIn(playerid))
    {
        // Drop a chunk of cash on death
        new loss = Player_GetCash(playerid) / 10;
        Money_Give(playerid, -loss);
    }
    return 1;
}

public OnVehicleSpawn(vehicleid)
{
    new idx = Vehicle_FindIndexBySamp(vehicleid);
    if (idx == -1) return 1;
    SetVehicleHealth(vehicleid, gVehicle[idx][e_v_health]);
    return 1;
}

public OnPlayerEnterVehicle(playerid, vehicleid, ispassenger)
{
    new idx = Vehicle_FindIndexBySamp(vehicleid);
    if (idx == -1) return 1;
    if (gVehicle[idx][e_v_locked] && !ispassenger)
    {
        if (gVehicle[idx][e_v_owner_char] != Player_GetCharId(playerid))
            SendError(playerid, "This vehicle is locked.");
    }
    return 1;
}

// Universal command guard — block commands before login except register/login.
public OnPlayerCommandReceived(playerid, cmdtext[])
{
    if (Player_IsLoggedIn(playerid)) return 1;
    SendError(playerid, "You must log in first.");
    return 0;
}

// Stats command — quick HUD
CMD:stats(playerid, params[])
{
    if (!Player_IsLoggedIn(playerid)) return SendError(playerid, "Not logged in.");
    new fname[48], jname[48], pname[MAX_PLAYER_NAME];
    Faction_GetName(Player_GetFaction(playerid), fname);
    Job_GetName    (Player_GetJob(playerid),     jname);
    GetPlayerName  (playerid, pname, sizeof pname);

    new buf[600];
    format(buf, sizeof buf,
        "{FFD700}== %s ==\n"
        "{FFFFFF}Level: {FFD700}%d  {FFFFFF}EXP: {FFD700}%d\n"
        "{FFFFFF}Cash: {4DFF4D}$%d  {FFFFFF}Bank: {4DFF4D}$%d\n"
        "{FFFFFF}Faction: {1E90FF}%s {FFFFFF}(rank %d)\n"
        "{FFFFFF}Job: {1E90FF}%s\n"
        "{FFFFFF}Wanted: {FF4040}%d  {FFFFFF}Played: {FFFFFF}%d min",
        pname,
        Player_GetLevel(playerid), gPlayer[playerid][e_exp],
        Player_GetCash(playerid),  Player_GetBank(playerid),
        fname[0] ? fname : "Civilian", Player_GetFactionRank(playerid),
        jname[0] ? jname : "Unemployed",
        Player_GetWanted(playerid), gPlayer[playerid][e_minutes_played]);

    ShowPlayerDialog(playerid, 9000, DIALOG_STYLE_MSGBOX,
        "Stats", buf, "Close", "");
    return 1;
}

CMD:help(playerid, params[])
{
    static const help[] =
        "{FFD700}Roleplay\n"
        "{FFFFFF}/me /do /low /shout /b /pm\n\n"
        "{FFD700}Economy\n"
        "{FFFFFF}/bank  /stats\n\n"
        "{FFD700}Property\n"
        "{FFFFFF}/enter /exit /hlock /buyhouse /vlock\n\n"
        "{FFD700}Jobs\n"
        "{FFFFFF}/jobs /takejob /quitjob /work /deliver /meter\n\n"
        "{FFD700}Faction\n"
        "{FFFFFF}/f <msg>\n\n"
        "{FFD700}Admin\n"
        "{FFFFFF}/a /goto /gethere /heal /freeze /unfreeze /akick /aban /setcash /setlevel";
    ShowPlayerDialog(playerid, 9001, DIALOG_STYLE_MSGBOX,
        "Commands", help, "Close", "");
    return 1;
}
