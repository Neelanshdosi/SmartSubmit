"use client";
import React, { useEffect, useRef, useState } from "react";

export const TextRevealCard = ({ text, revealText, children, className = "" }) => {
    const [widthPercentage, setWidthPercentage] = useState(0);
    const cardRef = useRef(null);
    const [left, setLeft] = useState(0);
    const [localWidth, setLocalWidth] = useState(0);
    const [isMouseOver, setIsMouseOver] = useState(false);

    useEffect(() => {
        if (cardRef.current) {
            const { left, width } = cardRef.current.getBoundingClientRect();
            setLeft(left);
            setLocalWidth(width);
        }
    }, []);

    const mouseMoveHandler = (e) => {
        const { clientX } = e;
        if (cardRef.current) {
            const relativeX = clientX - left;
            setWidthPercentage((relativeX / localWidth) * 100);
        }
    };

    const mouseLeaveHandler = () => {
        setIsMouseOver(false);
        setWidthPercentage(0);
    };

    const mouseEnterHandler = () => {
        setIsMouseOver(true);
    };

    const rotateDeg = (widthPercentage - 50) * 0.1;

    return (
        <div
            onMouseEnter={mouseEnterHandler}
            onMouseLeave={mouseLeaveHandler}
            onMouseMove={mouseMoveHandler}
            ref={cardRef}
            className={className}
            style={{
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                padding: "24px 32px",
                width: "320px",
                overflow: "hidden",
                cursor: "crosshair",
                position: "relative",
            }}
        >
            {children}

            <div style={{ position: "relative", marginTop: "12px", overflow: "hidden" }}>
                {/* Revealed text (clipped) */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: `${widthPercentage}%`,
                        overflow: "hidden",
                        transition: isMouseOver ? "none" : "width 0.4s ease",
                        transform: `perspective(1000px) rotateY(${rotateDeg}deg)`,
                    }}
                >
                    <p
                        style={{
                            color: "#4ade80",
                            fontWeight: "700",
                            fontSize: "1.25rem",
                            whiteSpace: "nowrap",
                            userSelect: "none",
                            margin: 0,
                        }}
                    >
                        {revealText}
                    </p>
                </div>

                {/* Base text */}
                <div
                    style={{
                        transform: `perspective(1000px) rotateY(${rotateDeg}deg)`,
                    }}
                >
                    <p
                        style={{
                            color: "rgba(255,255,255,0.55)",
                            fontWeight: "700",
                            fontSize: "1.25rem",
                            whiteSpace: "nowrap",
                            userSelect: "none",
                            margin: 0,
                        }}
                    >
                        {text}
                    </p>
                </div>
            </div>
        </div>
    );
};

export const TextRevealCardTitle = ({ children, className = "" }) => (
    <h3
        className={className}
        style={{
            color: "rgba(255,255,255,0.9)",
            fontWeight: "700",
            fontSize: "1rem",
            margin: "0 0 4px 0",
            letterSpacing: "-0.01em",
        }}
    >
        {children}
    </h3>
);

export const TextRevealCardDescription = ({ children, className = "" }) => (
    <p
        className={className}
        style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.8rem",
            margin: 0,
            lineHeight: "1.4",
        }}
    >
        {children}
    </p>
);
