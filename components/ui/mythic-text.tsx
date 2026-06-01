"use client"

import { motion } from "framer-motion";

const MythicText = ({ children }: { children: React.ReactNode }) => {
    return (
        <motion.h1
            animate={{
                textShadow: [
                    "0 0 5px rgba(255, 215, 0, 0.7), 0 0 10px rgba(255, 215, 0, 0.5)",
                    "0 0 10px rgba(255, 255, 150, 0.8), 0 0 20px rgba(255, 215, 0, 0.7)",
                    "0 0 5px rgba(255, 215, 0, 0.7), 0 0 10px rgba(255, 215, 0, 0.5)"
                ],
                scale: [1, 1, 1] // Enyhe méretváltozás
            }}
            transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
            }}
            style={{
                color: "#f8e71c", // Élénk aranysárga
                fontSize: "1rem",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "2px"
            }}
        >
            {children}
        </motion.h1>
    );
};

export default MythicText;
