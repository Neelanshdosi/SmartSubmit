import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'motion/react';
import './CircularText.css';

const CircularText = ({
    text,
    spinDuration = 20,
    onHover = 'speedUp',
    className = '',
}) => {
    const letters = Array.from(text);
    const controls = useAnimation();
    const rotationRef = useRef(0);
    const currentDurationRef = useRef(spinDuration);
    const [isHovered, setIsHovered] = useState(false);
    const requestRef = useRef(null);
    const previousTimeRef = useRef(null);

    const getEffectiveDuration = () =>
        isHovered && onHover === 'speedUp' ? spinDuration / 4 : spinDuration;

    useEffect(() => {
        const animate = (time) => {
            if (previousTimeRef.current !== null) {
                const delta = time - previousTimeRef.current;
                const degreesPerMs = 360 / (currentDurationRef.current * 1000);
                rotationRef.current = (rotationRef.current + degreesPerMs * delta) % 360;
                controls.set({ rotate: rotationRef.current });
            }
            previousTimeRef.current = time;
            requestRef.current = requestAnimationFrame(animate);
        };
        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [controls]);

    useEffect(() => {
        currentDurationRef.current = getEffectiveDuration();
    }, [isHovered, spinDuration, onHover]);

    return (
        <motion.div
            className={`circular-text ${className}`}
            animate={controls}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {letters.map((letter, i) => {
                const rotation = (360 / letters.length) * i;
                return (
                    <span
                        key={i}
                        style={{
                            transform: `rotate(${rotation}deg)`,
                        }}
                    >
                        {letter}
                    </span>
                );
            })}
        </motion.div>
    );
};

export default CircularText;
