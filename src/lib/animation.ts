// Shared animation variants for all screens
export const screenVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const, staggerChildren: 0.06, delayChildren: 0.1 } },
  exit: { opacity: 0, x: 40, transition: { duration: 0.3 } },
};

export const screenVariantsLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const, staggerChildren: 0.08, delayChildren: 0.1 } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.3 } },
};

export const homeContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  exit: { opacity: 0, x: -40, transition: { duration: 0.3 } },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as const } },
};
