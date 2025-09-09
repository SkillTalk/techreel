import React, { useEffect, useState } from "react";
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
  const navigate = useNavigate();

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

  const generateBioWithAI = async () => {
    setIsGeneratingBio(true);
    try {
      // Create a prompt based on user's information
      const prompt = `Generate a professional bio for a user with the following information:
      - Profession: ${editForm.profession || 'Not specified'}
      - Skills: ${editForm.skills.join(', ') || 'Not specified'}
      - Experience: ${editForm.experienceYears || 'Not specified'} years
      - Education: ${editForm.education || 'Not specified'}
      - Location: ${editForm.location || 'Not specified'}
      
      Create a concise, professional bio (2-3 sentences) that highlights their expertise and experience. Make it engaging and suitable for a professional networking platform.`;

      // For now, we'll use a mock response since we don't have ChatGPT API integrated
      // In a real implementation, you would call the ChatGPT API here
      const mockBio = `Experienced ${editForm.profession || 'professional'} with ${editForm.experienceYears || 'several'} years of expertise in ${[...editForm.skills, ...editForm.bioCoreSkills].slice(0, 3).join(', ') || 'various technologies'}. Passionate about continuous learning and sharing knowledge with the community.`;
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setEditForm(prev => ({ ...prev, bio: mockBio }));
    } catch (err) {
      console.error("Error generating bio:", err);
      alert("Failed to generate bio. Please try again.");
    } finally {
      setIsGeneratingBio(false);
    }
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
      
      const res = await axios.put(`${BASE_URL}/users/${user._id}`, editForm, {
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
          <h3 className="section-title">Basic Information</h3>
          
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
              <button 
                className="ai-generate-btn"
                onClick={generateBioWithAI}
                disabled={isGeneratingBio}
              >
                {isGeneratingBio ? "Generating..." : "🤖 Generate with AI"}
              </button>
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

          {/* Skills Section */}
          <div className="form-group">
            <label className="form-label">Skills</label>
            <div className="tags-input-group">
              <div className="tags-container">
                {editForm.skills.map((skill, index) => (
                  <span key={index} className="tag">
                    {skill}
                    <button 
                      className="tag-remove"
                      onClick={() => removeSkill(skill)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="tag-input">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill..."
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                />
                <button className="add-tag-btn" onClick={addSkill}>+</button>
              </div>
            </div>
          </div>

          {/* Profession */}
          <div className="form-group">
            <label className="form-label">Profession</label>
            <input
              type="text"
              className="form-input"
              value={editForm.profession}
              onChange={(e) => handleInputChange('profession', e.target.value)}
              placeholder="e.g., Software Engineer, Designer, Consultant"
            />
          </div>

          {/* Experience */}
          <div className="form-group">
            <label className="form-label">Years of Experience</label>
            <input
              type="number"
              className="form-input"
              value={editForm.experienceYears}
              onChange={(e) => handleInputChange('experienceYears', e.target.value)}
              placeholder="e.g., 5"
              min="0"
              max="50"
            />
          </div>
        </div>

        <div className="form-section">
          <h3 className="section-title">Additional Information</h3>
          
          {/* Location */}
          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              className="form-input"
              value={editForm.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="e.g., San Francisco, CA"
            />
          </div>

          {/* Education */}
          <div className="form-group">
            <label className="form-label">Education</label>
            <input
              type="text"
              className="form-input"
              value={editForm.education}
              onChange={(e) => handleInputChange('education', e.target.value)}
              placeholder="e.g., Bachelor's in Computer Science"
            />
          </div>

          {/* Interests */}
          <div className="form-group">
            <label className="form-label">Interests</label>
            <div className="tags-input-group">
              <div className="tags-container">
                {editForm.interests.map((interest, index) => (
                  <span key={index} className="tag">
                    {interest}
                    <button 
                      className="tag-remove"
                      onClick={() => removeInterest(interest)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="tag-input">
                <input
                  type="text"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add an interest..."
                  onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                />
                <button className="add-tag-btn" onClick={addInterest}>+</button>
              </div>
            </div>
          </div>

          {/* Website */}
          <div className="form-group">
            <label className="form-label">Website</label>
            <input
              type="url"
              className="form-input"
              value={editForm.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;

