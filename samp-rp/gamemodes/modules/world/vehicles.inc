// modules/world/vehicles.inc
// Persistent vehicles. Loaded once at startup, spawned via CreateVehicle, and
// indexed both by SAMP id (gVehSampToDb) and DB id (gVehicle[]).

#if defined _rp_vehicles_included
    #endinput
#endif
#define _rp_vehicles_included

#define MAX_RP_VEHICLES   1500

enum E_VEH_DATA
{
    e_v_db_id,
    e_v_samp_id,
    e_v_model,
    e_v_owner_char,
    e_v_owner_fac,
    e_v_plate[10],
    Float: e_v_x,
    Float: e_v_y,
    Float: e_v_z,
    Float: e_v_a,
    e_v_color1,
    e_v_color2,
    e_v_fuel,
    bool: e_v_locked,
    Float: e_v_health,
    e_v_interior,
    e_v_vw,
    bool: e_v_loaded,
}

new gVehicle[MAX_RP_VEHICLES][E_VEH_DATA];
new gVehSampToDb[MAX_VEHICLES];   // sampid -> db id, 0 = none

stock Vehicle_LoadAll()
{
    for (new i = 0; i < MAX_VEHICLES; i++) gVehSampToDb[i] = 0;
    mysql_pquery(g_DB, "SELECT * FROM vehicles", "OnVehiclesLoaded");
}

forward OnVehiclesLoaded();
public  OnVehiclesLoaded()
{
    new rows = cache_num_rows();
    if (rows > MAX_RP_VEHICLES) rows = MAX_RP_VEHICLES;
    for (new r = 0; r < rows; r++)
    {
        cache_get_value_name_int  (r, "id",            gVehicle[r][e_v_db_id]);
        cache_get_value_name_int  (r, "model",         gVehicle[r][e_v_model]);
        cache_get_value_name_int  (r, "owner_char",    gVehicle[r][e_v_owner_char]);
        cache_get_value_name_int  (r, "owner_faction", gVehicle[r][e_v_owner_fac]);
        cache_get_value_name      (r, "plate",         gVehicle[r][e_v_plate], 10);
        cache_get_value_name_float(r, "pos_x",         gVehicle[r][e_v_x]);
        cache_get_value_name_float(r, "pos_y",         gVehicle[r][e_v_y]);
        cache_get_value_name_float(r, "pos_z",         gVehicle[r][e_v_z]);
        cache_get_value_name_float(r, "pos_a",         gVehicle[r][e_v_a]);
        cache_get_value_name_int  (r, "color1",        gVehicle[r][e_v_color1]);
        cache_get_value_name_int  (r, "color2",        gVehicle[r][e_v_color2]);
        cache_get_value_name_int  (r, "fuel",          gVehicle[r][e_v_fuel]);
        new locked;
        cache_get_value_name_int  (r, "locked",        locked);
        gVehicle[r][e_v_locked] = (locked == 1);
        cache_get_value_name_float(r, "health",        gVehicle[r][e_v_health]);
        cache_get_value_name_int  (r, "interior",      gVehicle[r][e_v_interior]);
        cache_get_value_name_int  (r, "virtual_world", gVehicle[r][e_v_vw]);
        gVehicle[r][e_v_loaded] = true;

        new sid = CreateVehicle(gVehicle[r][e_v_model],
            gVehicle[r][e_v_x], gVehicle[r][e_v_y], gVehicle[r][e_v_z],
            gVehicle[r][e_v_a],
            gVehicle[r][e_v_color1], gVehicle[r][e_v_color2], -1, 0);
        gVehicle[r][e_v_samp_id] = sid;
        if (sid >= 0 && sid < MAX_VEHICLES) gVehSampToDb[sid] = gVehicle[r][e_v_db_id];

        LinkVehicleToInterior(sid, gVehicle[r][e_v_interior]);
        SetVehicleVirtualWorld(sid, gVehicle[r][e_v_vw]);
        SetVehicleHealth(sid, gVehicle[r][e_v_health]);
        if (gVehicle[r][e_v_locked]) SetVehicleParamsEx(sid, 0,0,0, 1, 0,0,0);
    }
    printf("[VEH] %d persistent vehicles loaded", rows);
    return 1;
}

stock Vehicle_FindIndexBySamp(sampid)
{
    if (sampid <= 0 || sampid >= MAX_VEHICLES) return -1;
    new db_id = gVehSampToDb[sampid];
    if (db_id == 0) return -1;
    for (new i = 0; i < MAX_RP_VEHICLES; i++)
        if (gVehicle[i][e_v_loaded] && gVehicle[i][e_v_db_id] == db_id) return i;
    return -1;
}

stock Vehicle_OwnerChar(sampid)
{
    new idx = Vehicle_FindIndexBySamp(sampid);
    if (idx == -1) return 0;
    return gVehicle[idx][e_v_owner_char];
}

CMD:vlock(playerid, params[])
{
    new vid = GetPlayerVehicleID(playerid);
    if (vid == 0)
    {
        // Find nearest persistent vehicle within 5m
        new Float: x, Float: y, Float: z;
        GetPlayerPos(playerid, x, y, z);
        for (new i = 0; i < MAX_RP_VEHICLES; i++)
        {
            if (!gVehicle[i][e_v_loaded]) continue;
            if (GetVehicleDistanceFromPoint(gVehicle[i][e_v_samp_id], x, y, z) > 5.0) continue;
            vid = gVehicle[i][e_v_samp_id];
            break;
        }
    }
    if (vid == 0) return SendError(playerid, "No vehicle nearby.");

    new idx = Vehicle_FindIndexBySamp(vid);
    if (idx == -1) return SendError(playerid, "That vehicle is not lockable.");
    if (gVehicle[idx][e_v_owner_char] != Player_GetCharId(playerid))
        return SendError(playerid, "You don't own this vehicle.");

    gVehicle[idx][e_v_locked] = !gVehicle[idx][e_v_locked];
    SetVehicleParamsEx(vid, 0,0,0, gVehicle[idx][e_v_locked] ? 1 : 0, 0,0,0);

    new q[100];
    mysql_format(g_DB, q, sizeof q,
        "UPDATE vehicles SET locked=%d WHERE id=%d",
        gVehicle[idx][e_v_locked] ? 1 : 0, gVehicle[idx][e_v_db_id]);
    mysql_tquery(g_DB, q);
    SendInfo(playerid, gVehicle[idx][e_v_locked] ? "Vehicle locked." : "Vehicle unlocked.");
    return 1;
}

// Fuel tick: drain 1% every 60s while engine is on.
forward Vehicle_FuelTick();
public  Vehicle_FuelTick()
{
    for (new i = 0; i < MAX_RP_VEHICLES; i++)
    {
        if (!gVehicle[i][e_v_loaded]) continue;
        new sid = gVehicle[i][e_v_samp_id];
        new engine, lights, alarm, doors, bonnet, boot, objective;
        GetVehicleParamsEx(sid, engine, lights, alarm, doors, bonnet, boot, objective);
        if (engine != 1) continue;
        if (gVehicle[i][e_v_fuel] > 0) gVehicle[i][e_v_fuel]--;
        if (gVehicle[i][e_v_fuel] == 0)
            SetVehicleParamsEx(sid, 0, lights, alarm, doors, bonnet, boot, objective);
    }
}
