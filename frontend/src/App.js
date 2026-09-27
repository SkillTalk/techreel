import React, { useState } from "react";
import "./App.css";

const plans = [
  {
    name: "The Works",
    price: "24",
    color: "red",
    badge: "BEST VALUE",
    features: ["Ceramic Shield", "Hot Wax & Shine", "Tire Shine", "Wheel Cleaner", "Triple Foam", "Spot-Free Rinse", "Power Dry"],
  },
  {
    name: "Freedom Wash",
    price: "20",
    color: "blue",
    features: ["Hot Wax & Shine", "Tire Shine", "Wheel Cleaner", "Triple Foam", "Spot-Free Rinse", "Power Dry"],
  },
  {
    name: "Deluxe Wash",
    price: "16",
    color: "navy",
    features: ["Wheel Cleaner", "Triple Foam", "Spot-Free Rinse", "Power Dry"],
  },
  {
    name: "Express Wash",
    price: "10",
    color: "sky",
    features: ["Soft-Touch Wash", "Spot-Free Rinse", "Power Dry"],
  },
];

function Logo() {
  return (
    <a className="logo" href="#top" aria-label="Freedom Express Car Wash home">
      <span className="logo-waves" aria-hidden="true"><i /><i /><i /></span>
      <span><strong>FREEDOM</strong><small>EXPRESS CAR WASH</small></span>
    </a>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div id="top" className="site-shell">
      <div className="utility-bar">
        <div className="utility-inner">
          <span>Fast. Friendly. Freedom.</span>
          <div><a href="#locations">Locations</a><a href="#contact">Contact Us</a><a href="#account">My Account</a></div>
        </div>
      </div>

      <header className="main-header">
        <div className="nav-wrap">
          <Logo />
          <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Toggle navigation">
            <span /><span /><span />
          </button>
          <nav className={menuOpen ? "open" : ""}>
            <a href="#wash-menu">Wash Menu</a>
            <a href="#unlimited">Unlimited Club</a>
            <a href="#fleet">Fleet Program</a>
            <a href="#about">About Us</a>
            <a className="nav-cta" href="#locations">Find a Location</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero" id="wash-menu">
          <div className="bubbles" aria-hidden="true"><i /><i /><i /><i /><i /></div>
          <div className="hero-copy">
            <p className="eyebrow">A CLEAN CAR FEELS GOOD</p>
            <h1>Choose Your<br /><em>Wash</em></h1>
            <p>From a quick clean to our ultimate shine, there’s a Freedom wash made for every car.</p>
            <a className="button button-red" href="#packages">Explore Washes <span>→</span></a>
          </div>
          <div className="car-art" aria-label="A clean blue car covered with soap bubbles">
            <div className="sunburst" />
            <div className="car">
              <div className="windshield" />
              <div className="body"><i className="light left" /><i className="grille" /><i className="light right" /></div>
              <i className="wheel wheel-left" /><i className="wheel wheel-right" />
            </div>
          </div>
          <div className="wave" />
        </section>

        <section className="packages" id="packages">
          <div className="section-heading">
            <p className="eyebrow">ONE WASH. A WHOLE LOT OF SHINE.</p>
            <h2>Single Wash Packages</h2>
            <p>Every wash includes free vacuums, mat cleaners and a smile—because clean should always feel this good.</p>
          </div>
          <div className="plan-grid">
            {plans.map((plan) => (
              <article className={`plan-card ${plan.color}`} key={plan.name}>
                {plan.badge && <span className="badge">{plan.badge}</span>}
                <div className="plan-top">
                  <span className="sparkle">✦</span>
                  <h3>{plan.name}</h3>
                  <div className="price"><sup>$</sup>{plan.price}<small>single<br />wash</small></div>
                </div>
                <ul>
                  {plan.features.map((feature) => <li key={feature}><span>✓</span>{feature}</li>)}
                </ul>
                <a href="#locations" className="plan-button">Get This Wash <span>→</span></a>
              </article>
            ))}
          </div>
        </section>

        <section className="unlimited" id="unlimited">
          <div className="unlimited-copy">
            <p className="eyebrow">WASH MORE. SAVE MORE.</p>
            <h2>Unlimited Clean.<br /><em>Unbeatable Value.</em></h2>
            <p>Love that just-washed feeling? Join the Unlimited Wash Club and wash every day for one low monthly price.</p>
            <a className="button button-white" href="#join">View Unlimited Plans <span>→</span></a>
          </div>
          <div className="membership-card">
            <span>UNLIMITED</span>
            <strong>WASH CLUB</strong>
            <small>WASH OFTEN. DRIVE HAPPY.</small>
          </div>
        </section>
      </main>

      <footer id="contact"><Logo /><p>© 2026 Freedom Express Car Wash. All rights reserved.</p></footer>
    </div>
  );
}

export default App;
