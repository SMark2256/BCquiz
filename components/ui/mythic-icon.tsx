"use client"

import { motion } from "framer-motion";

const MythicIcon = ({ children }: { children: React.ReactNode }) => {
    return (
        <motion.div
            animate={ {
                // A "lélegző" effektus, ami a benne lévő képre/szövegre is hat
                scale: [ 1, 1.05, 1 ],
                filter: [
                    "drop-shadow(0 0 5px rgba(186, 85, 211, 0.1)",
                    "drop-shadow(0 0 10px rgba(224, 110, 0, 0.6)",
                    "drop-shadow(0 0 15px rgba(148, 0, 211, 0.8)",
                    "drop-shadow(0 0 8px rgba(224, 110, 0, 0.8)",
                    "drop-shadow(0 0 5px rgba(186, 85, 211, 0.8)",
                    "drop-shadow(0 0 10px rgba(224, 110, 0, 0.8)",
                    "drop-shadow(0 0 8px rgba(148, 0, 211, 0.6)",
                    "drop-shadow(0 0 10px rgba(224, 110, 0, 0.1)"
                ]
            } }
            transition={ {
                duration: 4,
                repeat: Infinity,
                ease: "linear"
            } }
            style={ {
                display: "inline-block", // Hogy csak az elem méretéig tartson az animáció
                padding: "10px"
            } }
        >
            { children }
        </motion.div>
    )
};

export default MythicIcon;
