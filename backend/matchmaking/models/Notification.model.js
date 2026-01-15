import { matchmakingPool } from "../../config/db.js";

export const NotificationModel = {
  async create(notification) {
    const query = `
      INSERT INTO notifications (
        recipient_type, recipient_id,
        sender_type, sender_id,
        entity_type, entity_id,
        message
      )
      VALUES (
        $1,$2,
        $3,$4,
        $5,$6,
        $7
      )
      RETURNING *;
    `;

    const values = [
      notification.recipient_type,
      notification.recipient_id,
      notification.sender_type,
      notification.sender_id,
      notification.entity_type,
      notification.entity_id,
      notification.message
    ];

    const { rows } = await matchmakingPool.query(query, values);
    return rows[0];
  },

  async findUnread(recipientType, recipientId) {
    const { rows } = await matchmakingPool.query(
      `SELECT * FROM notifications
       WHERE recipient_type = $1
         AND recipient_id = $2
         AND is_read = FALSE
       ORDER BY created_at DESC`,
      [recipientType, recipientId]
    );
    return rows;
  }
};
