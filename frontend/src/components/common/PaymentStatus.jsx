export default function PaymentStatus({ payment, isClient, onRelease, releasing }) {
  if (!payment) return null;

  const statusConfig = {
    pending: { label: "Payment Pending", color: "amber", icon: "⏳" },
    paid:    { label: "Payment Secured", color: "cyan",  icon: "🔒" },
    released:{ label: "Payment Released", color: "green", icon: "✅" },
    refunded:{ label: "Refunded", color: "red", icon: "↩️" },
  };

  const config = statusConfig[payment.status] || statusConfig.pending;

  return (
    <div className={"payment-status payment-status--" + config.color}>
      <div className="payment-status-left">
        <span className="payment-status-icon">{config.icon}</span>
        <div>
          <div className="payment-status-label">{config.label}</div>
          <div className="payment-status-amount">${payment.amount}</div>
        </div>
      </div>
      {isClient && payment.status === "paid" && (
        <button className="btn btn--success btn--sm" onClick={onRelease} disabled={releasing}>
          {releasing ? "Releasing..." : "Release Payment"}
        </button>
      )}
    </div>
  );
}
