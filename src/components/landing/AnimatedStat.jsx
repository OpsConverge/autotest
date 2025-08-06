import React, { useEffect, useRef, useState } from "react";
import { motion, useAnimation } from "framer-motion";

function AnimatedStat({ value, suffix = "", prefix = "" }) {
  const controls = useAnimation();
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const currentRef = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          // Stop observing once it's in view to mimic triggerOnce
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
      }
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []); // Empty dependency array ensures this effect runs only once

  useEffect(() => {
    if (inView) {
      controls.start({
        opacity: 1,
        transition: { duration: 0.5 },
      });
    }
  }, [controls, inView]);

  return (
    <motion.div ref={ref} initial={{ opacity: 0 }} animate={controls} className="text-center">
      <div className="flex items-center justify-center">
        {prefix && <span className="text-4xl md:text-5xl font-bold text-slate-300">{prefix}</span>}
        <motion.h3
          className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent"
          initial={{ y: 20, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {value.toLocaleString()}
        </motion.h3>
        {suffix && <span className="text-4xl md:text-5xl font-bold text-slate-300 ml-1">{suffix}</span>}
      </div>
    </motion.div>
  );
}

export default AnimatedStat;