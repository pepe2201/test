// modules/jobs/taxi.inc
// Taxi: passengers pay per second + per metre while seated as passenger.
// Implementation is light here — accumulates fare per second tick.

#if defined _rp_job_taxi_included
    #endinput
#endif
#define _rp_job_taxi_included

#define JOB_ID_TAXI 2

#define TAXI_BASE_FARE          5    // $ per second the meter is on
#define TAXI_PER_METER_CENTS    2    // 0.02$ per meter

CMD:meter(playerid, params[])
{
    if (Player_GetJob(playerid) != JOB_ID_TAXI)
        return SendError(playerid, "You are not a Taxi driver.");
    if (!IsPlayerInAnyVehicle(playerid))
        return SendError(playerid, "You must be in a vehicle.");
    if (GetPlayerVehicleSeat(playerid) != 0)
        return SendError(playerid, "Only the driver toggles the meter.");

    new on = GetPVarInt(playerid, "taxi_meter") ? 0 : 1;
    SetPVarInt(playerid, "taxi_meter", on);
    SendInfo(playerid, on ? "Meter ON." : "Meter OFF.");
    return 1;
}

// Called from anti-cheat 1s tick (see misc/anticheat.inc) for each player.
stock Taxi_Tick(playerid)
{
    if (Player_GetJob(playerid) != JOB_ID_TAXI) return;
    if (GetPVarInt(playerid, "taxi_meter") != 1) return;
    if (!IsPlayerInAnyVehicle(playerid)) return;
    if (GetPlayerVehicleSeat(playerid) != 0) return;

    new vehid = GetPlayerVehicleID(playerid);

    // Find a passenger
    new fare = TAXI_BASE_FARE;
    foreach (new pid: Player)
    {
        if (pid == playerid) continue;
        if (!IsPlayerInVehicle(pid, vehid)) continue;
        if (GetPlayerVehicleSeat(pid) == 0) continue;

        if (Player_GetCash(pid) < fare)
        {
            SendError(pid, "You can't afford the fare. Get out!");
            continue;
        }
        Money_Give(pid, -fare);
        Money_Give(playerid, fare);
    }
}
