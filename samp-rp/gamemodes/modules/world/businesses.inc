// modules/world/businesses.inc
// Persistent businesses with per-type actions:
//   0  24/7 store     -> /buy snacks/water from inventory
//   1  gas station    -> /refuel current vehicle
//   2  gun shop       -> /buygun <id>  (whitelisted)
//   3  restaurant     -> /eat (heal)
//   4  clothes        -> /skin <id>
//
// Buying anything pays the business's till. Owner collects with /bizmenu.

#if defined _rp_businesses_included
    #endinput
#endif
#define _rp_businesses_included

#define MAX_BUSINESSES 256

enum E_BIZ_DATA
{
    e_b_id,
    e_b_owner_char,
    e_b_type,
    e_b_name[64],
    e_b_price,
    e_b_till,
    e_b_product_price,
    bool: e_b_locked,
    e_b_interior,
    Float: e_b_x,
    Float: e_b_y,
    Float: e_b_z,
    Float: e_b_int_x,
    Float: e_b_int_y,
    Float: e_b_int_z,
    Text3D: e_b_label,
    bool: e_b_loaded,
}

new gBiz[MAX_BUSINESSES][E_BIZ_DATA];

// Per-player: which biz id they're inside (0 = none)
new gPlayerBiz[MAX_PLAYERS];

stock Business_LoadAll()
{
    mysql_pquery(g_DB, "SELECT * FROM businesses", "OnBusinessesLoaded");
}

forward OnBusinessesLoaded();
public  OnBusinessesLoaded()
{
    new rows = cache_num_rows();
    if (rows > MAX_BUSINESSES) rows = MAX_BUSINESSES;
    for (new r = 0; r < rows; r++)
    {
        cache_get_value_name_int  (r, "id",            gBiz[r][e_b_id]);
        cache_get_value_name_int  (r, "owner_char",    gBiz[r][e_b_owner_char]);
        cache_get_value_name_int  (r, "type",          gBiz[r][e_b_type]);
        cache_get_value_name      (r, "name",          gBiz[r][e_b_name], 64);
        cache_get_value_name_int  (r, "price",         gBiz[r][e_b_price]);
        cache_get_value_name_int  (r, "till",          gBiz[r][e_b_till]);
        cache_get_value_name_int  (r, "product_price", gBiz[r][e_b_product_price]);
        new locked;
        cache_get_value_name_int  (r, "locked",        locked);
        gBiz[r][e_b_locked] = (locked == 1);
        cache_get_value_name_int  (r, "interior_id",   gBiz[r][e_b_interior]);
        cache_get_value_name_float(r, "pos_x",         gBiz[r][e_b_x]);
        cache_get_value_name_float(r, "pos_y",         gBiz[r][e_b_y]);
        cache_get_value_name_float(r, "pos_z",         gBiz[r][e_b_z]);
        cache_get_value_name_float(r, "int_x",         gBiz[r][e_b_int_x]);
        cache_get_value_name_float(r, "int_y",         gBiz[r][e_b_int_y]);
        cache_get_value_name_float(r, "int_z",         gBiz[r][e_b_int_z]);
        gBiz[r][e_b_loaded] = true;

        new label[200];
        format(label, sizeof label,
            "{FFD700}%s\n{FFFFFF}%s\n{AFAFAF}/buybiz to purchase ($%d)\n/enterbiz to enter",
            gBiz[r][e_b_name],
            (gBiz[r][e_b_owner_char] == 0) ? "{4DFF4D}For sale" : "{1E90FF}Owned",
            gBiz[r][e_b_price]);
        gBiz[r][e_b_label] = Create3DTextLabel(label, COL_WHITE,
            gBiz[r][e_b_x], gBiz[r][e_b_y], gBiz[r][e_b_z] + 0.6, 25.0, 0, 0);
    }
    printf("[BIZ] %d businesses loaded", rows);
    return 1;
}

stock Business_FindIndexById(biz_id)
{
    for (new i = 0; i < MAX_BUSINESSES; i++)
        if (gBiz[i][e_b_loaded] && gBiz[i][e_b_id] == biz_id) return i;
    return -1;
}

stock Business_FindNearestExt(playerid, Float: range = 3.0)
{
    new Float: x, Float: y, Float: z;
    GetPlayerPos(playerid, x, y, z);
    for (new i = 0; i < MAX_BUSINESSES; i++)
    {
        if (!gBiz[i][e_b_loaded]) continue;
        if (IsPlayerInRangeOfPoint(playerid, range,
                gBiz[i][e_b_x], gBiz[i][e_b_y], gBiz[i][e_b_z]))
            return i;
    }
    return -1;
}

stock Business_AddToTill(biz_idx, amount)
{
    gBiz[biz_idx][e_b_till] += amount;
    new q[120];
    mysql_format(g_DB, q, sizeof q,
        "UPDATE businesses SET till=%d WHERE id=%d",
        gBiz[biz_idx][e_b_till], gBiz[biz_idx][e_b_id]);
    mysql_tquery(g_DB, q);
}

stock Business_TypeName(type, dest[], len)
{
    new const names[][] = {
        "24/7 Store", "Gas Station", "Gun Shop", "Restaurant", "Clothes Shop"
    };
    if (type < 0 || type >= sizeof names) { dest[0] = 0; return; }
    dest[0] = 0;
    strcat(dest, names[type], len);
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------
CMD:enterbiz(playerid, params[])
{
    new idx = Business_FindNearestExt(playerid);
    if (idx == -1) return SendError(playerid, "No business nearby.");
    if (gBiz[idx][e_b_locked] && gBiz[idx][e_b_owner_char] != Player_GetCharId(playerid))
        return SendError(playerid, "This business is closed.");

    SetPlayerPos(playerid, gBiz[idx][e_b_int_x], gBiz[idx][e_b_int_y], gBiz[idx][e_b_int_z]);
    SetPlayerInterior(playerid, gBiz[idx][e_b_interior]);
    SetPlayerVirtualWorld(playerid, 5000 + gBiz[idx][e_b_id]);
    gPlayerBiz[playerid] = gBiz[idx][e_b_id];

    new typ[32], buf[140];
    Business_TypeName(gBiz[idx][e_b_type], typ, sizeof typ);
    format(buf, sizeof buf, "%s — %s. Use /shop for available actions.",
        gBiz[idx][e_b_name], typ);
    SendInfo(playerid, buf);
    return 1;
}

CMD:exitbiz(playerid, params[])
{
    new vw = GetPlayerVirtualWorld(playerid);
    if (vw < 5000 || vw >= 6000) return SendError(playerid, "You are not inside a business.");
    new idx = Business_FindIndexById(vw - 5000);
    if (idx == -1) return SendError(playerid, "Your business is missing.");
    SetPlayerPos(playerid, gBiz[idx][e_b_x], gBiz[idx][e_b_y], gBiz[idx][e_b_z]);
    SetPlayerInterior(playerid, 0);
    SetPlayerVirtualWorld(playerid, 0);
    gPlayerBiz[playerid] = 0;
    return 1;
}

CMD:buybiz(playerid, params[])
{
    new idx = Business_FindNearestExt(playerid);
    if (idx == -1)                          return SendError(playerid, "No business nearby.");
    if (gBiz[idx][e_b_owner_char] != 0)     return SendError(playerid, "Not for sale.");
    if (Player_GetCash(playerid) < gBiz[idx][e_b_price])
        return SendError(playerid, "You can't afford this business.");

    Money_Give(playerid, -gBiz[idx][e_b_price]);
    gBiz[idx][e_b_owner_char] = Player_GetCharId(playerid);

    new q[120];
    mysql_format(g_DB, q, sizeof q,
        "UPDATE businesses SET owner_char=%d WHERE id=%d",
        Player_GetCharId(playerid), gBiz[idx][e_b_id]);
    mysql_tquery(g_DB, q);
    SendSuccess(playerid, "Business purchased. /bizmenu to manage it.");
    return 1;
}

CMD:bizmenu(playerid, params[])
{
    new idx = Business_FindNearestExt(playerid, 5.0);
    if (idx == -1)                            return SendError(playerid, "No business nearby.");
    if (gBiz[idx][e_b_owner_char] != Player_GetCharId(playerid))
        return SendError(playerid, "You don't own this business.");

    new typ[32], body[300];
    Business_TypeName(gBiz[idx][e_b_type], typ, sizeof typ);
    format(body, sizeof body,
        "Type: %s\nTill: $%d\nProduct price: $%d\nLocked: %s\n\
         \nCollect till\nSet product price\nToggle lock",
        typ, gBiz[idx][e_b_till], gBiz[idx][e_b_product_price],
        gBiz[idx][e_b_locked] ? "yes" : "no");

    SetPVarInt(playerid, "biz_menu_idx", idx);
    ShowPlayerDialog(playerid, DLG_BIZ_MENU, DIALOG_STYLE_LIST,
        gBiz[idx][e_b_name], "Collect till\nSet product price\nToggle lock", "Select", "Close");
    return 1;
}

hook OnDialogResponse(playerid, dialogid, response, listitem, inputtext[])
{
    switch (dialogid)
    {
        case DLG_BIZ_MENU:
        {
            if (!response) { DeletePVar(playerid, "biz_menu_idx"); return 1; }
            new idx = GetPVarInt(playerid, "biz_menu_idx");
            if (idx < 0 || idx >= MAX_BUSINESSES || !gBiz[idx][e_b_loaded]) return 1;
            switch (listitem)
            {
                case 0: // collect
                {
                    new amt = gBiz[idx][e_b_till];
                    if (amt <= 0) return SendError(playerid, "Till is empty.");
                    gBiz[idx][e_b_till] = 0;
                    Money_Give(playerid, amt);
                    new q[120];
                    mysql_format(g_DB, q, sizeof q,
                        "UPDATE businesses SET till=0 WHERE id=%d", gBiz[idx][e_b_id]);
                    mysql_tquery(g_DB, q);
                    new buf[80];
                    format(buf, sizeof buf, "Collected $%d from till.", amt);
                    SendSuccess(playerid, buf);
                }
                case 1:
                    ShowPlayerDialog(playerid, DLG_BIZ_PRICE, DIALOG_STYLE_INPUT,
                        "Product price", "Enter new product price:", "OK", "Cancel");
                case 2:
                {
                    gBiz[idx][e_b_locked] = !gBiz[idx][e_b_locked];
                    new q[120];
                    mysql_format(g_DB, q, sizeof q,
                        "UPDATE businesses SET locked=%d WHERE id=%d",
                        gBiz[idx][e_b_locked] ? 1 : 0, gBiz[idx][e_b_id]);
                    mysql_tquery(g_DB, q);
                    SendInfo(playerid, gBiz[idx][e_b_locked] ? "Business locked." : "Business unlocked.");
                }
            }
            return 1;
        }
        case DLG_BIZ_PRICE:
        {
            if (!response) return 1;
            new idx = GetPVarInt(playerid, "biz_menu_idx");
            if (idx < 0 || idx >= MAX_BUSINESSES || !gBiz[idx][e_b_loaded]) return 1;
            new p = strval(inputtext);
            if (p < 1 || p > 100000) return SendError(playerid, "Invalid price (1..100000).");
            gBiz[idx][e_b_product_price] = p;
            new q[120];
            mysql_format(g_DB, q, sizeof q,
                "UPDATE businesses SET product_price=%d WHERE id=%d",
                p, gBiz[idx][e_b_id]);
            mysql_tquery(g_DB, q);
            SendSuccess(playerid, "Product price updated.");
            return 1;
        }
    }
    return 0;
}

// ---------------------------------------------------------------------------
// /shop — context-sensitive based on the business you're in
// ---------------------------------------------------------------------------
CMD:shop(playerid, params[])
{
    new biz_id = gPlayerBiz[playerid];
    if (biz_id == 0) return SendError(playerid, "You are not inside a business.");
    new idx = Business_FindIndexById(biz_id);
    if (idx == -1) return SendError(playerid, "Internal: business missing.");

    switch (gBiz[idx][e_b_type])
    {
        case BIZ_TYPE_247:
            SendInfo(playerid, "Items: /buy water | /buy burger | /buy phone | /buy bandage");
        case BIZ_TYPE_GAS:
            SendInfo(playerid, "Use /refuel while seated in a vehicle.");
        case BIZ_TYPE_GUNSHOP:
        {
            SetPVarInt(playerid, "biz_menu_idx", idx);
            ShowPlayerDialog(playerid, DLG_BIZ_GUNS, DIALOG_STYLE_LIST,
                "Ammu-Nation",
                "Pistol ($500)\nShotgun ($1500)\nMP5 ($3000)\nDeagle ($2000)",
                "Buy", "Cancel");
        }
        case BIZ_TYPE_RESTAURANT:
            SendInfo(playerid, "Use /eat to order ($%d).");
        case BIZ_TYPE_CLOTHES:
        {
            SetPVarInt(playerid, "biz_menu_idx", idx);
            ShowPlayerDialog(playerid, DLG_BIZ_CLOTHES, DIALOG_STYLE_INPUT,
                "Skins", "Enter skin id (0..299):", "OK", "Cancel");
        }
    }
    return 1;
}

CMD:buy(playerid, params[])
{
    new biz_id = gPlayerBiz[playerid];
    if (biz_id == 0) return SendError(playerid, "You are not inside a business.");
    new idx = Business_FindIndexById(biz_id);
    if (idx == -1 || gBiz[idx][e_b_type] != BIZ_TYPE_247)
        return SendError(playerid, "/buy is only available in 24/7 stores.");

    new what[32];
    if (sscanf(params, "s[32]", what)) return SendError(playerid, "Usage: /buy <item>");

    new price = gBiz[idx][e_b_product_price], item_id = -1;
    if      (!strcmp(what, "water",   true)) item_id = ITEM_WATER;
    else if (!strcmp(what, "burger",  true)) item_id = ITEM_BURGER;
    else if (!strcmp(what, "phone",   true)) { item_id = ITEM_PHONE;    price = 200; }
    else if (!strcmp(what, "bandage", true)) { item_id = ITEM_BANDAGE;  price = 30;  }
    else return SendError(playerid, "Unknown item.");

    if (Player_GetCash(playerid) < price) return SendError(playerid, "Not enough cash.");
    if (Inventory_Add(playerid, item_id, 1) == -1)
        return SendError(playerid, "Inventory full.");

    Money_Give(playerid, -price);
    Business_AddToTill(idx, price);
    SendSuccess(playerid, "Purchase complete.");
    return 1;
}

CMD:refuel(playerid, params[])
{
    new biz_id = gPlayerBiz[playerid];
    new outside_idx = -1;
    if (biz_id == 0)
    {
        // allow at gas station exterior too
        outside_idx = Business_FindNearestExt(playerid, 8.0);
        if (outside_idx == -1 || gBiz[outside_idx][e_b_type] != BIZ_TYPE_GAS)
            return SendError(playerid, "You are not at a gas station.");
    }
    new idx = (biz_id != 0) ? Business_FindIndexById(biz_id) : outside_idx;
    if (idx == -1 || gBiz[idx][e_b_type] != BIZ_TYPE_GAS)
        return SendError(playerid, "Not at a gas station.");
    if (!IsPlayerInAnyVehicle(playerid))
        return SendError(playerid, "You must be in a vehicle.");

    new vidx = Vehicle_FindIndexBySamp(GetPlayerVehicleID(playerid));
    if (vidx == -1) return SendError(playerid, "Cannot refuel this vehicle.");
    new needed = 100 - gVehicle[vidx][e_v_fuel];
    if (needed <= 0) return SendError(playerid, "Tank is full.");
    new cost = needed * gBiz[idx][e_b_product_price];
    if (Player_GetCash(playerid) < cost)
        return SendError(playerid, "Not enough cash.");

    Money_Give(playerid, -cost);
    Business_AddToTill(idx, cost);
    gVehicle[vidx][e_v_fuel] = 100;
    new q[120];
    mysql_format(g_DB, q, sizeof q,
        "UPDATE vehicles SET fuel=100 WHERE id=%d", gVehicle[vidx][e_v_db_id]);
    mysql_tquery(g_DB, q);

    new buf[100];
    format(buf, sizeof buf, "Refueled. Paid $%d.", cost);
    SendSuccess(playerid, buf);
    return 1;
}

CMD:eat(playerid, params[])
{
    new biz_id = gPlayerBiz[playerid];
    if (biz_id == 0) return SendError(playerid, "You are not inside a business.");
    new idx = Business_FindIndexById(biz_id);
    if (idx == -1 || gBiz[idx][e_b_type] != BIZ_TYPE_RESTAURANT)
        return SendError(playerid, "Not a restaurant.");
    new price = gBiz[idx][e_b_product_price];
    if (Player_GetCash(playerid) < price) return SendError(playerid, "Not enough cash.");

    Money_Give(playerid, -price);
    Business_AddToTill(idx, price);

    new Float: hp;
    GetPlayerHealth(playerid, hp);
    if (hp + 25.0 > 100.0) hp = 100.0; else hp += 25.0;
    SetPlayerHealth(playerid, hp);
    ApplyAnimation(playerid, "FOOD", "EAT_Burger", 4.0, 0, 0, 0, 0, 0, 1);
    SendSuccess(playerid, "Bon appetit.");
    return 1;
}

// Gun shop dialog handling
hook OnDialogResponse(playerid, dialogid, response, listitem, inputtext[])
{
    if (dialogid == DLG_BIZ_GUNS)
    {
        if (!response) return 1;
        new idx = GetPVarInt(playerid, "biz_menu_idx");
        if (idx < 0 || idx >= MAX_BUSINESSES || !gBiz[idx][e_b_loaded]) return 1;

        new wep, ammo = 50, price;
        switch (listitem)
        {
            case 0: { wep = 22; price =  500; }
            case 1: { wep = 25; price = 1500; ammo = 25; }
            case 2: { wep = 29; price = 3000; ammo = 100; }
            case 3: { wep = 24; price = 2000; ammo = 50; }
            default: return 1;
        }
        if (Player_GetCash(playerid) < price) return SendError(playerid, "Not enough cash.");
        Money_Give(playerid, -price);
        Business_AddToTill(idx, price);
        GivePlayerWeapon(playerid, wep, ammo);
        SendSuccess(playerid, "Weapon purchased.");
        return 1;
    }
    if (dialogid == DLG_BIZ_CLOTHES)
    {
        if (!response) return 1;
        new idx = GetPVarInt(playerid, "biz_menu_idx");
        if (idx < 0 || idx >= MAX_BUSINESSES || !gBiz[idx][e_b_loaded]) return 1;

        new skin = strval(inputtext);
        if (skin < 0 || skin > 299) return SendError(playerid, "Skin must be 0-299.");
        new price = gBiz[idx][e_b_product_price];
        if (Player_GetCash(playerid) < price) return SendError(playerid, "Not enough cash.");
        Money_Give(playerid, -price);
        Business_AddToTill(idx, price);
        SetPlayerSkin(playerid, skin);
        gPlayer[playerid][e_skin] = skin;
        new q[120];
        mysql_format(g_DB, q, sizeof q,
            "UPDATE characters SET skin=%d WHERE id=%d", skin, Player_GetCharId(playerid));
        mysql_tquery(g_DB, q);
        SendSuccess(playerid, "Outfit changed.");
        return 1;
    }
    return 0;
}
