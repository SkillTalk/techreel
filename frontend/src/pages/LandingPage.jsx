// src/pages/LandingPage.jsx (Framer-style Inspired + Mobile Friendly + Overflow Fix + Animated Tiles)

import React from "react";
import { Link } from "react-router-dom";
import "./landingpage.css";

const LandingPage = () => {
  return (
    <div className="landing-framer-container">
      {/* Hero Section */}
      <section className="framer-hero">
        <h1 className="framer-title">
          Your Skills. Your Voice. <span className="gradient-text">Live on SkillTalk</span>
        </h1>
        <p className="framer-subtext">
          Join real-time voice rooms to share, build, and connect over what you're best at.
        </p>
        <div className="cta-buttons">
          <Link to="/signup" className="framer-btn primary">
            Start Your Skill Journey
          </Link>
          <Link to="/login" className="framer-btn outline">
            Explore as Guest
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="framer-features">
        {[
          {
            title: "Voice Rooms",
            desc: "Jump into topic-based rooms and speak live with fellow learners.",
            delay: "0s"
          },
          {
            title: "Skill-Based Matchmaking",
            desc: "Smart pairing with people from your domain of interest.",
            delay: "0.2s"
          },
          {
            title: "Project Collaboration",
            desc: "Start small projects together and build in public.",
            delay: "0.4s"
          },
          {
            title: "Follow & DM",
            desc: "Stay connected with people who inspire you.",
            delay: "0.6s"
          }
        ].map((item, i) => (
          <div
            key={i}
            className="feature-tile animated-tile feature-hover"
            style={{ animationDelay: item.delay }}
          >
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </div>
        ))}
      </section>

      {/* Community CTA */}
      <section className="framer-community">
        <h2>
          10,000+ Users. 50+ Tech Domains. <br /> Countless Conversations.
        </h2>
        <Link to="/signup" className="framer-btn primary framer-join-btn">
          Join the Movement
        </Link>
      </section>

      {/* Footer CTA */}
      <footer className="framer-footer">
        <p>Made with 💙 for learners, by learners.</p>
      </footer>
    </div>
  );
};

export default LandingPage;

