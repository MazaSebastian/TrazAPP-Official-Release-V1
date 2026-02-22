import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ClickSparkProps {
    sparkColor?: string;
    sparkSize?: number;
    sparkRadius?: number;
    sparkCount?: number;
    duration?: number;
    easing?: string;
    extraScale?: number;
}

interface Spark {
    id: number;
    x: number;
    y: number;
}

const ClickSpark: React.FC<ClickSparkProps> = ({
    sparkColor = '#03fc41',
    sparkSize = 5,
    sparkRadius = 20,
    sparkCount = 8,
    duration = 500,
    easing = 'ease-in-out',
    extraScale = 0.9,
}) => {
    const [sparks, setSparks] = useState<Spark[]>([]);

    const handleGlobalClick = useCallback((e: MouseEvent) => {
        const id = Date.now() + Math.random();
        setSparks((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);

        // Remove the spark after its duration finishes to prevent DOM buildup
        setTimeout(() => {
            setSparks((prev) => prev.filter((s) => s.id !== id));
        }, duration);
    }, [duration]);

    useEffect(() => {
        // Attach globally to listen to all clicks across the app
        document.addEventListener('mousedown', handleGlobalClick);
        return () => {
            document.removeEventListener('mousedown', handleGlobalClick);
        };
    }, [handleGlobalClick]);

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 99999 }}>
            <AnimatePresence>
                {sparks.map((spark) => (
                    <div
                        key={spark.id}
                        style={{
                            position: 'absolute',
                            left: spark.x,
                            top: spark.y,
                        }}
                    >
                        {Array.from({ length: sparkCount }).map((_, i) => {
                            const angle = (i * 360) / sparkCount;
                            const rad = (angle * Math.PI) / 180;
                            // Calculate final destination based on radius and extra scale
                            const tx = Math.cos(rad) * (sparkRadius * extraScale);
                            const ty = Math.sin(rad) * (sparkRadius * extraScale);

                            return (
                                <motion.div
                                    key={i}
                                    initial={{
                                        x: 0,
                                        y: 0,
                                        scale: 1,
                                        opacity: 1,
                                    }}
                                    animate={{
                                        x: tx,
                                        y: ty,
                                        scale: 0,
                                        opacity: 0,
                                    }}
                                    transition={{
                                        duration: duration / 1000,
                                        ease: easing as any, // framer-motion accepts named strings like "easeIn" or bezier curves. We cast for basic strings.
                                    }}
                                    style={{
                                        position: 'absolute',
                                        width: sparkSize,
                                        height: sparkSize,
                                        backgroundColor: sparkColor,
                                        borderRadius: '50%',
                                        transformOrigin: 'center center',
                                    }}
                                />
                            );
                        })}
                    </div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default ClickSpark;
