// modules/player/inventory.inc
// Slot-based inventory: MAX_INVENTORY_SLOTS slots per character, persisted
// row-per-slot in the `inventory` table.

#if defined _rp_inventory_included
    #endinput
#endif
#define _rp_inventory_included

// Item IDs — extend freely; values are stable, never reuse.
#define ITEM_NONE           0
#define ITEM_PHONE          1
#define ITEM_WALLET         2
#define ITEM_KEYS_HOUSE     3
#define ITEM_KEYS_VEHICLE   4
#define ITEM_RADIO          5
#define ITEM_BANDAGE        6
#define ITEM_FIRSTAID       7
#define ITEM_BURGER         8
#define ITEM_WATER          9
#define ITEM_LOCKPICK      10
#define ITEM_DRUG_WEED     20
#define ITEM_DRUG_COKE     21
#define ITEM_DRUG_METH     22

enum E_ITEM_DATA
{
    e_item_id,
    e_item_amount,
    e_item_meta[64],
}

new gInventory[MAX_PLAYERS][MAX_INVENTORY_SLOTS][E_ITEM_DATA];

stock Inventory_Clear(playerid)
{
    for (new s = 0; s < MAX_INVENTORY_SLOTS; s++)
    {
        gInventory[playerid][s][e_item_id]     = ITEM_NONE;
        gInventory[playerid][s][e_item_amount] = 0;
        gInventory[playerid][s][e_item_meta][0] = 0;
    }
}

stock Inventory_FindFreeSlot(playerid)
{
    for (new s = 0; s < MAX_INVENTORY_SLOTS; s++)
        if (gInventory[playerid][s][e_item_id] == ITEM_NONE) return s;
    return -1;
}

// Returns the slot the item ended up in, or -1 if inventory full.
stock Inventory_Add(playerid, item_id, amount = 1, const meta[] = "")
{
    // Stack with existing slot of same item if amount-stackable
    for (new s = 0; s < MAX_INVENTORY_SLOTS; s++)
    {
        if (gInventory[playerid][s][e_item_id] == item_id &&
            strcmp(gInventory[playerid][s][e_item_meta], meta) == 0)
        {
            gInventory[playerid][s][e_item_amount] += amount;
            return s;
        }
    }
    new slot = Inventory_FindFreeSlot(playerid);
    if (slot == -1) return -1;
    gInventory[playerid][slot][e_item_id]     = item_id;
    gInventory[playerid][slot][e_item_amount] = amount;
    gInventory[playerid][slot][e_item_meta][0] = 0;
    strcat(gInventory[playerid][slot][e_item_meta], meta, 64);
    return slot;
}

stock Inventory_Remove(playerid, slot, amount = 1)
{
    if (slot < 0 || slot >= MAX_INVENTORY_SLOTS) return 0;
    if (gInventory[playerid][slot][e_item_amount] < amount) return 0;
    gInventory[playerid][slot][e_item_amount] -= amount;
    if (gInventory[playerid][slot][e_item_amount] <= 0)
    {
        gInventory[playerid][slot][e_item_id] = ITEM_NONE;
        gInventory[playerid][slot][e_item_meta][0] = 0;
    }
    return 1;
}

stock Inventory_HasItem(playerid, item_id, amount = 1)
{
    new total = 0;
    for (new s = 0; s < MAX_INVENTORY_SLOTS; s++)
        if (gInventory[playerid][s][e_item_id] == item_id)
            total += gInventory[playerid][s][e_item_amount];
    return total >= amount;
}

stock Inventory_Load(playerid)
{
    Inventory_Clear(playerid);
    new q[140];
    mysql_format(g_DB, q, sizeof q,
        "SELECT slot_index,item_id,amount,metadata FROM inventory \
         WHERE character_id=%d", Player_GetCharId(playerid));
    mysql_pquery(g_DB, q, "OnInventoryLoaded", "d", playerid);
}

forward OnInventoryLoaded(playerid);
public  OnInventoryLoaded(playerid)
{
    new rows = cache_num_rows();
    for (new r = 0; r < rows; r++)
    {
        new slot, item_id, amount;
        cache_get_value_name_int(r, "slot_index", slot);
        cache_get_value_name_int(r, "item_id",    item_id);
        cache_get_value_name_int(r, "amount",     amount);
        if (slot < 0 || slot >= MAX_INVENTORY_SLOTS) continue;
        gInventory[playerid][slot][e_item_id]     = item_id;
        gInventory[playerid][slot][e_item_amount] = amount;
        cache_get_value_name(r, "metadata",
            gInventory[playerid][slot][e_item_meta], 64);
    }
    return 1;
}

stock Inventory_Save(playerid)
{
    new char_id = Player_GetCharId(playerid);
    if (char_id == 0) return;

    new q[160];
    mysql_format(g_DB, q, sizeof q,
        "DELETE FROM inventory WHERE character_id=%d", char_id);
    mysql_tquery(g_DB, q);

    for (new s = 0; s < MAX_INVENTORY_SLOTS; s++)
    {
        if (gInventory[playerid][s][e_item_id] == ITEM_NONE) continue;
        mysql_format(g_DB, q, sizeof q,
            "INSERT INTO inventory (character_id,slot_index,item_id,amount,metadata) \
             VALUES (%d,%d,%d,%d,'%e')",
            char_id, s,
            gInventory[playerid][s][e_item_id],
            gInventory[playerid][s][e_item_amount],
            gInventory[playerid][s][e_item_meta]);
        mysql_tquery(g_DB, q);
    }
}
