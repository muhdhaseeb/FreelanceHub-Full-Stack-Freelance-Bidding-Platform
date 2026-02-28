import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getProfile, updateProfile } from "../../api/profiles";
import StarRating from "../../components/common/StarRating";

export default function ProfilePage() {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const isOwnProfile = user._id === id;
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", bio: "", skills: "", location: "", profilePicture: "" });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    getProfile(id).then(res => {
      setProfile(res.data.user);
      setReviews(res.data.reviews || []);
      setForm({
        name: res.data.user.name || "",
        bio: res.data.user.bio || "",
        skills: (res.data.user.skills || []).join(", "),
        location: res.data.user.location || "",
        profilePicture: res.data.user.profilePicture || "",
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleSave = async (e) => {
    e.preventDefault(); setSaveError(""); setSaveLoading(true);
    try {
      const res = await updateProfile({ ...form, skills: form.skills });
      setProfile(res.data.user);
      updateUser(res.data.user);
      setEditing(false);
    } catch (err) { setSaveError(err.response?.data?.message || "Failed to save"); }
    finally { setSaveLoading(false); }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!profile) return <div className="alert alert--error">User not found</div>;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.profilePicture
              ? <img src={profile.profilePicture} alt={profile.name} className="avatar-img avatar-img--lg" />
              : <div className="avatar-placeholder avatar-placeholder--lg">{profile.name?.[0]?.toUpperCase()}</div>
            }
          </div>
          <div className="profile-info">
            <div className="profile-name-row">
              <h1>{profile.name}</h1>
              <span className={"role-badge role-badge--" + profile.role}>{profile.role}</span>
            </div>
            {profile.location && <p className="profile-location">📍 {profile.location}</p>}
            {profile.role === "freelancer" && profile.avgRating > 0 && (
              <div className="profile-rating">
                <StarRating rating={profile.avgRating} readonly />
                <span className="text-muted">({profile.totalReviews} reviews)</span>
              </div>
            )}
            <p className="text-muted">Member since {new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>
          {isOwnProfile && !editing && (
            <button className="btn btn--ghost" onClick={() => setEditing(true)}>Edit Profile</button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="profile-edit-form">
            {saveError && <div className="alert alert--error">{saveError}</div>}
            <div className="form-group"><label>Name</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="form-group"><label>Bio</label><textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Tell clients about yourself..." /></div>
            <div className="form-group"><label>Skills (comma separated)</label><input type="text" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="React, Node.js, MongoDB" /></div>
            <div className="form-group"><label>Location</label><input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="New York, USA" /></div>
            <div className="form-group"><label>Profile Picture URL</label><input type="url" value={form.profilePicture} onChange={e => setForm({ ...form, profilePicture: e.target.value })} placeholder="https://..." /></div>
            <div className="form-actions">
              <button type="button" className="btn btn--ghost" onClick={() => setEditing(false)}>Cancel</button>
              <button type="submit" className="btn btn--primary" disabled={saveLoading}>{saveLoading ? "Saving..." : "Save Changes"}</button>
            </div>
          </form>
        ) : (
          <div className="profile-body">
            {profile.bio && <div className="profile-section"><h3>About</h3><p>{profile.bio}</p></div>}
            {profile.skills?.length > 0 && (
              <div className="profile-section">
                <h3>Skills</h3>
                <div className="skills-list">{profile.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {profile.role === "freelancer" && reviews.length > 0 && (
        <div className="content-card" style={{ marginTop: "1.5rem" }}>
          <h2>Reviews ({reviews.length})</h2>
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review._id} className="review-card">
                <div className="review-header">
                  <div>
                    <strong>{review.clientId?.name}</strong>
                    <StarRating rating={review.rating} readonly size="sm" />
                  </div>
                  <span className="text-muted">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
