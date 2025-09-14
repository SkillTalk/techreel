import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BASE_URL } from "../utils/api";
import { toast } from "react-toastify";
import "./Payment.css";

const Payment = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const me = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        const statusRes = await fetch(`${BASE_URL}/groups/${groupId}/status?userId=${me?._id}`);
        const status = await statusRes.json();
        if (status?.success && status.isActive) {
          navigate(`/match/room/${groupId}`);
          return;
        }
        const grpRes = await fetch(`${BASE_URL}/groups/${groupId}`);
        const grp = await grpRes.json();
        if (mounted) setGroup(grp);
      } catch {}
      setLoading(false);
    };
    run();
    return () => { mounted = false; };
  }, [groupId, navigate, me?._id]);

  const handlePayAndJoin = async () => {
    if (!me?._id) return alert("Please login first");
    try {
      // 1) Create order
      const orderRes = await fetch(`${BASE_URL}/payments/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId })
      });
      const order = await orderRes.json();
      if (!orderRes.ok || !order?.orderId) {
        return alert(order?.message || "Unable to create order");
      }

      // 2) Load Razorpay SDK if not present
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = resolve; s.onerror = reject; document.body.appendChild(s);
        });
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'SkillTalk',
        description: '3 days access',
        order_id: order.orderId,
        prefill: {
          name: me?.user_id || 'SkillTalk User',
          email: me?.email || 'user@skilltalk.in',
        },
        theme: { color: '#22d3ee' },
        handler: async function (resp) {
          console.log('🔍 Razorpay payment success:', resp);
          try {
            console.log('🔍 Calling verification endpoint...');
            const verifyRes = await fetch(`${BASE_URL}/payments/verify`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: resp.razorpay_order_id,
                razorpay_payment_id: resp.razorpay_payment_id,
                razorpay_signature: resp.razorpay_signature,
                groupId, userId: me._id,
              })
            });
            console.log('🔍 Verification response status:', verifyRes.status);
            const data = await verifyRes.json();
            console.log('🔍 Verification response data:', data);
            if (verifyRes.ok && data.success) {
              try {
                localStorage.setItem(`paid:${groupId}`, String(data.expiresAt || ''));
                window.dispatchEvent(new CustomEvent('paid-join-success', { detail: { groupId, expiresAt: data.expiresAt } }));
                console.log('✅ Payment verified and access granted');
              } catch {}
              toast.success('Payment successful! 3-day access activated.');
              navigate(`/match/room/${groupId}`);
            } else {
              console.error('❌ Verification failed:', data.message);
              // Fallback: Show success but with warning
              toast.success('Payment successful! Access will be activated shortly.');
              navigate(`/match/room/${groupId}`);
            }
          } catch (e) {
            console.error('❌ Verification error:', e);
            // Fallback: Show success but with warning
            toast.success('Payment successful! Access will be activated shortly.');
            navigate(`/match/room/${groupId}`);
          }
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      alert('Payment failed. Please try again.');
    }
  };

  return (
    <div className="pay-page">
      <div className="pay-card">
        <div className="pay-header">
          <div className="brand">SkillTalk</div>
          <div className="secure"><span>🔒</span> 100% secure payment</div>
        </div>

        {loading ? (
          <div className="pay-loading">Loading…</div>
        ) : (
          <>
            <div className="pay-title">Pay to Join</div>
            <div className="pay-subtitle">{group?.name || "Paid Room"}</div>

            <div className="pay-price">
              <div className="amount">
                <span className="currency">{group?.currency || "INR"}</span>
                <span className="value">{group?.price || 0}</span>
              </div>
              <div className="badge">3 Days Access</div>
            </div>

            <ul className="pay-features">
              <li>Unlimited room access for 72 hours</li>
              <li>HD voice/video with priority relays</li>
              <li>No auto‑renewal — pay only when needed</li>
            </ul>

            <div className="pay-methods">
              <div className="method">💳 Card</div>
              <div className="method">📱 UPI</div>
              <div className="method">🏦 NetBanking</div>
              <div className="method">💼 Wallets</div>
            </div>

            <button className="pay-cta" onClick={handlePayAndJoin}>
              Proceed to Pay
            </button>

            <div className="pay-help">
              By continuing you agree to our Terms & Refund policy. Need help? support@skilltalk.in
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Payment;


