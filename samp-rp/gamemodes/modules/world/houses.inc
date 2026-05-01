// modules/world/houses.inc
// Houses are exterior pickups + an interior teleport. Ownership is a single
// column on the houses table. Buying transfers cash and sets owner_char.

#if defined _rp_houses_included
    #endinput
#endif
#define _rp_houses_included

#define MAX_HOUSES 1500

enum E_HOUSE_DATA
{
    e_h_id,
    e_h_owner_char,
    e_h_price,
    bool: e_h_locked,
    e_h_interior,
    Float: e_h_ext_x,
    Float: e_h_ext_y,
    Float: e_h_ext_z,
    Float: e_h_int_x,
    Float: e_h_int_y,
    Float: e_h_int_z,
    e_h_pickup,
    Text3D: e_h_label,
    bool: e_h_loaded,
}

new gHouse[MAX_HOUSES][E_HOUSE_DATA];

stock House_LoadAll()
{
    mysql_pquery(g_DB, "SELECT * FROM houses", "OnHousesLoaded");
}

forward OnHousesLoaded();
public  OnHousesLoaded()
{
    new rows = cache_num_rows();
    if (rows > MAX_HOUSES) rows = MAX_HOUSES;
    for (new r = 0; r < rows; r++)
    {
        cache_get_value_name_int  (r, "id",          gHouse[r][e_h_id]);
        cache_get_value_name_int  (r, "owner_char",  gHouse[r][e_h_owner_char]);
        cache_get_value_name_int  (r, "price",       gHouse[r][e_h_price]);
        new locked;
        cache_get_value_name_int  (r, "locked",      locked);
        gHouse[r][e_h_locked] = (locked == 1);
        cache_get_value_name_int  (r, "interior_id", gHouse[r][e_h_interior]);
        cache_get_value_name_float(r, "ext_x",       gHouse[r][e_h_ext_x]);
        cache_get_value_name_float(r, "ext_y",       gHouse[r][e_h_ext_y]);
        cache_get_value_name_float(r, "ext_z",       gHouse[r][e_h_ext_z]);
        cache_get_value_name_float(r, "int_x",       gHouse[r][e_h_int_x]);
        cache_get_value_name_float(r, "int_y",       gHouse[r][e_h_int_y]);
        cache_get_value_name_float(r, "int_z",       gHouse[r][e_h_int_z]);
        gHouse[r][e_h_loaded] = true;

        gHouse[r][e_h_pickup] = CreatePickup(1273, 1,
            gHouse[r][e_h_ext_x], gHouse[r][e_h_ext_y], gHouse[r][e_h_ext_z], -1);

        new label[160];
        if (gHouse[r][e_h_owner_char] == 0)
            format(label, sizeof label,
                "{FFD700}House #%d\n{FFFFFF}For sale: ${%d}\n{AFAFAF}/buyhouse to purchase",
                gHouse[r][e_h_id], gHouse[r][e_h_price]);
        else
            format(label, sizeof label,
                "{FFD700}House #%d\n{FFFFFF}Owned\n{AFAFAF}%s",
                gHouse[r][e_h_id], gHouse[r][e_h_locked] ? "[Locked]" : "[Unlocked]");

        gHouse[r][e_h_label] = Create3DTextLabel(label, COL_WHITE,
            gHouse[r][e_h_ext_x], gHouse[r][e_h_ext_y], gHouse[r][e_h_ext_z] + 0.6,
            20.0, 0, 0);
    }
    printf("[HOUSE] %d houses loaded", rows);
    return 1;
}

stock House_FindNearest(playerid, Float: range = 3.0)
{
    new Float: x, Float: y, Float: z;
    GetPlayerPos(playerid, x, y, z);
    for (new i = 0; i < MAX_HOUSES; i++)
    {
        if (!gHouse[i][e_h_loaded]) continue;
        if (IsPlayerInRangeOfPoint(playerid, range,
                gHouse[i][e_h_ext_x], gHouse[i][e_h_ext_y], gHouse[i][e_h_ext_z]))
            return i;
    }
    return -1;
}

CMD:enter(playerid, params[])
{
    new idx = House_FindNearest(playerid);
    if (idx == -1) return SendError(playerid, "No house nearby.");
    if (gHouse[idx][e_h_locked] && gHouse[idx][e_h_owner_char] != Player_GetCharId(playerid))
        return SendError(playerid, "This house is locked.");

    SetPlayerPos(playerid, gHouse[idx][e_h_int_x], gHouse[idx][e_h_int_y], gHouse[idx][e_h_int_z]);
    SetPlayerInterior(playerid, gHouse[idx][e_h_interior]);
    SetPlayerVirtualWorld(playerid, 1000 + gHouse[idx][e_h_id]);
    SendInfo(playerid, "You entered the house.");
    return 1;
}

CMD:exit(playerid, params[])
{
    new vw = GetPlayerVirtualWorld(playerid);
    if (vw < 1000) return SendError(playerid, "You are not inside a house.");
    new house_id = vw - 1000;
    new idx = -1;
    for (new i = 0; i < MAX_HOUSES; i++)
        if (gHouse[i][e_h_loaded] && gHouse[i][e_h_id] == house_id) { idx = i; break; }
    if (idx == -1) return SendError(playerid, "Your house is missing — contact an admin.");
    SetPlayerPos(playerid, gHouse[idx][e_h_ext_x], gHouse[idx][e_h_ext_y], gHouse[idx][e_h_ext_z]);
    SetPlayerInterior(playerid, 0);
    SetPlayerVirtualWorld(playerid, 0);
    return 1;
}

CMD:hlock(playerid, params[])
{
    new idx = House_FindNearest(playerid);
    if (idx == -1) return SendError(playerid, "No house nearby.");
    if (gHouse[idx][e_h_owner_char] != Player_GetCharId(playerid))
        return SendError(playerid, "You don't own this house.");
    gHouse[idx][e_h_locked] = !gHouse[idx][e_h_locked];

    new q[100];
    mysql_format(g_DB, q, sizeof q,
        "UPDATE houses SET locked=%d WHERE id=%d",
        gHouse[idx][e_h_locked] ? 1 : 0, gHouse[idx][e_h_id]);
    mysql_tquery(g_DB, q);
    SendInfo(playerid, gHouse[idx][e_h_locked] ? "House locked." : "House unlocked.");
    return 1;
}

CMD:buyhouse(playerid, params[])
{
    new idx = House_FindNearest(playerid);
    if (idx == -1)             return SendError(playerid, "No house nearby.");
    if (gHouse[idx][e_h_owner_char] != 0) return SendError(playerid, "Not for sale.");
    if (Player_GetHouseId(playerid) != 0) return SendError(playerid, "You already own a house. Sell it first.");
    if (Player_GetCash(playerid) < gHouse[idx][e_h_price])
        return SendError(playerid, "You can't afford this house.");

    Money_Give(playerid, -gHouse[idx][e_h_price]);
    gHouse[idx][e_h_owner_char] = Player_GetCharId(playerid);
    gPlayer[playerid][e_house_id] = gHouse[idx][e_h_id];

    new q[200];
    mysql_format(g_DB, q, sizeof q,
        "UPDATE houses SET owner_char=%d WHERE id=%d",
        Player_GetCharId(playerid), gHouse[idx][e_h_id]);
    mysql_tquery(g_DB, q);
    mysql_format(g_DB, q, sizeof q,
        "UPDATE characters SET house_id=%d WHERE id=%d",
        gHouse[idx][e_h_id], Player_GetCharId(playerid));
    mysql_tquery(g_DB, q);

    SendSuccess(playerid, "House purchased. Use /enter at the door.");
    return 1;
}
