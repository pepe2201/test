// modules/economy/banking.inc
// Bank: deposit/withdraw at any ATM/bank zone, paycheck timer ticks every
// PAYCHECK_INTERVAL_MIN minutes and pays job + faction salary + bank interest.

#if defined _rp_banking_included
    #endinput
#endif
#define _rp_banking_included

// Bank/ATM zones (radius around point). Add more here.
static const Float: gBankZones[][3] = {
    {1462.0, -1011.0, 26.8},  // LS Pershing Square ATM
    {2305.0, -16.0,    26.7}, // LS Mulholland
    {-1959.0, 137.0,   27.7}, // SF Bank
    {2533.0,  2057.0,  10.8}  // LV Bank
};

stock IsAtBankZone(playerid)
{
    for (new i = 0; i < sizeof gBankZones; i++)
        if (IsPlayerInRangeOfPoint(playerid, 3.0,
                gBankZones[i][0], gBankZones[i][1], gBankZones[i][2]))
            return 1;
    return 0;
}

CMD:bank(playerid, params[])
{
    if (!Player_IsLoggedIn(playerid)) return SendError(playerid, "Not logged in.");
    if (!IsAtBankZone(playerid))
        return SendError(playerid, "You must be at a bank or an ATM.");

    new buf[160];
    format(buf, sizeof buf,
        "Deposit (Cash $%d)\nWithdraw (Bank $%d)",
        Player_GetCash(playerid), Player_GetBank(playerid));
    ShowPlayerDialog(playerid, DLG_BANK_MAIN, DIALOG_STYLE_LIST,
        "Bank", buf, "Select", "Close");
    return 1;
}

hook OnDialogResponse(playerid, dialogid, response, listitem, inputtext[])
{
    switch (dialogid)
    {
        case DLG_BANK_MAIN:
        {
            if (!response) return 1;
            switch (listitem)
            {
                case 0: ShowPlayerDialog(playerid, DLG_BANK_DEPOSIT, DIALOG_STYLE_INPUT,
                            "Deposit", "Enter amount to deposit:", "OK", "Cancel");
                case 1: ShowPlayerDialog(playerid, DLG_BANK_WITHDRAW, DIALOG_STYLE_INPUT,
                            "Withdraw", "Enter amount to withdraw:", "OK", "Cancel");
            }
            return 1;
        }
        case DLG_BANK_DEPOSIT:
        {
            if (!response) return 1;
            new amt = strval(inputtext);
            if (amt <= 0) return SendError(playerid, "Invalid amount.");
            if (Player_GetCash(playerid) < amt)
                return SendError(playerid, "Not enough cash.");
            Money_Give(playerid, -amt);
            Player_SetBank(playerid, Player_GetBank(playerid) + amt);
            SendSuccess(playerid, "Deposit complete.");
            return 1;
        }
        case DLG_BANK_WITHDRAW:
        {
            if (!response) return 1;
            new amt = strval(inputtext);
            if (amt <= 0) return SendError(playerid, "Invalid amount.");
            if (Player_GetBank(playerid) < amt)
                return SendError(playerid, "Not enough in your bank.");
            Player_SetBank(playerid, Player_GetBank(playerid) - amt);
            Money_Give(playerid, amt);
            SendSuccess(playerid, "Withdraw complete.");
            return 1;
        }
    }
    return 0;
}

// Paycheck — invoked from a server timer every minute. Each player accrues
// minutes_played; when the threshold is reached they get paid.
forward Paycheck_Tick();
public  Paycheck_Tick()
{
    foreach (new i: Player)
    {
        if (!Player_IsLoggedIn(i)) continue;
        gPlayer[i][e_minutes_played]++;
        if (gPlayer[i][e_minutes_played] % PAYCHECK_INTERVAL_MIN != 0) continue;

        new salary = 0;
        new job = Player_GetJob(i);
        if (job > 0) salary += Job_BasePay(job);
        if (Player_GetFaction(i) > 0) salary += 200; // flat faction salary stub

        new bank = Player_GetBank(i);
        new interest = bank * BANK_INTEREST_BPS / 10000;
        Player_SetBank(i, bank + interest);

        Money_Give(i, salary);

        new buf[160];
        format(buf, sizeof buf,
            "[PAYDAY] Salary: ${%d} | Interest: ${%d} | Bank: ${%d}",
            salary, interest, Player_GetBank(i));
        SendClientMessage(i, COL_GREEN, buf);
    }
}
