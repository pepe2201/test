// modules/core/database.inc
// Single owner of the MySQL handle. Every other module pulls `g_DB` from here.

#if defined _rp_database_included
    #endinput
#endif
#define _rp_database_included

#include <a_mysql>

new MySQL: g_DB = MYSQL_INVALID_HANDLE;

stock DB_Connect()
{
    new MySQLOpt: opt = mysql_init_options();
    mysql_set_option(opt, AUTO_RECONNECT, true);
    mysql_set_option(opt, MULTI_STATEMENTS, false);

    g_DB = mysql_connect(MYSQL_HOST, MYSQL_USER, MYSQL_PASS, MYSQL_DB, opt);
    if (g_DB == MYSQL_INVALID_HANDLE || mysql_errno(g_DB) != 0)
    {
        printf("[DB] FATAL: connection failed (errno %d)", mysql_errno(g_DB));
        SendRconCommand("exit");
        return 0;
    }
    mysql_log(ERROR | WARNING);
    printf("[DB] connected to %s@%s/%s", MYSQL_USER, MYSQL_HOST, MYSQL_DB);
    return 1;
}

stock DB_Close()
{
    if (g_DB != MYSQL_INVALID_HANDLE)
    {
        mysql_close(g_DB);
        g_DB = MYSQL_INVALID_HANDLE;
    }
}

// Convenience: fire-and-forget query, no callback.
stock DB_Exec(const query[])
{
    mysql_tquery(g_DB, query);
}
