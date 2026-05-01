// modules/jobs/jobs.inc
// Job framework. Each concrete job lives in its own file and registers an
// entry in `gJob[]` with display data + checkpoint coords. The framework
// handles taking/quitting and routes job-specific events back to the impl.

#if defined _rp_jobs_included
    #endinput
#endif
#define _rp_jobs_included

#define MAX_JOBS    16

enum E_JOB_DATA
{
    e_job_id,
    e_job_name[48],
    e_job_min_level,
    e_job_base_pay,
    bool: e_job_loaded,
}

new gJob[MAX_JOBS][E_JOB_DATA];

stock Job_LoadAll()
{
    mysql_pquery(g_DB,
        "SELECT id,name,min_level,base_pay FROM jobs ORDER BY id",
        "OnJobsLoaded");
}

forward OnJobsLoaded();
public  OnJobsLoaded()
{
    new rows = cache_num_rows();
    if (rows > MAX_JOBS) rows = MAX_JOBS;
    for (new r = 0; r < rows; r++)
    {
        cache_get_value_name_int(r, "id",        gJob[r][e_job_id]);
        cache_get_value_name    (r, "name",      gJob[r][e_job_name], 48);
        cache_get_value_name_int(r, "min_level", gJob[r][e_job_min_level]);
        cache_get_value_name_int(r, "base_pay",  gJob[r][e_job_base_pay]);
        gJob[r][e_job_loaded] = true;
    }
    printf("[JOB] %d jobs loaded", rows);
    return 1;
}

stock Job_FindIndex(job_id)
{
    for (new i = 0; i < MAX_JOBS; i++)
        if (gJob[i][e_job_loaded] && gJob[i][e_job_id] == job_id) return i;
    return -1;
}

stock Job_GetName(job_id, dest[], len = sizeof dest)
{
    new idx = Job_FindIndex(job_id);
    if (idx == -1) { dest[0] = 0; return 0; }
    dest[0] = 0;
    strcat(dest, gJob[idx][e_job_name], len);
    return 1;
}

stock Job_BasePay(job_id)
{
    new idx = Job_FindIndex(job_id);
    if (idx == -1) return 0;
    return gJob[idx][e_job_base_pay];
}

CMD:takejob(playerid, params[])
{
    if (!Player_IsLoggedIn(playerid)) return SendError(playerid, "Not logged in.");
    new job_id;
    if (sscanf(params, "i", job_id))
        return SendError(playerid, "Usage: /takejob <id>  -- list with /jobs");

    new idx = Job_FindIndex(job_id);
    if (idx == -1) return SendError(playerid, "Invalid job id.");
    if (Player_GetLevel(playerid) < gJob[idx][e_job_min_level])
        return SendError(playerid, "You don't meet the level requirement.");

    Player_SetJob(playerid, job_id);
    new q[120];
    mysql_format(g_DB, q, sizeof q,
        "UPDATE characters SET job_id=%d WHERE id=%d",
        job_id, Player_GetCharId(playerid));
    mysql_tquery(g_DB, q);

    new buf[120];
    format(buf, sizeof buf, "You took the job: %s.", gJob[idx][e_job_name]);
    SendSuccess(playerid, buf);
    return 1;
}

CMD:quitjob(playerid, params[])
{
    if (!Player_IsLoggedIn(playerid)) return SendError(playerid, "Not logged in.");
    if (Player_GetJob(playerid) == 0) return SendError(playerid, "You have no job.");
    Player_SetJob(playerid, 0);
    new q[120];
    mysql_format(g_DB, q, sizeof q,
        "UPDATE characters SET job_id=NULL WHERE id=%d", Player_GetCharId(playerid));
    mysql_tquery(g_DB, q);
    SendInfo(playerid, "You quit your job.");
    return 1;
}

CMD:jobs(playerid, params[])
{
    new buf[1024], line[80];
    strcat(buf, "{FFD700}Available jobs:\n");
    for (new i = 0; i < MAX_JOBS; i++)
    {
        if (!gJob[i][e_job_loaded]) continue;
        format(line, sizeof line, "{FFFFFF}#%d  %s  (lvl %d, base $%d)\n",
            gJob[i][e_job_id], gJob[i][e_job_name],
            gJob[i][e_job_min_level], gJob[i][e_job_base_pay]);
        strcat(buf, line);
    }
    ShowPlayerDialog(playerid, DLG_JOB_MENU, DIALOG_STYLE_MSGBOX,
        "Jobs", buf, "Close", "");
    return 1;
}

#include "trucker.inc"
#include "taxi.inc"
