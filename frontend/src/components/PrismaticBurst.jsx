import { useEffect, useRef } from "react";

/**
 * PrismaticBurst – canvas-based animated ray burst background.
 * Props match the react-bits API:
 *   intensity, speed, animationType, colors, distort, hoverDampness, rayCount
 */
export default function PrismaticBurst({
    intensity = 2,
    speed = 0.5,
    animationType = "rotate3d",
    colors = ["#5227FF", "#FF9FFC", "#7cff67"],
    distort = 0,
    hoverDampness = 0,
    rayCount = 0,
}) {
    const canvasRef = useRef(null);
    const animRef = useRef(null);
    const mouseRef = useRef({ x: 0.5, y: 0.5 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        // Resolved ray count — if user passes 0 use a sensible default
        const rays = rayCount > 0 ? rayCount : 18;

        let t = 0;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        const onMouseMove = (e) => {
            if (hoverDampness === 0) return;
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: (e.clientX - rect.left) / rect.width,
                y: (e.clientY - rect.top) / rect.height,
            };
        };
        canvas.addEventListener("mousemove", onMouseMove);

        const draw = () => {
            const { width, height } = canvas;
            ctx.clearRect(0, 0, width, height);

            const cx = width * (hoverDampness > 0 ? mouseRef.current.x : 0.5);
            const cy = height * (hoverDampness > 0 ? mouseRef.current.y : 0.5);

            const angleOffset = animationType === "rotate3d"
                ? t * speed
                : Math.sin(t * speed * 0.5) * Math.PI;

            const maxRadius = Math.sqrt(cx * cx + cy * cy) +
                Math.sqrt((width - cx) ** 2 + (height - cy) ** 2);

            for (let i = 0; i < rays; i++) {
                const baseAngle = ((Math.PI * 2) / rays) * i + angleOffset;
                const halfWidth = (Math.PI / rays) * 0.95;

                // Pick colour cycling through palette
                const color = colors[i % colors.length];

                // Build wedge path
                const a1 = baseAngle - halfWidth;
                const a2 = baseAngle + halfWidth;

                // Optional distortion wobble
                const wobble = distort > 0 ? Math.sin(t * 1.3 + i) * distort * 0.15 : 0;

                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.arc(cx, cy, maxRadius * intensity, a1 + wobble, a2 + wobble);
                ctx.closePath();

                // Gradient fade from center out
                const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * intensity);
                grad.addColorStop(0, color + "cc");
                grad.addColorStop(0.6, color + "55");
                grad.addColorStop(1, color + "00");

                ctx.fillStyle = grad;
                ctx.globalCompositeOperation = "screen";
                ctx.fill();
            }

            t += 0.016;
            animRef.current = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animRef.current);
            ro.disconnect();
            canvas.removeEventListener("mousemove", onMouseMove);
        };
    }, [intensity, speed, animationType, colors, distort, hoverDampness, rayCount]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                display: "block",
            }}
        />
    );
}
