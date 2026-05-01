// modules/misc/anticheat.inc
// Lightweight anti-cheat: money desync detection, weapon whitelist, teleport
// detection. Runs from a 1-second tick.

#if defined _rp_anticheat_included
    #endinput
#endif
#define _rp_anticheat_included

// Weapons players may legitimately spawn with (others trigger investigation)
static const gWeaponWhitelist[] = {
    0,  // fist
    1,  // brass knuckles
    2,3,4,5,6,7,8,9, // melee
    22,23,24,    // pistols
    25,26,27,    // shotguns
    28,29,32,    // SMGs
    30,31,       // assault
    33,34,       // rifles
    41,42,43,    // spray, extinguisher, camera
    46           // parachute
};

stock IsWeaponAllowed(weaponid)
{
    for (new i = 0; i < sizeof gWeaponWhitelist; i++)
        if (gWeaponWhitelist[i] == weaponid) return 1;
    return 0;
}

forward AC_Tick();
public  AC_Tick()
{
    foreach (new i: Player)
    {
        if (!Player_IsLoggedIn(i)) continue;

        new pname[MAX_PLAYER_NAME];
        GetPlayerName(i, pname, sizeof pname);

        // Money desync (server thinks X, client shows Y)
        new client_money = GetPlayerMoney(i);
        new server_money = Player_GetCash(i);
        if (client_money != server_money)
        {
            if ((client_money - server_money) > 1000)
                printf("[AC] %s money desync: client=%d server=%d",
                    pname, client_money, server_money);
            ResetPlayerMoney(i);
            GivePlayerMoney(i, server_money);
        }

        // Weapon whitelist
        new wep = GetPlayerWeapon(i);
        if (!IsWeaponAllowed(wep))
        {
            new buf[120];
            format(buf, sizeof buf,
                "[AC] %s had illegal weapon %d - removed.", pname, wep);
            SendAdminMessage(ADMIN_MOD, COL_ADMIN, buf);
            ResetPlayerWeapons(i);
        }

        Taxi_Tick(i);
    }
}

// Teleport detection: if a non-driver player jumps > 50m in <1s, log it.
static Float: gLastX[MAX_PLAYERS], Float: gLastY[MAX_PLAYERS], Float: gLastZ[MAX_PLAYERS];

forward AC_PosTick();
public  AC_PosTick()
{
    foreach (new i: Player)
    {
        if (!Player_IsLoggedIn(i))                continue;
        if (Player_GetAdminLevel(i) >= ADMIN_MOD) continue;
        if (IsPlayerInAnyVehicle(i))              continue;

        new Float: x, Float: y, Float: z;
        GetPlayerPos(i, x, y, z);

        if (gLastX[i] != 0.0 || gLastY[i] != 0.0)
        {
            new Float: dx = x - gLastX[i], Float: dy = y - gLastY[i], Float: dz = z - gLastZ[i];
            new Float: d = floatsqroot(dx*dx + dy*dy + dz*dz);
            if (d > 50.0)
            {
                new pname[MAX_PLAYER_NAME], buf[140];
                GetPlayerName(i, pname, sizeof pname);
                format(buf, sizeof buf,
                    "[AC] %s moved %.1fm in 1s on foot.", pname, d);
                SendAdminMessage(ADMIN_MOD, COL_ADMIN, buf);
            }
        }
        gLastX[i] = x; gLastY[i] = y; gLastZ[i] = z;
    }
}
