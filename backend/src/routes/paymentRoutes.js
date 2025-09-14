const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Group = require("../models/Group");
const Payment = require("../models/Payment");

const router = express.Router();

function getClient() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

router.get("/key", (req, res) => {
  const key_id = process.env.RAZORPAY_KEY_ID || "";
  if (!key_id) return res.status(500).json({ message: "Razorpay not configured" });
  return res.json({ keyId: key_id });
});

// Create order for a paid group
router.post("/create-order", async (req, res) => {
  try {
    const { groupId } = req.body;
    if (!groupId) return res.status(400).json({ message: "groupId required" });
    const group = await Group.findById(groupId);
    if (!group || !group.isPaid) return res.status(400).json({ message: "Invalid paid group" });

    const client = getClient();
    if (!client) return res.status(500).json({ message: "Razorpay not configured" });

    // Razorpay requires minimum 100 paise (₹1)
    const amountPaise = Math.max(100, Math.round((group.price || 0) * 100));
    const shortReceipt = `grp_${String(groupId).slice(-6)}_${Date.now().toString(36)}`.slice(0, 40);
    const order = await client.orders.create({
      amount: amountPaise,
      currency: group.currency || "INR",
      receipt: shortReceipt,
      notes: { groupId: String(groupId) },
    });
    return res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    const msg = e?.error?.description || e?.response?.data?.error?.description || e?.message || "Unable to create order";
    console.error("create-order error:", msg);
    const code = /amount|currency|key/i.test(String(msg)) ? 400 : 500;
    return res.status(code).json({ message: msg });
  }
});

// Verify payment and grant 3-day access
router.post("/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, groupId, userId } = req.body || {};
    console.log("🔍 Payment verify request:", { razorpay_order_id, razorpay_payment_id, groupId, userId });
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !groupId || !userId) {
      console.log("❌ Missing fields in verify request");
      return res.status(400).json({ message: "missing fields" });
    }

    // Check if payment already exists in MongoDB
    const existingPayment = await Payment.findOne({ paymentId: razorpay_payment_id });
    if (existingPayment && existingPayment.verified) {
      console.log("✅ Payment already verified in database:", razorpay_payment_id);
      return res.json({ 
        success: true, 
        expiresAt: existingPayment.expiresAt,
        message: "Payment already verified" 
      });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) return res.status(500).json({ message: "Razorpay not configured" });

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac("sha256", key_secret).update(body).digest("hex");
    const valid = expectedSignature === razorpay_signature;
    console.log("🔐 Signature validation:", { valid, expected: expectedSignature, received: razorpay_signature });
    
    if (!valid) return res.status(400).json({ message: "invalid signature" });

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.isPaid) return res.status(400).json({ message: "Not a paid group" });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Store payment in MongoDB
    const paymentData = {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      signature: razorpay_signature,
      userId: userId,
      groupId: groupId,
      amount: group.price || 0,
      currency: group.currency || 'INR',
      status: 'completed',
      verified: true,
      expiresAt: expiresAt,
      verifiedAt: now
    };

    let payment;
    if (existingPayment) {
      // Update existing payment
      Object.assign(existingPayment, paymentData);
      await existingPayment.save();
      payment = existingPayment;
      console.log("💾 Updated existing payment in database:", razorpay_payment_id);
    } else {
      // Create new payment record
      payment = new Payment(paymentData);
      await payment.save();
      console.log("💾 Created new payment record in database:", razorpay_payment_id);
    }

    // Update group membership
    const idx = group.members.findIndex((m) => String(m.user) === String(userId));
    if (idx >= 0) {
      group.members[idx].expiresAt = expiresAt;
      console.log("✅ Updated existing member:", userId, "expiresAt:", expiresAt);
    } else {
      group.members.push({ user: userId, expiresAt });
      console.log("✅ Added new member:", userId, "expiresAt:", expiresAt);
    }
    await group.save();
    console.log("💾 Group saved successfully for user:", userId);
    return res.json({ success: true, expiresAt });
  } catch (e) {
    console.error("❌ Verify error:", e);
    return res.status(500).json({ message: "Verification failed" });
  }
});

// Admin/manual grant for troubleshooting (protect with token)
router.post("/admin/grant", async (req, res) => {
  try {
    const adminToken = req.headers["x-admin-token"];
    if (!adminToken || adminToken !== (process.env.ADMIN_TOKEN || "DEV_FORCE_GRANT")) {
      return res.status(403).json({ message: "forbidden" });
    }
    const { groupId, userId, days } = req.body || {};
    if (!groupId || !userId) return res.status(400).json({ message: "groupId and userId required" });
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (Number(days || 3) * 24 * 60 * 60 * 1000));
    const idx = group.members.findIndex((m) => String(m.user) === String(userId));
    if (idx >= 0) group.members[idx].expiresAt = expiresAt; else group.members.push({ user: userId, expiresAt });
    await group.save();
    return res.json({ success: true, expiresAt });
  } catch (e) {
    return res.status(500).json({ message: "grant failed" });
  }
});

// Bulk grant access for all users who made payments but verification failed
router.post("/admin/bulk-grant", async (req, res) => {
  try {
    const adminToken = req.headers["x-admin-token"];
    if (!adminToken || adminToken !== (process.env.ADMIN_TOKEN || "DEV_FORCE_GRANT")) {
      return res.status(403).json({ message: "forbidden" });
    }
    const { groupId, userIds, days } = req.body || {};
    if (!groupId || !userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: "groupId and userIds array required" });
    }
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + (Number(days || 3) * 24 * 60 * 60 * 1000));
    const results = [];

    for (const userId of userIds) {
      const idx = group.members.findIndex((m) => String(m.user) === String(userId));
      if (idx >= 0) {
        group.members[idx].expiresAt = expiresAt;
        results.push({ userId, action: "updated" });
      } else {
        group.members.push({ user: userId, expiresAt });
        results.push({ userId, action: "added" });
      }
    }

    await group.save();
    return res.json({ success: true, expiresAt, results });
  } catch (e) {
    console.error("Bulk grant error:", e);
    return res.status(500).json({ message: "bulk grant failed" });
  }
});

router.post("/auto-verify", async (req, res) => {
  try {
    console.log("🔍 Auto verification request:", req.body);
    const { groupId, userId } = req.body || {};
    
    if (!groupId || !userId) {
      return res.status(400).json({ message: "groupId and userId required" });
    }

    // First, check if user already has a valid payment in MongoDB
    const existingPayment = await Payment.findOne({ 
      userId: userId,
      groupId: groupId,
      verified: true,
      expiresAt: { $gt: new Date() }
    });

    if (existingPayment) {
      console.log("✅ User already has valid payment in database");
      
      // Ensure user has access in the group
      const group = await Group.findById(groupId);
      if (group) {
        const existingMemberIndex = group.members.findIndex(m => String(m.user) === String(userId));
        
        if (existingMemberIndex >= 0) {
          group.members[existingMemberIndex].expiresAt = existingPayment.expiresAt;
        } else {
          group.members.push({ user: userId, expiresAt: existingPayment.expiresAt });
        }
        await group.save();
      }
      
      return res.json({ 
        success: true, 
        expiresAt: existingPayment.expiresAt,
        message: "Payment already verified" 
      });
    }

    // If no valid payment found, check for any recent payments by this user
    const recentPayment = await Payment.findOne({ 
      userId: userId,
      groupId: groupId
    }).sort({ createdAt: -1 });

    if (recentPayment && recentPayment.status === 'completed') {
      console.log("🔍 Found recent payment, verifying with Razorpay API");
      
      try {
        // Verify with Razorpay API
        const razorpay = getClient();
        if (!razorpay) {
          throw new Error("Razorpay not configured");
        }

        const payment = await razorpay.payments.fetch(recentPayment.paymentId);
        
        if (payment.status === 'captured' && payment.amount === (recentPayment.amount * 100)) {
          // Payment is valid, update the record
          recentPayment.verified = true;
          recentPayment.status = 'completed';
          await recentPayment.save();
          
          // Grant access
          const group = await Group.findById(groupId);
          if (group) {
            const existingMemberIndex = group.members.findIndex(m => String(m.user) === String(userId));
            
            if (existingMemberIndex >= 0) {
              group.members[existingMemberIndex].expiresAt = recentPayment.expiresAt;
            } else {
              group.members.push({ user: userId, expiresAt: recentPayment.expiresAt });
            }
            await group.save();
          }
          
          console.log(`✅ Payment verified with Razorpay API for user ${userId}`);
          return res.json({ 
            success: true, 
            expiresAt: recentPayment.expiresAt,
            message: "Payment verified with Razorpay" 
          });
        } else {
          console.log("❌ Payment verification failed with Razorpay API");
          return res.status(400).json({ message: "Payment verification failed" });
        }
      } catch (error) {
        console.error("❌ Razorpay API verification error:", error);
        return res.status(400).json({ message: "Payment verification failed" });
      }
    }

    // No payment found at all
    console.log("❌ No payment found for user in this group");
    return res.status(404).json({ message: "No payment found" });
    
  } catch (e) {
    console.error("Auto verification error:", e);
    return res.status(500).json({ message: "Auto verification failed" });
  }
});

// Check payment status for a user and group
router.get("/status/:groupId/:userId", async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    
    // Find payment in MongoDB
    const payment = await Payment.findOne({ 
      userId: userId,
      groupId: groupId,
      verified: true
    }).sort({ createdAt: -1 }); // Get most recent payment

    if (payment && payment.expiresAt > new Date()) {
      return res.json({
        success: true,
        hasPayment: true,
        expiresAt: payment.expiresAt,
        isActive: true,
        paymentId: payment.paymentId
      });
    }

    return res.json({
      success: true,
      hasPayment: false,
      isActive: false
    });
    
  } catch (e) {
    console.error("Payment status check error:", e);
    return res.status(500).json({ message: "Status check failed" });
  }
});

module.exports = router;


