import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { confirmPayment } from "../../api/payments";

const CARD_STYLE = {
  style: {
    base: {
      color: "#e2e8f0",
      fontFamily: "DM Sans, sans-serif",
      fontSize: "15px",
      "::placeholder": { color: "#64748b" },
      backgroundColor: "transparent",
    },
    invalid: { color: "#ef4444" },
  },
};

export default function PaymentForm({ clientSecret, paymentIntentId, amount, onSuccess, onCancel }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError(""); setLoading(true);

    try {
      // Confirm payment with Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      if (result.paymentIntent.status === "succeeded") {
        // Tell our backend the payment succeeded
        await confirmPayment(paymentIntentId);
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-amount-display">
        <span>Amount to pay</span>
        <span className="payment-amount">${amount}</span>
      </div>

      <div className="payment-info">
        <p>💡 Your payment will be held securely. It is only released to the freelancer after you approve the completed work.</p>
      </div>

      <div className="form-group">
        <label>Card Details</label>
        <div className="card-element-wrap">
          <CardElement options={CARD_STYLE} />
        </div>
      </div>

      <div className="test-card-hint">
        <strong>Test card:</strong> 4242 4242 4242 4242 · Any future date · Any CVC
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      <div className="modal-actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={loading}>Cancel</button>
        <button type="submit" className="btn btn--primary" disabled={!stripe || loading}>
          {loading ? "Processing..." : `Pay $${amount}`}
        </button>
      </div>
    </form>
  );
}
