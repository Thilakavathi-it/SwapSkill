



import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost/SwapSkill/get-skills.php";
const REQUEST_URL = "http://localhost/SwapSkill/request-exchange.php";
const OFFER_URL = "http://localhost/SwapSkill/offer-skill.php";
const AUTH_URL = "http://localhost/SwapSkill/auth.php";
const PROFILE_URL = "http://localhost/SwapSkill/profile.php";

const emptyProfile = {
  full_name: "",
  email: "",
  department: "",
  study_year: "",
  skills_interests: "",
  bio: "",
};

async function readResponse(response) {
  const data = await response.json();
  if (!response.ok || data.success === false) {
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}

function App() {
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestingId, setRequestingId] = useState(null);
  const [notice, setNotice] = useState(null);

  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    full_name: "",
    email: "",
    password: "",
  });
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  const [profile, setProfile] = useState(emptyProfile);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  const [requests, setRequests] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [processingRequestId, setProcessingRequestId] = useState(null);

  useEffect(() => {
    checkLogin();
  }, []);

  useEffect(() => {
    if (!authChecked) return;

    if (userId) {
      loadSkills();
      loadProfile();
    } else {
      setSkills([]);
      setProfile(emptyProfile);
      setLoading(false);
    }
  }, [authChecked, userId]);

  useEffect(() => {
    if (userId && (activeTab === "My Exchanges" ||
        activeTab === "Incoming Requests")) {
      loadRequests();
    }
  }, [activeTab, userId]);

  async function checkLogin() {
    try {
      const response = await fetch(`${AUTH_URL}?action=me`, {
        credentials: "include",
      });
      const result = await response.json();

      if (response.ok && result.success && result.user_id) {
        setUserId(Number(result.user_id));
      }
    } catch {
      // The login screen will be shown if the session cannot be checked.
    } finally {
      setAuthChecked(true);
    }
  }

  async function loadSkills() {
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        credentials: "include",
      });
      const data = await response.json();

      if (!response.ok || !Array.isArray(data)) {
        throw new Error(data.message || "Unable to load skills.");
      }

      setSkills(data);
      setError("");
    } catch (err) {
      setError(
        err.message ||
        "Could not load skills. Check that Apache and MySQL are running."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadProfile() {
    setProfileLoading(true);

    try {
      const response = await fetch(PROFILE_URL, {
        credentials: "include",
      });
      const result = await readResponse(response);
      setProfile({ ...emptyProfile, ...result.profile });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setProfileLoading(false);
    }
  }

  async function loadRequests() {
    setRequestsLoading(true);

    try {
      const [outgoingResponse, incomingResponse] = await Promise.all([
        fetch(`${API_URL}?requests=1`, {
          credentials: "include",
        }),
        fetch(`${API_URL}?requests=incoming`, {
          credentials: "include",
        }),
      ]);

      const outgoingData = await outgoingResponse.json();
      const incomingData = await incomingResponse.json();

      if (!outgoingResponse.ok || !Array.isArray(outgoingData)) {
        throw new Error(
          outgoingData.message || "Could not load your outgoing requests."
        );
      }

      if (!incomingResponse.ok || !Array.isArray(incomingData)) {
        throw new Error(
          incomingData.message || "Could not load incoming requests."
        );
      }

      setRequests(outgoingData);
      setIncomingRequests(incomingData);
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setRequestsLoading(false);
    }
  }

  async function handleAuth(event) {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");

    try {
      const action = authMode === "register" ? "register" : "login";
      const response = await fetch(`${AUTH_URL}?action=${action}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });

      const result = await readResponse(response);

      const checkResponse = await fetch(`${AUTH_URL}?action=me`, {
        credentials: "include",
      });
      const session = await readResponse(checkResponse);

      if (!session.user_id) {
        throw new Error("Login succeeded, but the session was not found.");
      }

      setUserId(Number(session.user_id));
      setActiveTab("Dashboard");
      setNotice({ type: "success", text: result.message });
      setAuthForm({ full_name: "", email: "", password: "" });
    } catch (err) {
      setAuthError(err.message || "Could not connect to the server.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    try {
      const response = await fetch(`${AUTH_URL}?action=logout`, {
        method: "POST",
        credentials: "include",
      });
      await readResponse(response);

      setUserId(null);
      setProfile(emptyProfile);
      setRequests([]);
      setIncomingRequests([]);
      setAuthMode("login");
      setAuthForm({ full_name: "", email: "", password: "" });
      setNotice(null);
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setProfileSaving(true);
    setNotice(null);

    try {
      const response = await fetch(PROFILE_URL, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: profile.full_name,
          department: profile.department,
          study_year: profile.study_year,
          skills_interests: profile.skills_interests,
          bio: profile.bio,
        }),
      });

      const result = await readResponse(response);
      setNotice({ type: "success", text: result.message });
      await loadProfile();
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleInterested(skill) {
    setNotice(null);
    setRequestingId(skill.id);

    try {
      const response = await fetch(REQUEST_URL, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill_id: Number(skill.id) }),
      });

      const result = await readResponse(response);

      setNotice({
        type: "success",
        text: `Your request for ${skill.skill_name} was sent! Request ID: ${result.request_id}`,
      });

      await loadSkills();
      setActiveTab("My Exchanges");
      await loadRequests();
    } catch (err) {
      setNotice({
        type: "error",
        text: err.message || "Could not send the exchange request.",
      });
    } finally {
      setRequestingId(null);
    }
  }

  async function updateRequestStatus(requestId, status) {
    setProcessingRequestId(requestId);
    setNotice(null);

    try {
      const response = await fetch(`${REQUEST_URL}?action=respond`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: Number(requestId),
          status,
        }),
      });

      const result = await readResponse(response);

      setNotice({ type: "success", text: result.message });
      await loadRequests();
    } catch (err) {
      setNotice({
        type: "error",
        text: err.message || "Could not update the request.",
      });
    } finally {
      setProcessingRequestId(null);
    }
  }

  const categories = useMemo(
    () => [
      "All",
      ...new Set(skills.map((skill) => skill.category).filter(Boolean)),
    ],
    [skills]
  );

  const filteredSkills = useMemo(() => {
    const query = search.trim().toLowerCase();

    return skills.filter((skill) => {
      const text = [
        skill.skill_name,
        skill.category,
        skill.level,
        skill.description,
      ].filter(Boolean).join(" ").toLowerCase();

      return (
        text.includes(query) &&
        (category === "All" || skill.category === category)
      );
    });
  }, [skills, search, category]);

  if (!authChecked) {
    return <div className="auth-page"><p>Checking your login...</p></div>;
  }

  if (!userId) {
    return (
      <div className="auth-page">
        <form className="auth-card" onSubmit={handleAuth}>
          <div className="brand auth-brand">
            <span className="brand-icon">S</span>
            <span>SkillSwap</span>
          </div>

          <p className="eyebrow">LEARN TOGETHER. GROW TOGETHER.</p>
          <h1>{authMode === "register" ? "Create your account" : "Welcome back"}</h1>
          <p>
            {authMode === "register"
              ? "Register to join the skill-sharing community."
              : "Log in to access your profile and exchanges."}
          </p>

          {authMode === "register" && (
            <label>
              Full name
              <input
                required
                maxLength={100}
                value={authForm.full_name}
                onChange={(e) =>
                  setAuthForm({ ...authForm, full_name: e.target.value })
                }
                placeholder="Enter your full name"
              />
            </label>
          )}

          <label>
            Email address
            <input
              required
              type="email"
              value={authForm.email}
              onChange={(e) =>
                setAuthForm({ ...authForm, email: e.target.value })
              }
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              required
              type="password"
              minLength={8}
              value={authForm.password}
              onChange={(e) =>
                setAuthForm({ ...authForm, password: e.target.value })
              }
              placeholder="At least 8 characters"
            />
          </label>

          {authError && (
            <p className="error-message status-message">{authError}</p>
          )}

          <button className="primary-button auth-submit" disabled={authBusy}>
            {authBusy ? "Please wait..." :
              authMode === "register" ? "Create account" : "Log in"}
          </button>

          <p className="auth-switch">
            {authMode === "register"
              ? "Already have an account?"
              : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === "register" ? "login" : "register");
                setAuthError("");
              }}
            >
              {authMode === "register" ? "Log in" : "Register"}
            </button>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">S</span>
          <span>SkillSwap</span>
        </div>

        <p className="sidebar-label">WORKSPACE</p>

        {[
          "Dashboard",
          "Explore Skills",
          "My Exchanges",
          "Incoming Requests",
          "My Profile",
        ].map((tab) => (
          <button
            key={tab}
            className={`sidebar-link ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            <span>
              {tab === "Dashboard" ? "▦" :
                tab === "Explore Skills" ? "⌕" :
                tab === "My Exchanges" ? "⇄" :
                tab === "Incoming Requests" ? "↙" : "◉"}
            </span>
            {tab}
          </button>
        ))}

        <div className="sidebar-bottom">
          <p>SkillSwap</p>
          <small>Learn together. Grow together.</small>
          <button className="primary-button logout-button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">SKILLSHARE COMMUNITY</p>
            <h1>{activeTab}</h1>
          </div>
          <a className="offer-button" href={OFFER_URL}>+ Offer a Skill</a>
        </header>

        {notice && (
          <div
            className={`status-message ${notice.type === "error" ? "error-message" : ""}`}
            role="status"
          >
            {notice.text}
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss message"
              style={{
                float: "right",
                border: 0,
                background: "transparent",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {activeTab === "Dashboard" && (
          <section>
            <div className="welcome-panel">
              <p className="eyebrow">YOUR LEARNING JOURNEY</p>
              <h2>Welcome to SkillSwap, {profile.full_name || "learner"}!</h2>
              <p>Share what you know, discover new skills, and learn from your community.</p>
              <button className="primary-button" onClick={() => setActiveTab("Explore Skills")}>
                Explore Skills
              </button>
            </div>

            <div className="stats-grid">
              <StatCard title="Skills Available" value={skills.length} />
              <StatCard title="Categories" value={categories.length - 1} />
              <StatCard title="My Exchanges" value={requests.length} />
            </div>

            <h2 className="section-title">Recently Added Skills</h2>
            <SkillGrid
              skills={skills.slice(0, 3)}
              onInterested={handleInterested}
              requestingId={requestingId}
              loading={loading}
              error={error}
              userId={userId}
            />
          </section>
        )}

        {activeTab === "Explore Skills" && (
          <section>
            <div className="welcome-panel explore-banner">
              <p className="eyebrow">DISCOVER SOMETHING NEW</p>
              <h2>Find a skill. Share your talent.</h2>
              <p>Explore skills offered by community members and find something you would love to learn.</p>
            </div>

            <div className="search-panel">
              <label htmlFor="skill-search">Search skills</label>
              <input
                id="skill-search"
                type="search"
                placeholder="Search by skill, category, level, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <label htmlFor="category-filter">Filter by category</label>
              <select
                id="category-filter"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <div className="results-heading">
              <h2 className="section-title">Available Skills</h2>
              <span>{filteredSkills.length} found</span>
            </div>

            <SkillGrid
              skills={filteredSkills}
              onInterested={handleInterested}
              requestingId={requestingId}
              loading={loading}
              error={error}
              userId={userId}
            />
          </section>
        )}

        {activeTab === "My Exchanges" && (
          <section>
            <div className="welcome-panel">
              <p className="eyebrow">YOUR CONNECTIONS</p>
              <h2>My Exchanges</h2>
              <p>Requests you have sent to other skill owners.</p>
              <button className="primary-button" onClick={loadRequests}>
                Refresh requests
              </button>
            </div>

            {requestsLoading ? (
              <p className="status-message">Loading your requests...</p>
            ) : requests.length ? (
              <div className="skill-grid">
                {requests.map((request) => (
                  <article className="skill-card" key={request.id}>
                    <span className="level-badge">{request.status || "Pending"}</span>
                    <h3>{request.skill_name}</h3>
                    <p>Request ID: {request.id}</p>
                    <p>Skill ID: {request.skill_id}</p>
                    <p>Created: {request.created_at}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No outgoing requests yet</h3>
                <p>Explore Skills and request a skill offered by another account.</p>
                <button className="primary-button" onClick={() => setActiveTab("Explore Skills")}>
                  Explore Skills
                </button>
              </div>
            )}
          </section>
        )}

        {activeTab === "Incoming Requests" && (
          <section>
            <div className="welcome-panel">
              <p className="eyebrow">REQUESTS FOR YOUR SKILLS</p>
              <h2>Incoming Requests</h2>
              <p>Accept or reject requests sent to skills you own.</p>
              <button className="primary-button" onClick={loadRequests}>
                Refresh requests
              </button>
            </div>

            {requestsLoading ? (
              <p className="status-message">Loading incoming requests...</p>
            ) : incomingRequests.length ? (
              <div className="skill-grid">
                {incomingRequests.map((request) => (
                  <article className="skill-card" key={request.id}>
                    <span className="level-badge">{request.status || "Pending"}</span>
                    <h3>{request.skill_name}</h3>
                    <p>Request ID: {request.id}</p>
                    <p>Requested by account: {request.requester_id}</p>
                    <p>Created: {request.created_at}</p>

                    {request.status === "Pending" && (
                      <div className="request-actions">
                        <button
                          className="primary-button"
                          disabled={processingRequestId === request.id}
                          onClick={() => updateRequestStatus(request.id, "Accepted")}
                        >
                          {processingRequestId === request.id ? "Please wait..." : "Accept"}
                        </button>
                        <button
                          className="interest-button"
                          disabled={processingRequestId === request.id}
                          onClick={() => updateRequestStatus(request.id, "Rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No incoming requests</h3>
                <p>When another account requests one of your skills, it will appear here.</p>
              </div>
            )}
          </section>
        )}

        {activeTab === "My Profile" && (
          <section>
            <div className="welcome-panel">
              <p className="eyebrow">YOUR SPACE</p>
              <h2>My Profile</h2>
              <p>Your details are loaded from your account in the database.</p>
            </div>

            {profileLoading ? (
              <p className="status-message">Loading your profile...</p>
            ) : (
              <form className="profile-form" onSubmit={saveProfile}>
                <label>
                  Full name
                  <input
                    required
                    maxLength={100}
                    value={profile.full_name || ""}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  />
                </label>

                <label>
                  Email address
                  <input value={profile.email || ""} readOnly />
                </label>

                <label>
                  Department
                  <input
                    maxLength={100}
                    placeholder="e.g. Information Technology"
                    value={profile.department || ""}
                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  />
                </label>

                <label>
                  Year of study
                  <select
                    value={profile.study_year || ""}
                    onChange={(e) => setProfile({ ...profile, study_year: e.target.value })}
                  >
                    <option value="">Select year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Graduate">Graduate</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label>
                  Skills and interests
                  <textarea
                    rows={3}
                    maxLength={5000}
                    placeholder="Python, Java, web development..."
                    value={profile.skills_interests || ""}
                    onChange={(e) => setProfile({ ...profile, skills_interests: e.target.value })}
                  />
                </label>

                <label>
                  About me
                  <textarea
                    rows={4}
                    maxLength={5000}
                    placeholder="Tell the community about yourself..."
                    value={profile.bio || ""}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  />
                </label>

                <button className="primary-button" disabled={profileSaving}>
                  {profileSaving ? "Saving..." : "Save Profile"}
                </button>
              </form>
            )}
          </section>
        )}

        <footer className="app-footer">SkillSwap · React + PHP + MySQL</footer>
      </main>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <p>{title}</p>
      <h2>{value}</h2>
    </div>
  );
}

function SkillGrid({
  skills,
  onInterested,
  requestingId,
  loading,
  error,
  userId,
}) {
  if (loading) {
    return <p className="status-message">Loading skills from database...</p>;
  }

  if (error) {
    return <p className="status-message error-message">{error}</p>;
  }

  if (skills.length === 0) {
    return (
      <div className="empty-state">
        <h3>No skills found</h3>
        <p>Try another search or add a skill using Offer a Skill.</p>
      </div>
    );
  }

  return (
    <div className="skill-grid">
      {skills.map((skill) => {
        const isOwnSkill = Number(skill.user_id) === Number(userId);

        return (
          <article className="skill-card" key={skill.id}>
            <div className="skill-card-top">
              <span className="skill-icon">✦</span>
              <span className="level-badge">{skill.level || "Not specified"}</span>
            </div>
            <p className="skill-category">{skill.category || "Other"}</p>
            <h3>{skill.skill_name}</h3>
            <p className="skill-description">
              {skill.description || "No description provided yet."}
            </p>
            <div className="skill-card-footer">
              <span className="skill-provider">
                {isOwnSkill ? "Your skill" : `Account ${skill.user_id}`}
              </span>

              {isOwnSkill ? (
                <span className="level-badge">Your skill</span>
              ) : (
                <button
                  className="interest-button"
                  onClick={() => onInterested(skill)}
                  disabled={requestingId === skill.id}
                >
                  {requestingId === skill.id ? "Sending..." : "I'm interested →"}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default App;