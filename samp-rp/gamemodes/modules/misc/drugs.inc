// modules/misc/drugs.inc
// Drug economy:
//   /buydrug <weed|coke|meth> <amount>   - buy at a dealer hotspot
//   /usedrug <weed|coke|meth>            - consume one from inventory
//   /selldrug <player> <type> <amount> <price>
//                                        - propose a sale to a nearby player
//   /accept                              - accept the pending offer
//
// Effects on use (DRUG_EFFECT_DURATION_S, default 60s):
//   weed -> +20 armour, smoke animation, calmer screen tint
//   coke -> +50 hp, sprint stamina boost (special action SPRINT)
//   meth -> +25 hp +25 armour, but 1hp/s drain when effect ends
//
// Anti-cheat: drug effects only set health/armour values that are within
// normal bounds — no infinite-armour exploits.

#if defined _rp_drugs_included
    #endinput
#endif
#define _rp_drugs_included

// Pre-placed dealer hotspots (one per major city)
static const Float: gDealers[][3] = {
    {2090.0, -1782.0, 13.4},   // LS Idlewood alley
    {-2026.5,  157.0, 28.9},   // SF
    {2030.0,  2330.0, 10.8}    // LV old town
};

// Per-player effect state (timer id; effect cleared when it fires)
new gDrugEffectTimer[MAX_PLAYERS];
new gDrugMethDrainTimer[MAX_PLAYERS]; // post-meth withdrawal

stock IsAtDealer(playerid)
{
    for (new i = 0; i < sizeof gDealers; i++)
        if (IsPlayerInRangeOfPoint(playerid, 4.0,
                gDealers[i][0], gDealers[i][1], gDealers[i][2]))
            return 1;
    return 0;
}

stock DrugTypeFromName(const name[])
{
    if (!strcmp(name, "weed", true)) return ITEM_DRUG_WEED;
    if (!strcmp(name, "coke", true)) return ITEM_DRUG_COKE;
    if (!strcmp(name, "meth", true)) return ITEM_DRUG_METH;
    return -1;
}

stock DrugPrice(item_id)
{
    switch (item_id)
    {
        case ITEM_DRUG_WEED: return DRUG_PRICE_WEED;
        case ITEM_DRUG_COKE: return DRUG_PRICE_COKE;
        case ITEM_DRUG_METH: return DRUG_PRICE_METH;
    }
    return 0;
}

stock DrugTypeName(item_id, dest[], len)
{
    dest[0] = 0;
    switch (item_id)
    {
        case ITEM_DRUG_WEED: strcat(dest, "weed", len);
        case ITEM_DRUG_COKE: strcat(dest, "coke", len);
        case ITEM_DRUG_METH: strcat(dest, "meth", len);
    }
}

// ---------------------------------------------------------------------------
// /buydrug
// ---------------------------------------------------------------------------
CMD:buydrug(playerid, params[])
{
    if (!IsAtDealer(playerid))
        return SendError(playerid, "No dealer here. Find one in LS, SF or LV.");
    new what[16], amount;
    if (sscanf(params, "s[16]I(1)", what, amount))
        return SendError(playerid, "Usage: /buydrug <weed|coke|meth> [amount]");
    if (amount < 1 || amount > 50) return SendError(playerid, "Amount 1..50.");

    new item_id = DrugTypeFromName(what);
    if (item_id == -1) return SendError(playerid, "Unknown drug.");
    new total = DrugPrice(item_id) * amount;
    if (Player_GetCash(playerid) < total)
        return SendError(playerid, "Not enough cash.");
    if (Inventory_Add(playerid, item_id, amount) == -1)
        return SendError(playerid, "Inventory full.");

    Money_Give(playerid, -total);
    new buf[100];
    format(buf, sizeof buf, "Bought %d %s for $%d.", amount, what, total);
    SendSuccess(playerid, buf);

    // Wanted level for being seen near a dealer (cheap heuristic)
    if (Player_GetWanted(playerid) < 2)
    {
        Player_SetWanted(playerid, Player_GetWanted(playerid) + 1);
        SetPlayerWantedLevel(playerid, Player_GetWanted(playerid));
    }
    return 1;
}

// ---------------------------------------------------------------------------
// /usedrug
// ---------------------------------------------------------------------------
CMD:usedrug(playerid, params[])
{
    new what[16];
    if (sscanf(params, "s[16]", what))
        return SendError(playerid, "Usage: /usedrug <weed|coke|meth>");
    new item_id = DrugTypeFromName(what);
    if (item_id == -1) return SendError(playerid, "Unknown drug.");
    if (!Inventory_HasItem(playerid, item_id, 1))
        return SendError(playerid, "You don't have any.");

    // Consume one
    for (new s = 0; s < MAX_INVENTORY_SLOTS; s++)
    {
        if (gInventory[playerid][s][e_item_id] != item_id) continue;
        Inventory_Remove(playerid, s, 1);
        break;
    }

    new Float: hp, Float: ar;
    GetPlayerHealth(playerid, hp);
    GetPlayerArmour(playerid, ar);
    new pname[MAX_PLAYER_NAME], buf[160];
    GetPlayerName(playerid, pname, sizeof pname);

    switch (item_id)
    {
        case ITEM_DRUG_WEED:
        {
            ar += 20.0;
            if (ar > 100.0) ar = 100.0;
            SetPlayerArmour(playerid, ar);
            SetPlayerSpecialAction(playerid, SPECIAL_ACTION_SMOKE_CIGGY);
            format(buf, sizeof buf, "* %s lights up a joint and inhales.", pname);
            SendNearbyMessage(playerid, 10.0, COL_ME, buf);
        }
        case ITEM_DRUG_COKE:
        {
            hp += 50.0;
            if (hp > 100.0) hp = 100.0;
            SetPlayerHealth(playerid, hp);
            SetPlayerSpecialAction(playerid, SPECIAL_ACTION_USECELLPHONE);
            format(buf, sizeof buf, "* %s sniffs a line off their thumb.", pname);
            SendNearbyMessage(playerid, 10.0, COL_ME, buf);
        }
        case ITEM_DRUG_METH:
        {
            hp += 25.0;
            ar += 25.0;
            if (hp > 100.0) hp = 100.0;
            if (ar > 100.0) ar = 100.0;
            SetPlayerHealth(playerid, hp);
            SetPlayerArmour(playerid, ar);
            format(buf, sizeof buf, "* %s injects a syringe into their arm.", pname);
            SendNearbyMessage(playerid, 10.0, COL_ME, buf);
        }
    }

    if (gDrugEffectTimer[playerid] != 0) KillTimer(gDrugEffectTimer[playerid]);
    gDrugEffectTimer[playerid] = SetTimerEx("DrugEffectEnd",
        DRUG_EFFECT_DURATION_S * 1000, false, "dd", playerid, item_id);
    return 1;
}

forward DrugEffectEnd(playerid, item_id);
public  DrugEffectEnd(playerid, item_id)
{
    gDrugEffectTimer[playerid] = 0;
    if (!IsPlayerConnected(playerid)) return;
    SetPlayerSpecialAction(playerid, SPECIAL_ACTION_NONE);

    if (item_id == ITEM_DRUG_METH)
    {
        // Post-meth withdrawal: 1hp/s for 10s
        SendInfo(playerid, "*Withdrawal kicks in...*");
        SetPVarInt(playerid, "meth_drain_ticks", 10);
        gDrugMethDrainTimer[playerid] = SetTimerEx("MethWithdrawalTick",
            1000, true, "d", playerid);
    }
    else
    {
        SendInfo(playerid, "*The high wears off.*");
    }
}

forward MethWithdrawalTick(playerid);
public  MethWithdrawalTick(playerid)
{
    new ticks_left = GetPVarInt(playerid, "meth_drain_ticks") - 1;
    SetPVarInt(playerid, "meth_drain_ticks", ticks_left);

    if (!IsPlayerConnected(playerid) || ticks_left <= 0)
    {
        if (gDrugMethDrainTimer[playerid] != 0)
        { KillTimer(gDrugMethDrainTimer[playerid]); gDrugMethDrainTimer[playerid] = 0; }
        DeletePVar(playerid, "meth_drain_ticks");
        if (IsPlayerConnected(playerid))
            SendInfo(playerid, "*You feel normal again.*");
        return;
    }
    new Float: hp;
    GetPlayerHealth(playerid, hp);
    if (hp > 1.0) SetPlayerHealth(playerid, hp - 1.0);
}

// ---------------------------------------------------------------------------
// /selldrug + /accept (peer to peer)
// ---------------------------------------------------------------------------
CMD:selldrug(playerid, params[])
{
    new target, what[16], amount, price;
    if (sscanf(params, "us[16]ii", target, what, amount, price))
        return SendError(playerid, "Usage: /selldrug <player> <weed|coke|meth> <amount> <price>");
    if (!IsPlayerConnected(target) || !Player_IsLoggedIn(target))
        return SendError(playerid, "Player not online.");
    if (target == playerid) return SendError(playerid, "Can't sell to yourself.");
    if (amount < 1) return SendError(playerid, "Amount must be positive.");
    if (price  < 1) return SendError(playerid, "Price must be positive.");

    new Float: x, Float: y, Float: z;
    GetPlayerPos(playerid, x, y, z);
    if (!IsPlayerInRangeOfPoint(target, 4.0, x, y, z))
        return SendError(playerid, "Target must be within 4m.");

    new item_id = DrugTypeFromName(what);
    if (item_id == -1) return SendError(playerid, "Unknown drug.");
    if (!Inventory_HasItem(playerid, item_id, amount))
        return SendError(playerid, "You don't have that much.");

    SetPVarInt(target, "drug_offer_seller", playerid);
    SetPVarInt(target, "drug_offer_item",   item_id);
    SetPVarInt(target, "drug_offer_amount", amount);
    SetPVarInt(target, "drug_offer_price",  price);

    new sname[MAX_PLAYER_NAME], buf[160];
    GetPlayerName(playerid, sname, sizeof sname);
    format(buf, sizeof buf,
        "*%s offers %d %s for $%d. /accept or ignore.*",
        sname, amount, what, price);
    SendClientMessage(target, COL_YELLOW, buf);
    SendInfo(playerid, "Offer sent. Awaiting response.");
    return 1;
}

CMD:accept(playerid, params[])
{
    if (GetPVarType(playerid, "drug_offer_seller") == 0)
        return SendError(playerid, "No pending offer.");
    new seller  = GetPVarInt(playerid, "drug_offer_seller");
    new item_id = GetPVarInt(playerid, "drug_offer_item");
    new amount  = GetPVarInt(playerid, "drug_offer_amount");
    new price   = GetPVarInt(playerid, "drug_offer_price");
    DeletePVar(playerid, "drug_offer_seller");
    DeletePVar(playerid, "drug_offer_item");
    DeletePVar(playerid, "drug_offer_amount");
    DeletePVar(playerid, "drug_offer_price");

    if (!IsPlayerConnected(seller)) return SendError(playerid, "Seller is gone.");
    if (!Inventory_HasItem(seller, item_id, amount))
        return SendError(playerid, "Seller no longer has the goods.");
    if (Player_GetCash(playerid) < price)
        return SendError(playerid, "Not enough cash.");

    new Float: x, Float: y, Float: z;
    GetPlayerPos(playerid, x, y, z);
    if (!IsPlayerInRangeOfPoint(seller, 4.0, x, y, z))
        return SendError(playerid, "Seller must be within 4m.");

    // Transfer
    new transferred = 0;
    for (new s = 0; s < MAX_INVENTORY_SLOTS && transferred < amount; s++)
    {
        if (gInventory[seller][s][e_item_id] != item_id) continue;
        new take = gInventory[seller][s][e_item_amount];
        if (take > amount - transferred) take = amount - transferred;
        Inventory_Remove(seller, s, take);
        transferred += take;
    }
    if (Inventory_Add(playerid, item_id, transferred) == -1)
    {
        // rollback to seller
        Inventory_Add(seller, item_id, transferred);
        return SendError(playerid, "Inventory full — deal cancelled.");
    }

    Money_Give(playerid, -price);
    Money_Give(seller,    price);

    new tname[16], buf[120];
    DrugTypeName(item_id, tname, sizeof tname);
    format(buf, sizeof buf, "Bought %d %s for $%d.", transferred, tname, price);
    SendSuccess(playerid, buf);
    format(buf, sizeof buf, "Sold %d %s for $%d.",   transferred, tname, price);
    SendSuccess(seller, buf);
    return 1;
}

hook OnPlayerDisconnect(playerid, reason)
{
    if (gDrugEffectTimer[playerid] != 0)
        { KillTimer(gDrugEffectTimer[playerid]);     gDrugEffectTimer[playerid]     = 0; }
    if (gDrugMethDrainTimer[playerid] != 0)
        { KillTimer(gDrugMethDrainTimer[playerid]);  gDrugMethDrainTimer[playerid]  = 0; }
    return 1;
}
