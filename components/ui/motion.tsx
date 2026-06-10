"use client";

import { motion, type Variants, type Transition } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Újrafelhasználható Framer Motion animációs keretek.
 *
 * Használat: egyszerűen "húzd rá" bármelyik feature-re, pl.:
 *
 *   <FadeIn>
 *     <QuizList />
 *   </FadeIn>
 *
 *   <StaggerContainer>
 *     {items.map((item) => (
 *       <StaggerItem key={item.id}>
 *         <QuizCard quiz={item} />
 *       </StaggerItem>
 *     ))}
 *   </StaggerContainer>
 */

type Direction = "up" | "down" | "left" | "right" | "none";

type MotionWrapperProps = {
  children: ReactNode;
  className?: string;
  /** Késleltetés másodpercben az animáció indítása előtt. */
  delay?: number;
  /** Animáció hossza másodpercben. */
  duration?: number;
  /** Csak akkor animáljon, ha láthatóvá válik a viewportban. */
  whileInView?: boolean;
  /** A viewport animáció csak egyszer fusson le. */
  once?: boolean;
};

const defaultEase: Transition["ease"] = [0.22, 1, 0.36, 1];

function buildOffset(direction: Direction, distance: number) {
  switch (direction) {
    case "up":
      return { y: distance };
    case "down":
      return { y: -distance };
    case "left":
      return { x: distance };
    case "right":
      return { x: -distance };
    default:
      return {};
  }
}

/**
 * Közös logika a viewport- vs. azonnali animációhoz.
 */
function getAnimationProps(
  variants: Variants,
  { whileInView, once = true }: Pick<MotionWrapperProps, "whileInView" | "once">,
) {
  if (whileInView) {
    return {
      variants,
      initial: "hidden" as const,
      whileInView: "visible" as const,
      viewport: { once, amount: 0.2 },
    };
  }
  return {
    variants,
    initial: "hidden" as const,
    animate: "visible" as const,
  };
}

/* -------------------------------------------------------------------------- */
/* FadeIn — finom felúszás + halványulás                                       */
/* -------------------------------------------------------------------------- */

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 0.5,
  direction = "up",
  distance = 16,
  whileInView = false,
  once = true,
}: MotionWrapperProps & { direction?: Direction; distance?: number }) {
  const variants: Variants = {
    hidden: { opacity: 0, ...buildOffset(direction, distance) },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration, delay, ease: defaultEase },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      {...getAnimationProps(variants, { whileInView, once })}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* ScaleIn — beúszás enyhe nagyítással (kiemeléshez)                           */
/* -------------------------------------------------------------------------- */

export function ScaleIn({
  children,
  className,
  delay = 0,
  duration = 0.45,
  whileInView = false,
  once = true,
}: MotionWrapperProps) {
  const variants: Variants = {
    hidden: { opacity: 0, scale: 0.92 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration, delay, ease: defaultEase },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      {...getAnimationProps(variants, { whileInView, once })}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* BlurIn — elmosódásból élesedő megjelenés                                    */
/* -------------------------------------------------------------------------- */

export function BlurIn({
  children,
  className,
  delay = 0,
  duration = 0.6,
  whileInView = false,
  once = true,
}: MotionWrapperProps) {
  const variants: Variants = {
    hidden: { opacity: 0, filter: "blur(10px)", y: 12 },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: { duration, delay, ease: defaultEase },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      {...getAnimationProps(variants, { whileInView, once })}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* StaggerContainer + StaggerItem — listák lépcsőzetes betöltése               */
/* -------------------------------------------------------------------------- */

export function StaggerContainer({
  children,
  className,
  delay = 0,
  staggerDelay = 0.08,
  whileInView = false,
  once = true,
}: MotionWrapperProps & { staggerDelay?: number }) {
  const variants: Variants = {
    hidden: {},
    visible: {
      transition: {
        delayChildren: delay,
        staggerChildren: staggerDelay,
      },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      {...getAnimationProps(variants, { whileInView, once })}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  duration = 0.5,
  direction = "up",
  distance = 16,
}: Omit<MotionWrapperProps, "delay" | "whileInView" | "once"> & {
  direction?: Direction;
  distance?: number;
}) {
  const variants: Variants = {
    hidden: { opacity: 0, ...buildOffset(direction, distance) },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration, ease: defaultEase },
    },
  };

  return (
    <motion.div className={cn(className)} variants={variants}>
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* SlideIn — irányból becsúszó panel                                           */
/* -------------------------------------------------------------------------- */

export function SlideIn({
  children,
  className,
  delay = 0,
  duration = 0.55,
  direction = "left",
  distance = 48,
  whileInView = false,
  once = true,
}: MotionWrapperProps & { direction?: Direction; distance?: number }) {
  const variants: Variants = {
    hidden: { opacity: 0, ...buildOffset(direction, distance) },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration, delay, ease: defaultEase },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      {...getAnimationProps(variants, { whileInView, once })}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/* Pop — interaktív hover/tap "keret" gombokhoz, kártyákhoz                     */
/* -------------------------------------------------------------------------- */

export function Pop({
  children,
  className,
  scale = 1.03,
  tapScale = 0.97,
}: {
  children: ReactNode;
  className?: string;
  scale?: number;
  tapScale?: number;
}) {
  return (
    <motion.div
      className={cn(className)}
      whileHover={{ scale }}
      whileTap={{ scale: tapScale }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.div>
  );
}
