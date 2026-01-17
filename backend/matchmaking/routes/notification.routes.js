import express from "express";
import { NotificationModel } from "../models/Notification.model.js";

const router = express.Router();

/**
 * POST - create a notification
 */
router.post("/", async (req, res) => {
  console.log("🔔 Notification POST received:", req.body);
  try {
    const notification = await NotificationModel.create(req.body);
    res.status(201).json(notification);
  } catch (err) {
    console.error("❌ Notification insert failed:", err);
    res.status(500).json({ error: "Failed to create notification" });
  }
});

/**
 * GET - fetch notifications for a user
 */
router.get("/:recipientType/:recipientId", async (req, res) => {
  try {
    const { recipientType, recipientId } = req.params;

    console.log("🔔 Fetching notifications for:", recipientType, recipientId);

    const notifications = await NotificationModel.findForRecipient(
      recipientType,
      recipientId
    );

    res.json(notifications);
  } catch (err) {
    console.error("❌ FETCH NOTIFICATIONS ERROR:", err);
    res.status(500).json({
      error: "Failed to fetch notifications",
      details: err.message
    });
  }
});

router.patch("/:id/read", async (req, res) => {
  const { id } = req.params;

  try {
    await NotificationModel.markAsRead(id);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to mark notification as read", err);
    res.status(500).json({ error: "Failed to update notification" });
  }
});



export default router;
