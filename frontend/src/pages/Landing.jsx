import { Component, useRef } from "react";
import Beams from "../components/Beams";
import TextType from "../components/TextType";
import VariableProximity from "../components/VariableProximity";
import CircularText from "../components/CircularText";
import ScrollReveal from "../components/ScrollReveal";
import NoiseBackground from "../components/NoiseBackground";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError)
      return <div style={{ position: "absolute", inset: 0, background: "#000" }} />;
    return this.props.children;
  }
}

function Landing() {
  const containerRef = useRef(null);

  const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const handleLogin = () => {
    window.location.href = `${API}/login`;
  };

  const scrollDown = () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  return (
    <div style={styles.page}>
      {/* ── HERO SECTION ── */}
      <section style={styles.hero}>
        {/* Beams background */}
        <div style={{ position: "absolute", inset: 0 }}>
          <ErrorBoundary>
            <Beams
              beamWidth={3}
              beamHeight={30}
              beamNumber={20}
              lightColor="#ffffff"
              speed={2}
              noiseIntensity={1.75}
              scale={0.2}
              rotation={30}
            />
          </ErrorBoundary>
        </div>

        {/* Top-right circular text */}
        <div style={styles.topRight}>
          <CircularText
            text="GET*REMINDERS*WHEN*NEEDED*THE*MOST*"
            onHover="speedUp"
            spinDuration={18}
          />
        </div>

        {/* Centre content */}
        <div style={styles.content}>
          <div ref={containerRef} style={styles.headingWrapper}>
            <VariableProximity
              label="SmartSubmit"
              fromFontVariationSettings="'wght' 300, 'opsz' 9"
              toFontVariationSettings="'wght' 1000, 'opsz' 40"
              containerRef={containerRef}
              radius={180}
              falloff="linear"
              style={styles.heading}
            />
          </div>

          <div style={styles.subWrapper}>
            <TextType
              text={[
                "Never miss a deadline.",
                "Never fall behind on your coursework again.",
                "We track. We remind. You submit.",
              ]}
              typingSpeed={60}
              deletingSpeed={35}
              pauseDuration={1800}
              showCursor
              cursorCharacter="_"
              loop
              style={styles.sub}
            />
          </div>

          <NoiseBackground
            containerClassName="mt-3"
            gradientColors={[
              "rgb(255, 255, 255)",
              "rgb(180, 180, 180)",
              "rgb(0, 0, 0)",
            ]}
            speed={0.08}
            noiseIntensity={0.25}
          >
            <button
              onClick={handleLogin}
              style={styles.button}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              Login with Google &rarr;
            </button>
          </NoiseBackground>
          <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "12px", letterSpacing: "0.03em", fontWeight: 500 }}>
            🔒 Currently in beta — limited to select users only.
          </p>
        </div>

        {/* Scroll down arrow */}
        <button onClick={scrollDown} style={styles.scrollHint}>
          <span style={styles.scrollLabel}>scroll to know more</span>
          <svg
            width="28" height="28" viewBox="0 0 24 24"
            fill="none" stroke="rgba(255,255,255,0.6)"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </section>

      {/* ── SCROLL REVEAL SECTION ── */}
      <section style={styles.revealSection}>
        <div style={styles.revealInner}>
          <ScrollReveal
            baseOpacity={0.1}
            enableBlur
            baseRotation={3}
            blurStrength={4}
          >
            A smart system that connects with your Google Classroom and keeps track of all your assignments in real time. Get timely reminders on WhatsApp so you never miss a deadline again — whether it&apos;s newly posted work or an upcoming submission.
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: {
    background: "#000",
    color: "#fff",
  },
  hero: {
    position: "relative",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  topRight: {
    position: "absolute",
    top: "32px",
    right: "32px",
    zIndex: 2,
    opacity: 0.75,
  },
  content: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    textAlign: "center",
  },
  headingWrapper: {
    position: "relative",
    cursor: "default",
  },
  heading: {
    fontSize: "6rem",
    fontWeight: "300",
    color: "#ffffff",
    letterSpacing: "-0.04em",
    lineHeight: 1,
    textShadow: "0 0 60px rgba(255,255,255,0.12)",
    userSelect: "none",
  },
  subWrapper: {
    minHeight: "2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sub: {
    fontSize: "1.35rem",
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
    letterSpacing: "-0.01em",
  },
  button: {
    padding: "14px 36px",
    fontSize: "1.05rem",
    fontWeight: "600",
    cursor: "pointer",
    border: "none",
    borderRadius: "9999px",
    background: "#000000",
    color: "#ffffff",
    width: "100%",
    letterSpacing: "0.01em",
    transition: "opacity 0.15s",
  },
  scrollHint: {
    position: "absolute",
    bottom: "32px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 2,
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    animation: "bounce 2s ease-in-out infinite",
  },
  scrollLabel: {
    fontSize: "0.75rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.5)",
  },
  revealSection: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "80px 24px",
    background: "#000",
  },
  revealInner: {
    maxWidth: "820px",
    width: "100%",
    color: "#fff",
  },
};

// Inject bounce keyframe globally once
const style = document.createElement("style");
style.textContent = `@keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(8px)} }`;
document.head.appendChild(style);

export default Landing;