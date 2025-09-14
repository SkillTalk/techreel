import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../utils/api";
import "./EditProfile.css";

const EditProfile = () => {
  const [user, setUser] = useState(null);
  const [editForm, setEditForm] = useState({
    bio: "",
    bioHeadline: "",
    bioSummary: "",
    bioCoreSkills: [],
    bioMotivation: "",
    bioCurrentFocus: "",
    skills: [],
    profession: "",
    experienceYears: "",
    location: "",
    education: "",
    interests: [],
    website: ""
  });
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [resumeGenerating, setResumeGenerating] = useState(false);
  const [resumeProgress, setResumeProgress] = useState(0);
  const [resumeText, setResumeText] = useState("");
  const [generatedPortfolio, setGeneratedPortfolio] = useState(null);
  const [projectsDraft, setProjectsDraft] = useState([]);
  const navigate = useNavigate();
  const resumeTickRef = useRef(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser) return navigate("/login");

    const fetchUser = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/users/${storedUser._id}`);
        setUser(res.data.user);
        setEditForm({
          bio: res.data.user.bio || "",
          bioHeadline: res.data.user.bioHeadline || "",
          bioSummary: res.data.user.bioSummary || "",
          bioCoreSkills: res.data.user.bioCoreSkills || [],
          bioMotivation: res.data.user.bioMotivation || "",
          bioCurrentFocus: res.data.user.bioCurrentFocus || "",
          skills: res.data.user.skills || [],
          profession: res.data.user.profession || "",
          experienceYears: res.data.user.experienceYears || "",
          location: res.data.user.location || "",
          education: res.data.user.education || "",
          interests: res.data.user.interests || [],
          website: res.data.user.website || ""
        });
      } catch (err) {
        console.error("Error fetching user:", err);
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !editForm.skills.includes(newSkill.trim())) {
      setEditForm(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  // Structured bio chip handlers
  const [newBioSkill, setNewBioSkill] = useState("");
  const addBioSkill = () => {
    if (newBioSkill.trim() && !editForm.bioCoreSkills.includes(newBioSkill.trim())) {
      setEditForm(prev => ({ ...prev, bioCoreSkills: [...prev.bioCoreSkills, newBioSkill.trim()] }));
      setNewBioSkill("");
    }
  };
  const removeBioSkill = (s) => {
    setEditForm(prev => ({ ...prev, bioCoreSkills: prev.bioCoreSkills.filter(x => x !== s) }));
  };

  const removeSkill = (skillToRemove) => {
    setEditForm(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !editForm.interests.includes(newInterest.trim())) {
      setEditForm(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest("");
    }
  };

  const removeInterest = (interestToRemove) => {
    setEditForm(prev => ({
      ...prev,
      interests: prev.interests.filter(interest => interest !== interestToRemove)
    }));
  };

  const handleResumeUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      const name = (file.name || '').toLowerCase();
      const isBinary = name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.docx');
      setResumeGenerating(true);
      setResumeProgress(0);
      if (resumeTickRef.current) clearInterval(resumeTickRef.current);
      resumeTickRef.current = setInterval(() => {
        setResumeProgress((p) => (p < 90 ? p + 3 : p));
      }, 150);
      if (isBinary) {
        const form = new FormData();
        form.append('resume', file);
        const res = await fetch(`${BASE_URL}/ai/portfolio/upload`, { method: 'POST', body: form });
        const data = await res.json();
        setGeneratedPortfolio(data?.portfolio || null);
      } else {
        const text = await file.text();
        setResumeText(text);
        const res = await fetch(`${BASE_URL}/ai/portfolio`, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ text }) });
        const data = await res.json();
        setGeneratedPortfolio(data?.portfolio || null);
      }
      setResumeProgress(100);
      if (resumeTickRef.current) {
        clearInterval(resumeTickRef.current);
        resumeTickRef.current = null;
      }
      setTimeout(() => setResumeProgress(0), 800);
    } catch (err) {
      console.error('Resume parse/generate failed', err);
      alert('Could not parse resume. Try another file.');
    } finally {
      setResumeGenerating(false);
      if (resumeTickRef.current) {
        clearInterval(resumeTickRef.current);
        resumeTickRef.current = null;
      }
    }
  };

  const applyPortfolioToForm = () => {
    if (!generatedPortfolio) return;
    const p = generatedPortfolio;
    setEditForm(prev => ({
      ...prev,
      bioHeadline: p.headline || prev.bioHeadline,
      bioSummary: p.about || prev.bioSummary,
      bioCoreSkills: Array.isArray(p.skills) ? p.skills.slice(0, 12) : prev.bioCoreSkills,
      bio: p.about || prev.bio,
      profession: prev.profession || (p.experience && p.experience[0]?.role) || prev.profession,
      experienceYears: prev.experienceYears || (Array.isArray(p.experience) ? p.experience.length : prev.experienceYears)
    }));
    if (Array.isArray(p.projects)) setProjectsDraft(p.projects.map(pr => ({
      name: pr.name || "",
      company: pr.company || "",
      role: pr.role || "",
      summary: pr.summary || pr.description || "",
      impact: pr.impact || "",
      tools: Array.isArray(pr.tools) ? pr.tools : [],
      link: pr.link || "",
      start: pr.start || "",
      end: pr.end || "",
      duration: pr.duration || ""
    })));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      
      // Test the token first
      if (!token) {
        alert("No authentication token found. Please login again.");
        navigate("/login");
        return;
      }
      
      const payload = { ...editForm };
      if (projectsDraft && projectsDraft.length) payload.portfolioProjects = projectsDraft;
      const res = await axios.put(`${BASE_URL}/users/${user._id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/profile", { state: { refresh: true } });
    } catch (err) {
      console.error("Update failed:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      console.error("Error headers:", err.response?.headers);
      
      if (err.response?.status === 401) {
        alert("Authentication failed. Please login again.");
        navigate("/login");
      } else if (err.response?.status === 403) {
        alert("You don't have permission to update this profile.");
      } else {
        alert(`Update failed: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return (
    <div className="edit-loading">
      <div className="loading-spinner"></div>
      <p>Loading profile...</p>
    </div>
  );

  return (
    <div className="edit-profile-container">
      {/* Header */}
      <div className="edit-header">
        <div className="header-left">
          <button 
            className="back-btn" 
            onClick={() => navigate("/profile")}
          >
            ← Back to Profile
          </button>
          <h1 className="edit-title">Edit Profile</h1>
        </div>
        <div className="header-right">
          <button 
            className="save-btn" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="edit-content">
        <div className="form-section">
          <h3 className="section-title">Bio & Portfolio</h3>
          
          {/* AI Resume to Portfolio */}
          <div className="form-group">
            <label className="form-label">Resume → AI Portfolio</label>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={handleResumeUpload} />
              {(resumeGenerating || resumeProgress > 0) && (
                <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:180 }}>
                  <div style={{ position:'relative', flex:1, height:8, background:'#E5E7EB', borderRadius:999 }}>
                    <div style={{ position:'absolute', inset:0, width:`${resumeProgress}%`, background:'linear-gradient(135deg,#00ff94,#00c3ff)', borderRadius:999, transition:'width .15s linear' }} />
                  </div>
                  <span style={{ fontSize:12, color:'#374151', minWidth:34, textAlign:'right' }}>{Math.min(100, Math.max(0, Math.round(resumeProgress)))}%</span>
                </div>
              )}
              {generatedPortfolio && (
                <button className="ai-generate-btn" onClick={applyPortfolioToForm}>Apply to Bio</button>
              )}
            </div>
            {generatedPortfolio && (
              <pre className="form-textarea" style={{whiteSpace:'pre-wrap', background:'#0b0f14', color:'#e5e7eb', border:'1px solid #1f2950', padding:10}}>{JSON.stringify(generatedPortfolio, null, 2)}</pre>
            )}
          </div>

          {/* Bio Section */}
          <div className="form-group">
            <label className="form-label">Bio</label>
            <div className="bio-input-group">
              <textarea
                className="form-textarea"
                value={editForm.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself, your experience, and what you're passionate about..."
                rows={4}
              />
            </div>
          </div>

          {/* Structured Bio Fields */}
          <div className="form-group">
            <label className="form-label">Bio Headline</label>
            <input
              type="text"
              className="form-input"
              value={editForm.bioHeadline}
              onChange={(e) => handleInputChange('bioHeadline', e.target.value)}
              placeholder="e.g., Full‑Stack Developer — real‑time apps, clean UX"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Professional Summary</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={editForm.bioSummary}
              onChange={(e) => handleInputChange('bioSummary', e.target.value)}
              placeholder="1–2 sentences about your experience, domains, and approach"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Core Skills (for Bio)</label>
            <div className="tags-input-group">
              <div className="tags-container">
                {editForm.bioCoreSkills.map((skill, index) => (
                  <span key={index} className="tag">
                    {skill}
                    <button className="tag-remove" onClick={() => removeBioSkill(skill)}>×</button>
                  </span>
                ))}
              </div>
              <div className="tag-input">
                <input
                  type="text"
                  value={newBioSkill}
                  onChange={(e) => setNewBioSkill(e.target.value)}
                  placeholder="Add a core skill..."
                  onKeyPress={(e) => e.key === 'Enter' && addBioSkill()}
                />
                <button className="add-tag-btn" onClick={addBioSkill}>+</button>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Motivation</label>
            <input
              type="text"
              className="form-input"
              value={editForm.bioMotivation}
              onChange={(e) => handleInputChange('bioMotivation', e.target.value)}
              placeholder="What drives you? (optional)"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Current Focus</label>
            <input
              type="text"
              className="form-input"
              value={editForm.bioCurrentFocus}
              onChange={(e) => handleInputChange('bioCurrentFocus', e.target.value)}
              placeholder="What are you working on or open to? (optional)"
            />
          </div>

          {/* Keep minimal meta fields */}
          <div className="form-group">
            <label className="form-label">Profession</label>
            <input type="text" className="form-input" value={editForm.profession} onChange={(e)=>handleInputChange('profession', e.target.value)} placeholder="e.g., Design Verification Engineer" />
          </div>
          <div className="form-group">
            <label className="form-label">Years of Experience</label>
            <input type="number" className="form-input" value={editForm.experienceYears} onChange={(e)=>handleInputChange('experienceYears', e.target.value)} placeholder="e.g., 6" min="0" max="50" />
          </div>
        </div>
        {/* Keep advanced fields minimal; removed extra interests/website/location to streamline */}
      </div>
    </div>
  );
};

export default EditProfile;

