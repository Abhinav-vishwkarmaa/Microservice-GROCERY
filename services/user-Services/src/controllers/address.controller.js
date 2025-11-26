import { query } from "../../config/db.js";
const address_table = `mtbl_customer_address`
const user_table = `mtbl_customers`
const pincode_table = `mtbl_pincodes`
/**
 * Utility: normalize boolean-ish values from req.body
 */
const toBoolean = (val) => {
  if (val === true || val === 1 || val === '1' || val === 'true') return true;
  return false;
};

/**
 * Utility: normalize db result packet to get affectedRows/insertId safely
 */
const okPacket = (res) => {
  if (!res) return {};
  if (Array.isArray(res)) return res[0] || {};
  return res;
};

// List all addresses for the user
export const getAllAddress = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const addresses = await query(
      `
      SELECT id, user_id, name, mobile, alternate_mobile, house_number, building_name,
             street, landmark, area, city, state, pincode, address_type, address_nickname,
             delivery_instructions, latitude, longitude, is_primary, is_active, created_at, updated_at
      FROM ${address_table}
      WHERE user_id = ? AND is_active = 1
      ORDER BY is_primary DESC, created_at DESC
      `,
      [userId]
    );

    return res.json({ success: true, data: Array.isArray(addresses) ? addresses : [] });
  } catch (error) {
    logger.error('Error in list addresses:', error);
    return res.status(500).json({ success: false, error: 'Failed to list addresses' });
  }
};

// Get details of a specific address
export const getDetailAddress = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, error: 'Invalid address ID' });

    const rows = await query(
      `
      SELECT *
      FROM ${address_table}
      WHERE user_id = ? AND id = ? AND is_active = 1
      LIMIT 1
      `,
      [userId, id]
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    logger.error('Error in address detail:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch address' });
  }
};

// Create a new address
export const createAddress = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const body = req.body || {};
    const name = (body.name || '').toString().trim();
    const mobile = (body.mobile || '').toString().trim();
    const alternate_mobile = body.alternate_mobile ? body.alternate_mobile.toString().trim() : null;
    const house_number = (body.house_number || '').toString().trim();
    const building_name = body.building_name ? body.building_name.toString().trim() : null;
    const street = (body.street || '').toString().trim();
    const landmark = body.landmark ? body.landmark.toString().trim() : null;
    const area = (body.area || '').toString().trim();
    const city = (body.city || '').toString().trim();
    const state = (body.state || '').toString().trim();
    const pincode = (body.pincode || '').toString().trim();
    const address_type = body.address_type || 'home';
    const address_nickname = body.address_nickname || null;
    const delivery_instructions = body.delivery_instructions || null;
    const latitude = body.latitude ?? null;
    const longitude = body.longitude ?? null;
    const is_primary = toBoolean(body.is_primary);
    const is_active = body.is_active === undefined ? true : toBoolean(body.is_active);

    // Validate required
    if (!name || !mobile || !house_number || !street || !area || !city || !state || !pincode) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Pincode must exist in master pincodes table (serviceable)
    const pincodeRows = await query(`SELECT id FROM mtbl_pincodes WHERE pincode = ? LIMIT 1`, [pincode]);
    if (!Array.isArray(pincodeRows) || pincodeRows.length === 0) {
      return res.status(400).json({ success: false, error: "We don't deliver to this pincode" });
    }

    // If primary, unset other primary addresses for this user
    if (is_primary) {
      await query(`UPDATE ${address_table} SET is_primary = 0 WHERE user_id = ?`, [userId]);
    }

    const insertRes = await query(
      `
      INSERT INTO ${address_table} (
        user_id, name, mobile, alternate_mobile,
        house_number, building_name, street, landmark, area,
        city, state, pincode, address_type, address_nickname,
        delivery_instructions, latitude, longitude, is_primary, is_active,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        userId,
        name,
        mobile,
        alternate_mobile,
        house_number,
        building_name,
        street,
        landmark,
        area,
        city,
        state,
        pincode,
        address_type,
        address_nickname,
        delivery_instructions,
        latitude,
        longitude,
        is_primary ? 1 : 0,
        is_active ? 1 : 0
      ]
    );

    const ok = okPacket(insertRes);
    const addressId = ok.insertId || null;

    // If newly created and primary, update customer's default_pincode
    if (is_primary && addressId) {
      try {
        await query(`UPDATE ${user_table} SET default_pincode = ?, update_at = NOW() WHERE id = ?`, [pincode, userId]);
      } catch (e) {
        // don't fail the whole request if customer update fails — log and continue
        logger.warn('Failed to update customer default_pincode:', e?.message || e);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: { addressId, user_id: userId }
    });
  } catch (error) {
    logger.error('Error in create address:', error);
    return res.status(500).json({ success: false, error: 'Failed to create address' });
  }
};

// Update an address
export const updateAddress = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, error: 'Invalid address ID' });

    const updateData = req.body || {};

    // Check exists
    const existingRows = await query(`SELECT id FROM ${address_table} WHERE id = ? AND user_id = ? LIMIT 1`, [id, userId]);
    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    // If pincode provided, validate it against master pincodes
    if (updateData.pincode !== undefined && updateData.pincode !== null) {
      const pin = String(updateData.pincode).trim();
      const pinRows = await query(`SELECT id FROM ${pincode_table} WHERE pincode = ? LIMIT 1`, [pin]);
      if (!Array.isArray(pinRows) || pinRows.length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid pincode' });
      }
      updateData.pincode = pin;
    }

    // If marking as primary, unset others
    if (updateData.is_primary !== undefined && toBoolean(updateData.is_primary)) {
      await query(`UPDATE ${address_table} SET is_primary = 0 WHERE user_id = ?`, [userId]);
    }

    // Build SET clause
    const allowedFields = [
      'name', 'mobile', 'alternate_mobile', 'house_number', 'building_name', 'street',
      'landmark', 'area', 'city', 'state', 'pincode', 'address_type', 'address_nickname',
      'delivery_instructions', 'latitude', 'longitude', 'is_primary', 'is_active'
    ];
    const setParts = [];
    const params = [];

    for (const key of Object.keys(updateData)) {
      if (!allowedFields.includes(key)) continue;
      let val = updateData[key];
      if (key === 'is_primary' || key   === 'is_active') {
        val = toBoolean(val) ? 1 : 0;
      }
      setParts.push(`${key} = ?`);
      params.push(val);
    }

    if (setParts.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }   

    setParts.push('updated_at = NOW()');
    const sql = `UPDATE ${address_table} SET ${setParts.join(', ')} WHERE id = ? AND user_id = ?`;
    params.push(id, userId);

    const updateRes = await query(sql, params);
    const ok = okPacket(updateRes);

    // If pincode/primary changed to primary, update customer's default_pincode
    if (updateData.is_primary && updateData.pincode) {
      try {
        await query(`UPDATE ${user_table} SET default_pincode = ?, updated_at = NOW() WHERE id = ?`, [updateData.pincode, userId]);
      } catch (e) {
        logger.warn('Failed to update user default_pincode after address update:', e?.message || e);
      }
    } else if (updateData.is_primary && !updateData.pincode) {
      // fetch pincode from address and update customer
      try {
        const pincode = Array.isArray(addrRows) && addrRows[0] ? addrRows[0].pincode : null;
        if (pincode) {
          await query(`UPDATE ${user_table} SET default_pincode = ?, updated_at = NOW() WHERE id = ?`, [pincode, userId]);
        }
      } catch (e) {
        logger.warn('Failed to update customer default_pincode after address update (read step):', e?.message || e);
      }
    }

    return res.json({ success: true, message: 'Address updated successfully' });
  } catch (error) {
    logger.error('Error in update address:', error);
    return res.status(500).json({ success: false, error: 'Failed to update address' });
  }
};

// Delete an address (soft delete)
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, error: 'Invalid address ID' });

    const result = await query(
      `UPDATE ${address_table} SET is_active = 0, updated_at = NOW() WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    const ok = okPacket(result);
    const affected = ok.affectedRows || 0;

    if (affected === 0) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }

    return res.json({ success: true, message: 'Address deleted successfully' });
  } catch (error) {
    logger.error('Error in delete address:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete address' });
  }
};

// Make an address primary
export const makePrimary = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ success: false, error: 'Invalid address ID' });

    // Ensure the address belongs to user and is active
    const addrRows = await query(`SELECT id, pincode FROM ${address_table} WHERE id = ? AND user_id = ? AND is_active = 1 LIMIT 1`, [id, userId]);
    if (!Array.isArray(addrRows) || addrRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Address not found' });
    }
    const pincode = addrRows[0].pincode;

    // Unset previous primary and set this as primary in a safe order
    await query(`UPDATE ${address_table} SET is_primary = 0 WHERE user_id = ?`, [userId]);
    await query(`UPDATE ${address_table} SET is_primary = 1, updated_at = NOW() WHERE id = ? AND user_id = ?`, [id, userId]);

    // Update customer's default_pincode if pincode exists
    if (pincode) {
      try {
        await query(`UPDATE ${user_table} SET default_pincode = ?, updated_at = NOW() WHERE id = ?`, [pincode, userId]);
      } catch (e) {
        logger.warn('Failed to update customer.default_pincode in makePrimary:', e?.message || e);
      }
    }

    return res.json({ success: true, message: 'Address set as primary successfully' });
  } catch (error) {
    logger.error('Error in makePrimary address:', error);
    return res.status(500).json({ success: false, error: 'Failed to set primary address' });
  }
};
