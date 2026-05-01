// modules/jobs/trucker.inc
// Trucker: pick up cargo at depot, deliver to rotating destinations, get paid
// per km plus base. Cheap and stateless — destination is stored on the player
// via PVar so a server restart doesn't strand a half-finished delivery.

#if defined _rp_job_trucker_included
    #endinput
#endif
#define _rp_job_trucker_included

#define JOB_ID_TRUCKER 1

static const Float: gTruckerPickup[3] = {2174.0, -1985.0, 13.5}; // LS depot
static const Float: gTruckerDest[][3] = {
    {-1959.0, 137.0, 27.7},   // SF
    {1369.0, 459.0, 20.1},    // LV outskirts
    {2533.0, 2057.0, 10.8}    // LV
};

CMD:work(playerid, params[])
{
    if (Player_GetJob(playerid) != JOB_ID_TRUCKER)
        return SendError(playerid, "You are not a Trucker.");

    if (GetPVarInt(playerid, "trk_active") == 1)
        return SendError(playerid, "You already have an active delivery. /deliver to finish it.");

    if (!IsPlayerInRangeOfPoint(playerid, 6.0,
            gTruckerPickup[0], gTruckerPickup[1], gTruckerPickup[2]))
        return SendError(playerid, "Go to the LS cargo depot to start a job.");

    new dest = random(sizeof gTruckerDest);
    SetPVarInt  (playerid, "trk_active", 1);
    SetPVarInt  (playerid, "trk_dest",   dest);
    SetPVarFloat(playerid, "trk_dist0",
        GetPlayerDistanceFromPoint(playerid,
            gTruckerDest[dest][0], gTruckerDest[dest][1], gTruckerDest[dest][2]));

    SetPlayerCheckpoint(playerid,
        gTruckerDest[dest][0], gTruckerDest[dest][1], gTruckerDest[dest][2], 6.0);

    SendInfo(playerid, "Cargo loaded. Drive to the marker — /deliver when there.");
    return 1;
}

CMD:deliver(playerid, params[])
{
    if (GetPVarInt(playerid, "trk_active") != 1)
        return SendError(playerid, "You have no active delivery.");

    new dest = GetPVarInt(playerid, "trk_dest");
    if (!IsPlayerInRangeOfPoint(playerid, 8.0,
            gTruckerDest[dest][0], gTruckerDest[dest][1], gTruckerDest[dest][2]))
        return SendError(playerid, "You are not at the destination.");

    new Float: d0 = GetPVarFloat(playerid, "trk_dist0");
    new pay = Job_BasePay(JOB_ID_TRUCKER) + floatround(d0 * 0.1);

    Money_Give(playerid, pay);
    DisablePlayerCheckpoint(playerid);
    DeletePVar(playerid, "trk_active");
    DeletePVar(playerid, "trk_dest");
    DeletePVar(playerid, "trk_dist0");

    new buf[80];
    format(buf, sizeof buf, "Delivery complete. Paid $%d.", pay);
    SendSuccess(playerid, buf);
    return 1;
}
