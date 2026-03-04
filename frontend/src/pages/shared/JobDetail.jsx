import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useAuth } from "../../context/AuthContext";
import { getJob, markJobComplete, withdrawJob } from "../../api/jobs";
import { submitBid, acceptBid, rejectBid, cancelContract } from "../../api/bids";
import { getMessages } from "../../api/messages";
import { submitReview } from "../../api/reviews";
import { createPaymentIntent, getPaymentForJob, releasePayment } from "../../api/payments";
import { useSocket } from "../../hooks/useSocket";
import { raiseDispute, getDispute } from "../../api/disputes";
import StarRating from "../../components/common/StarRating";
import PaymentForm from "../../components/common/PaymentForm";
import PaymentStatus from "../../components/common/PaymentStatus";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [bids, setBids] = useState([]);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Bid modal
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidForm, setBidForm] = useState({ amount: "", proposal: "" });
  const [bidError, setBidError] = useState("");
  const [bidLoading, setBidLoading] = useState(false);

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [releasing, setReleasing] = useState(false);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // Withdraw modal
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [dispute, setDispute] = useState(null);

  // Review modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: "" });
  const [reviewError, setReviewError] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Chat
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);

  const isClient = job && String(job.clientId?._id) === user._id;
  const isAssignedFreelancer = job && String(job.assignedFreelancerId?._id) === user._id;
  const isInChat = job?.status === "in-progress" && (isClient || isAssignedFreelancer);

  const { messages, setMessages, sendMessage, connected } = useSocket(isInChat ? id : null);

  useEffect(() => {
    if (isInChat) {
      getMessages(id).then(res => setMessages(res.data.messages.map(m => ({
        _id: m._id,
        sender: { _id: m.senderId._id, name: m.senderId.name, role: m.senderId.role },
        text: m.text, timestamp: m.timestamp,
      })))).catch(() => {});
    }
  }, [isInChat, id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { fetchJob(); }, [id]);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const [jobRes, paymentRes, disputeRes] = await Promise.all([
        getJob(id),
        getPaymentForJob(id).catch(() => ({ data: { payment: null } })),
        getDispute(id).catch(() => ({ data: { dispute: null } })),
      ]);
      setJob(jobRes.data.job);
      setBids(jobRes.data.bids || []);
      setPayment(paymentRes.data.payment);
      setDispute(disputeRes.data.dispute);
    } catch (err) { setError("Failed to load job"); }
    finally { setLoading(false); }
  };

  const handleAcceptBid = async (bid) => {
    if (!window.confirm("Accept this bid? You will be prompted to pay via Stripe.")) return;
    setActionLoading(true); setActionError("");
    try {
      await acceptBid(bid._id);
      const res = await createPaymentIntent({ jobId: id, bidId: bid._id });
      setClientSecret(res.data.clientSecret);
      setPaymentIntentId(res.data.payment.stripePaymentIntentId);
      setPaymentAmount(bid.amount);
      setShowPaymentModal(true);
      fetchJob();
    } catch (err) { setActionError(err.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleRejectBid = async (bidId, freelancerName) => {
    if (!window.confirm(`Reject bid from ${freelancerName}? They will be notified.`)) return;
    setActionLoading(true); setActionError("");
    try {
      await rejectBid(bidId);
      fetchJob();
    } catch (err) { setActionError(err.response?.data?.message || "Failed to reject bid"); }
    finally { setActionLoading(false); }
  };

  const handleCancelContract = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) return;
    setCancelLoading(true);
    try {
      await cancelContract(id, cancelReason);
      setShowCancelModal(false);
      setCancelReason("");
      fetchJob();
      alert("Contract cancelled. Job is now open for new bids.");
    } catch (err) { setActionError(err.response?.data?.message || "Failed to cancel contract"); }
    finally { setCancelLoading(false); }
  };

  // ── Withdraw Job ────────────────────────────────────────────────────────────
  const handleWithdraw = async () => {
    setWithdrawLoading(true);
    try {
      await withdrawJob(id);
      setShowWithdrawModal(false);
      fetchJob();
      alert("Job withdrawn. All pending bids have been rejected and freelancers notified.");
    } catch (err) { setActionError(err.response?.data?.message || "Failed to withdraw job"); }
    finally { setWithdrawLoading(false); }
  };

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    setDisputeLoading(true);
    try {
      await raiseDispute(id, { reason: disputeReason });
      setShowDisputeModal(false); setDisputeReason("");
      fetchJob();
      alert("Dispute raised. An admin will review it shortly.");
    } catch (err) { setActionError(err.response?.data?.message || "Failed to raise dispute"); }
    finally { setDisputeLoading(false); }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    fetchJob();
    alert("Payment secured! The freelancer has been notified.");
  };

  const handleReleasePayment = async () => {
    if (!window.confirm("Release payment to freelancer? This cannot be undone.")) return;
    setReleasing(true);
    try { await releasePayment(id); fetchJob(); alert("Payment released!"); }
    catch (err) { setActionError(err.response?.data?.message || "Failed"); }
    finally { setReleasing(false); }
  };

  const handleMarkComplete = async () => {
    if (!window.confirm("Mark this job as complete?")) return;
    setActionLoading(true); setActionError("");
    try { await markJobComplete(id); fetchJob(); }
    catch (err) { setActionError(err.response?.data?.message || "Failed"); }
    finally { setActionLoading(false); }
  };

  const handleSubmitBid = async (e) => {
    e.preventDefault(); setBidError(""); setBidLoading(true);
    try {
      await submitBid({ jobId: id, amount: bidForm.amount, proposal: bidForm.proposal });
      setShowBidModal(false); setBidForm({ amount: "", proposal: "" });
      alert("Bid submitted!");
    } catch (err) { setBidError(err.response?.data?.message || "Failed"); }
    finally { setBidLoading(false); }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault(); setReviewError(""); setReviewLoading(true);
    try {
      await submitReview({ jobId: id, rating: reviewForm.rating, comment: reviewForm.comment });
      setShowReviewModal(false); setReviewSubmitted(true);
      alert("Review submitted!");
    } catch (err) { setReviewError(err.response?.data?.message || "Failed"); }
    finally { setReviewLoading(false); }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim()); setChatInput("");
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (error) return <div className="alert alert--error">{error}</div>;
  if (!job) return null;

  const canBid = user.role === "freelancer" && job.status === "open" && !isClient;
  const canReview = isClient && job.status === "completed" && !reviewSubmitted;
  const canWithdraw = isClient && job.status === "open";
  const canDispute = (isClient || isAssignedFreelancer) && job.status === "in-progress" && !dispute;
  const hasOpenDispute = dispute && dispute.status === "open";

  return (
    <div className="job-detail">
      <div className="page-header">
        <div>
          <div className="breadcrumb"><button onClick={() => navigate(-1)} className="btn btn--ghost btn--sm">← Back</button></div>
          <h1>{job.title}</h1>
          <div className="job-meta">
            <span className={"status-badge status-badge--" + job.status}>{job.status}</span>
            <span className="text-muted">by <Link to={`/profile/${job.clientId?._id}`}>{job.clientId?.name}</Link></span>
            <span className="text-muted">Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
            {hasOpenDispute && <span className="status-badge" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>Dispute Open</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {canBid && <button className="btn btn--primary" onClick={() => setShowBidModal(true)}>Place Bid</button>}
          {isAssignedFreelancer && job.status === "in-progress" && (
            <button className="btn btn--success" onClick={handleMarkComplete} disabled={actionLoading}>Mark Complete</button>
          )}
          {isClient && job.status === "in-progress" && (
            <button className="btn btn--danger" onClick={() => setShowCancelModal(true)}>Cancel Contract</button>
          )}
          {isClient && job.status === "open" && (
            <button className="btn btn--ghost" onClick={() => navigate(`/jobs/${job._id}/edit`)}>
              Edit Job
            </button>
          )}
          {/* Withdraw Job — only for open jobs owned by client */}
          {canWithdraw && (
            <button className="btn btn--danger" onClick={() => setShowWithdrawModal(true)} disabled={actionLoading}>
              Withdraw Job
            </button>
          )}
          {canDispute && (
            <button className="btn btn--danger" onClick={() => setShowDisputeModal(true)}>⚠️ Raise Dispute</button>
          )}

          {canReview && <button className="btn btn--primary" onClick={() => setShowReviewModal(true)}>⭐ Leave Review</button>}
        </div>
      </div>

      {actionError && <div className="alert alert--error">{actionError}</div>}

      {dispute && (
        <div style={{ padding: "1rem 1.25rem", borderRadius: "8px", marginBottom: "1rem", background: dispute.status === "open" ? "rgba(245,158,11,0.08)" : "rgba(16,185,129,0.08)", border: `1px solid ${dispute.status === "open" ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.3)"}` }}>
          <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
            {dispute.status === "open" ? "Dispute Under Review" : "Dispute Resolved"}
          </div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
            Raised by {dispute.raisedBy?.name} · {dispute.reason}
          </div>
          {dispute.resolution && (
            <div style={{ fontSize: "0.875rem", marginTop: "0.35rem", color: "#10b981" }}>
              Resolution: {dispute.resolution.replace(/_/g, " ")}
              {dispute.adminNote && ` — "${dispute.adminNote}"`}
            </div>
          )}
        </div>
      )}

      {/* Payment Status Banner */}
      {payment && (isClient || isAssignedFreelancer) && (
        <PaymentStatus payment={payment} isClient={isClient} onRelease={handleReleasePayment} releasing={releasing} />
      )}

      <div className="content-card">
        <h2>Job Description</h2>
        <p className="description-text">{job.description}</p>
        <div className="job-details-grid">
          <div className="detail-item"><span className="detail-label">Budget Range</span><span className="detail-value">${job.budgetMin} – ${job.budgetMax}</span></div>
          <div className="detail-item"><span className="detail-label">Deadline</span><span className="detail-value">{new Date(job.deadline).toLocaleDateString()}</span></div>
          {job.assignedFreelancerId && (
            <div className="detail-item">
              <span className="detail-label">Assigned Freelancer</span>
              <Link to={`/profile/${job.assignedFreelancerId._id}`} className="detail-value">{job.assignedFreelancerId.name}</Link>
            </div>
          )}
        </div>
      </div>

      {/* Bids (client only) */}
      {isClient && (
        <div className="content-card">
          <h2>Bids ({bids.length})</h2>
          {bids.length === 0 ? <div className="empty-state"><p>No bids yet</p></div> : (
            <div className="bids-list">
              {bids.map((bid) => (
                <div key={bid._id} className={"bid-card bid-card--" + bid.status}>
                  <div className="bid-header">
                    <div>
                      <Link to={`/profile/${bid.freelancerId?._id}`}><strong>{bid.freelancerId?.name}</strong></Link>
                      {bid.freelancerId?.avgRating > 0 && <span className="inline-rating">⭐ {bid.freelancerId.avgRating}</span>}
                      <span className="bid-amount">${bid.amount}</span>
                    </div>
                    <span className={"status-badge status-badge--" + bid.status}>{bid.status}</span>
                  </div>
                  <p className="bid-proposal">{bid.proposal}</p>
                  {bid.status === "pending" && job.status === "open" && (
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button className="btn btn--primary btn--sm" onClick={() => handleAcceptBid(bid)} disabled={actionLoading}>
                        ✓ Accept & Pay
                      </button>
                      <button className="btn btn--danger btn--sm" onClick={() => handleRejectBid(bid._id, bid.freelancerId?.name)} disabled={actionLoading}>
                        ✕ Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat */}
      {isInChat && (
        <div className="content-card chat-card">
          <div className="chat-header">
            <h2>Project Chat</h2>
            <span className={"connection-dot" + (connected ? " connected" : "")}>{connected ? "● Connected" : "● Connecting..."}</span>
          </div>
          <div className="chat-messages">
            {messages.length === 0 && <div className="chat-empty">Start the conversation!</div>}
            {messages.map((msg) => {
              const isMine = String(msg.sender?._id) === user._id;
              return (
                <div key={msg._id} className={"message" + (isMine ? " message--mine" : "")}>
                  {!isMine && <span className="message-sender">{msg.sender?.name}</span>}
                  <div className="message-bubble">{msg.text}</div>
                  <span className="message-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type a message..." disabled={!connected} />
            <button type="submit" disabled={!connected || !chatInput.trim()} className="btn btn--primary">Send</button>
          </form>
        </div>
      )}

      {/* Bid Modal */}
      {showBidModal && (
        <div className="modal-overlay" onClick={() => setShowBidModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Submit Your Bid</h2><button className="modal-close" onClick={() => setShowBidModal(false)}>✕</button></div>
            {bidError && <div className="alert alert--error" style={{ margin: "0 1.75rem" }}>{bidError}</div>}
            <form onSubmit={handleSubmitBid} className="modal-form">
              <div className="form-group">
                <label>Bid Amount (USD)</label>
                <input type="number" min="1" value={bidForm.amount} onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })} placeholder={`Budget: $${job.budgetMin} - $${job.budgetMax}`} required />
              </div>
              <div className="form-group">
                <label>Proposal</label>
                <textarea value={bidForm.proposal} onChange={(e) => setBidForm({ ...bidForm, proposal: e.target.value })} placeholder="Describe your approach..." rows={5} required minLength={20} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn--ghost" onClick={() => setShowBidModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={bidLoading}>{bidLoading ? "Submitting..." : "Submit Bid"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && clientSecret && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Secure Payment</h2>
              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>
            <div style={{ padding: "0 1.75rem" }}>
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm clientSecret={clientSecret} paymentIntentId={paymentIntentId} amount={paymentAmount} onSuccess={handlePaymentSuccess} onCancel={() => setShowPaymentModal(false)} />
              </Elements>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Withdraw Job</h2>
              <button className="modal-close" onClick={() => setShowWithdrawModal(false)}>✕</button>
            </div>
            <div className="modal-form">
              <div className="cancel-warning">
                <p>This will permanently withdraw this job posting.</p>
                <p>All pending bids will be rejected and freelancers will be notified.</p>
                <p>This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn--ghost" onClick={() => setShowWithdrawModal(false)}>Keep Job</button>
              <button className="btn btn--danger" onClick={handleWithdraw} disabled={withdrawLoading}>
                {withdrawLoading ? "Withdrawing..." : "Confirm Withdraw"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDisputeModal && (
        <div className="modal-overlay" onClick={() => setShowDisputeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Raise a Dispute</h2>
              <button className="modal-close" onClick={() => setShowDisputeModal(false)}>✕</button>
            </div>
            <form onSubmit={handleRaiseDispute} className="modal-form">
              <div className="cancel-warning">
                <p>An admin will review your dispute and take appropriate action.</p>
                <p>Please provide as much detail as possible.</p>
              </div>
              <div className="form-group">
                <label>Reason for dispute *</label>
                <textarea value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Describe the issue in detail..." rows={5} required minLength={20} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn--ghost" onClick={() => setShowDisputeModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--danger" disabled={disputeLoading || disputeReason.trim().length < 20}>
                  {disputeLoading ? "Submitting..." : "Submit Dispute"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Contract Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Cancel Contract</h2>
              <button className="modal-close" onClick={() => setShowCancelModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCancelContract} className="modal-form">
              <div className="cancel-warning">
                <p>This will cancel the contract and reopen the job for new bids.</p>
                {payment?.status === "paid" && <p className="cancel-refund-note">Your payment will be refunded.</p>}
                <p>The freelancer will be notified with your reason.</p>
              </div>
              <div className="form-group">
                <label>Reason for cancellation *</label>
                <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. The freelancer is not responsive..." rows={4} required minLength={10} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn--ghost" onClick={() => setShowCancelModal(false)}>Keep Contract</button>
                <button type="submit" className="btn btn--danger" disabled={cancelLoading || !cancelReason.trim()}>
                  {cancelLoading ? "Cancelling..." : "Cancel Contract"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h2>Leave a Review</h2><button className="modal-close" onClick={() => setShowReviewModal(false)}>✕</button></div>
            {reviewError && <div className="alert alert--error" style={{ margin: "0 1.75rem" }}>{reviewError}</div>}
            <form onSubmit={handleSubmitReview} className="modal-form">
              <div className="form-group"><label>Rating</label><StarRating rating={reviewForm.rating} onRate={(r) => setReviewForm({ ...reviewForm, rating: r })} size="lg" /></div>
              <div className="form-group"><label>Comment</label><textarea value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} placeholder="Share your experience..." rows={4} required minLength={10} /></div>
              <div className="modal-actions">
                <button type="button" className="btn btn--ghost" onClick={() => setShowReviewModal(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={reviewLoading || reviewForm.rating === 0}>{reviewLoading ? "Submitting..." : "Submit Review"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
