import { useRef, useEffect, useCallback, useState } from 'react';
import { gsap } from 'gsap';
import './MagicBento.css';

const GLOW_COLOR = '255, 255, 255'; // black/white theme
const DEFAULT_PARTICLE_COUNT = 12;
const DEFAULT_SPOTLIGHT_RADIUS = 400;

const createParticleElement = (x, y) => {
    const el = document.createElement('div');
    el.className = 'particle';
    el.style.cssText = `
    position: absolute;
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: rgba(${GLOW_COLOR}, 0.9);
    box-shadow: 0 0 6px rgba(${GLOW_COLOR}, 0.5);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `;
    return el;
};

const calculateSpotlightValues = radius => ({
    proximity: radius * 0.5,
    fadeDistance: radius * 0.75,
});

const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
    const rect = card.getBoundingClientRect();
    const relativeX = ((mouseX - rect.left) / rect.width) * 100;
    const relativeY = ((mouseY - rect.top) / rect.height) * 100;
    card.style.setProperty('--glow-x', `${relativeX}%`);
    card.style.setProperty('--glow-y', `${relativeY}%`);
    card.style.setProperty('--glow-intensity', glow.toString());
    card.style.setProperty('--glow-radius', `${radius}px`);
};

// ── ParticleCard ──────────────────────────────────────────────────────
export const ParticleCard = ({
    children,
    className = '',
    style,
    particleCount = DEFAULT_PARTICLE_COUNT,
    clickEffect = true,
    disableAnimations = false,
}) => {
    const cardRef = useRef(null);
    const particlesRef = useRef([]);
    const timeoutsRef = useRef([]);
    const isHoveredRef = useRef(false);
    const memoizedParticles = useRef([]);
    const particlesInitialized = useRef(false);

    const initParticles = useCallback(() => {
        if (particlesInitialized.current || !cardRef.current) return;
        const { width, height } = cardRef.current.getBoundingClientRect();
        memoizedParticles.current = Array.from({ length: particleCount }, () =>
            createParticleElement(Math.random() * width, Math.random() * height)
        );
        particlesInitialized.current = true;
    }, [particleCount]);

    const clearParticles = useCallback(() => {
        timeoutsRef.current.forEach(clearTimeout);
        timeoutsRef.current = [];
        particlesRef.current.forEach(p => {
            gsap.to(p, { scale: 0, opacity: 0, duration: 0.3, ease: 'back.in(1.7)', onComplete: () => p.parentNode?.removeChild(p) });
        });
        particlesRef.current = [];
    }, []);

    const animateParticles = useCallback(() => {
        if (!cardRef.current || !isHoveredRef.current) return;
        if (!particlesInitialized.current) initParticles();
        memoizedParticles.current.forEach((particle, i) => {
            const id = setTimeout(() => {
                if (!isHoveredRef.current || !cardRef.current) return;
                const clone = particle.cloneNode(true);
                cardRef.current.appendChild(clone);
                particlesRef.current.push(clone);
                gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });
                gsap.to(clone, { x: (Math.random() - 0.5) * 80, y: (Math.random() - 0.5) * 80, rotation: Math.random() * 360, duration: 2 + Math.random() * 2, ease: 'none', repeat: -1, yoyo: true });
                gsap.to(clone, { opacity: 0.25, duration: 1.5, ease: 'power2.inOut', repeat: -1, yoyo: true });
            }, i * 80);
            timeoutsRef.current.push(id);
        });
    }, [initParticles]);

    useEffect(() => {
        if (disableAnimations || !cardRef.current) return;
        const el = cardRef.current;

        const onEnter = () => { isHoveredRef.current = true; animateParticles(); };
        const onLeave = () => { isHoveredRef.current = false; clearParticles(); };

        const onClick = e => {
            if (!clickEffect) return;
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left, y = e.clientY - rect.top;
            const maxD = Math.max(Math.hypot(x, y), Math.hypot(x - rect.width, y), Math.hypot(x, y - rect.height), Math.hypot(x - rect.width, y - rect.height));
            const ripple = document.createElement('div');
            ripple.style.cssText = `position:absolute;width:${maxD * 2}px;height:${maxD * 2}px;border-radius:50%;background:radial-gradient(circle,rgba(${GLOW_COLOR},0.3) 0%,rgba(${GLOW_COLOR},0.1) 40%,transparent 70%);left:${x - maxD}px;top:${y - maxD}px;pointer-events:none;z-index:1000;`;
            el.appendChild(ripple);
            gsap.fromTo(ripple, { scale: 0, opacity: 1 }, { scale: 1, opacity: 0, duration: 0.7, ease: 'power2.out', onComplete: () => ripple.remove() });
        };

        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
        el.addEventListener('click', onClick);
        return () => {
            isHoveredRef.current = false;
            el.removeEventListener('mouseenter', onEnter);
            el.removeEventListener('mouseleave', onLeave);
            el.removeEventListener('click', onClick);
            clearParticles();
        };
    }, [animateParticles, clearParticles, disableAnimations, clickEffect]);

    return (
        <div
            ref={cardRef}
            className={`particle-container magic-bento-card--border-glow ${className}`}
            style={{
                position: 'relative', overflow: 'hidden',
                '--glow-x': '50%', '--glow-y': '50%', '--glow-intensity': '0', '--glow-radius': '200px',
                ...style,
            }}
        >
            {children}
        </div>
    );
};

// ── GlobalSpotlight ───────────────────────────────────────────────────
export const GlobalSpotlight = ({
    gridRef,
    spotlightRadius = DEFAULT_SPOTLIGHT_RADIUS,
    disableAnimations = false,
}) => {
    useEffect(() => {
        if (disableAnimations || !gridRef?.current) return;

        const spotlight = document.createElement('div');
        spotlight.className = 'mb-global-spotlight';
        spotlight.style.cssText = `
      position: fixed;
      width: 700px; height: 700px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${GLOW_COLOR}, 0.12) 0%,
        rgba(${GLOW_COLOR}, 0.05) 20%,
        rgba(${GLOW_COLOR}, 0.02) 40%,
        transparent 65%
      );
      z-index: 9999;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `;
        document.body.appendChild(spotlight);

        const { proximity, fadeDistance } = calculateSpotlightValues(spotlightRadius);

        const onMove = e => {
            const section = gridRef.current?.closest('.mb-bento-section');
            const rect = section?.getBoundingClientRect();
            const inside = rect && e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
            const cards = gridRef.current?.querySelectorAll('.mb-metric-card') || [];

            if (!inside) {
                gsap.to(spotlight, { opacity: 0, duration: 0.3 });
                cards.forEach(c => c.style.setProperty('--glow-intensity', '0'));
                return;
            }

            let minDist = Infinity;
            cards.forEach(card => {
                const r = card.getBoundingClientRect();
                const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
                const dist = Math.max(0, Math.hypot(e.clientX - cx, e.clientY - cy) - Math.max(r.width, r.height) / 2);
                minDist = Math.min(minDist, dist);
                const intensity = dist <= proximity ? 1 : dist <= fadeDistance ? (fadeDistance - dist) / (fadeDistance - proximity) : 0;
                updateCardGlowProperties(card, e.clientX, e.clientY, intensity, spotlightRadius);
            });

            gsap.to(spotlight, { left: e.clientX, top: e.clientY, duration: 0.1, ease: 'power2.out' });
            const targetOpacity = minDist <= proximity ? 0.7 : minDist <= fadeDistance ? ((fadeDistance - minDist) / (fadeDistance - proximity)) * 0.7 : 0;
            gsap.to(spotlight, { opacity: targetOpacity, duration: targetOpacity > 0 ? 0.15 : 0.4, ease: 'power2.out' });
        };

        const onLeave = () => {
            gridRef.current?.querySelectorAll('.mb-metric-card').forEach(c => c.style.setProperty('--glow-intensity', '0'));
            gsap.to(spotlight, { opacity: 0, duration: 0.3 });
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseleave', onLeave);
        return () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseleave', onLeave);
            spotlight.parentNode?.removeChild(spotlight);
        };
    }, [gridRef, spotlightRadius, disableAnimations]);

    return null;
};
