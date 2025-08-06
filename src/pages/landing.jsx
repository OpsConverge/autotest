import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  LogIn, 
  TestTube, 
  GitBranch, 
  TrendingUp, 
  Sparkles,
  BarChart,
  ShieldCheck,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";
import AnimatedStat from "../components/landing/AnimatedStat";
import { useNavigate } from "react-router-dom";

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="p-8 rounded-2xl bg-gray-800/50 border border-gray-700/80 hover:border-blue-500/50 hover:bg-gray-800 transition-all duration-300 h-full">
    <div className="flex items-center justify-center w-12 h-12 mb-6 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-xl">
      <Icon className="w-6 h-6 text-white" />
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-slate-400">{description}</p>
  </div>
);

const featureVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function LandingPage() {
  const navigate = useNavigate();
  // Use static stats for now
  const stats = {
    totalTests: 12570,
    successRate: 98,
    totalBuilds: 431
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      let teams = JSON.parse(localStorage.getItem('teams') || '[]');
      let teamId = teams.length > 0 ? teams[0].id : localStorage.getItem('activeTeamId');
      if (teamId) {
        navigate(`/teams/${teamId}/dashboard`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [navigate]);

  const handleLogin = () => {
    navigate('/Login');
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <div className="relative isolate overflow-hidden">
        {/* Background Grid */}
        <svg
          className="absolute inset-0 -z-10 h-full w-full stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="983e3e4c-de6d-4c3f-8d64-b9761d1534cc"
              width={200}
              height={200}
              x="50%"
              y={-1}
              patternUnits="userSpaceOnUse"
            >
              <path d="M.5 200V.5H200" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" strokeWidth={0} fill="url(#983e3e4c-de6d-4c3f-8d64-b9761d1534cc)" />
        </svg>

        {/* Header */}
        <header className="absolute inset-x-0 top-0 z-50">
          <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
            <div className="flex lg:flex-1">
              <a href="#" className="-m-1.5 p-1.5 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <TestTube className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-bold text-white tracking-tight">OpsConverge</span>
              </a>
            </div>
            <div className="flex lg:flex-1 lg:justify-end">
              <Button onClick={handleLogin} variant="outline" className="bg-transparent text-white border-slate-500 hover:bg-gray-800 hover:text-white">
                <LogIn className="w-4 h-4 mr-2" />
                Login / Sign Up
              </Button>
            </div>
          </nav>
        </header>

        {/* Hero Section */}
        <main className="relative px-6 pt-14 lg:px-8">
          <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56 text-center">
            <motion.h1 
              className="text-4xl font-bold tracking-tight text-white sm:text-6xl leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              AI-Powered Observability for Modern CI/CD Pipelines
            </motion.h1>
            <motion.p 
              className="mt-6 text-lg leading-8 text-slate-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              OpsConverge intelligently analyzes your test results and build data, providing actionable insights to ship faster and with more confidence.
            </motion.p>
            <motion.div 
              className="mt-10 flex items-center justify-center gap-x-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <Button onClick={handleLogin} size="lg" className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white shadow-lg">
                Get Started for Free
              </Button>
            </motion.div>
          </div>
        </main>
      </div>
      
      {/* Stats Section */}
      <section className="py-24 bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center">
              <AnimatedStat value={stats.totalBuilds} />
              <p className="mt-2 text-lg text-slate-400">Builds Deployed</p>
            </div>
            <div className="flex flex-col items-center">
              <AnimatedStat value={stats.totalTests} />
              <p className="mt-2 text-lg text-slate-400">Tests Analyzed</p>
            </div>
            <div className="flex flex-col items-center">
              <AnimatedStat value={stats.successRate} suffix="%" />
              <p className="mt-2 text-lg text-slate-400">Success Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Everything you need to ship with confidence</h2>
            <p className="mt-4 text-lg text-slate-400">From AI-driven analysis to deep analytics and seamless integrations.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div variants={featureVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
              <FeatureCard
                icon={Sparkles}
                title="AI-Powered Analysis"
                description="Automatically detect flaky tests, pinpoint root causes of failures, and get smart recommendations for fixes."
              />
            </motion.div>
            <motion.div variants={featureVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} transition={{ delay: 0.1 }}>
              <FeatureCard
                icon={BarChart}
                title="Advanced Analytics"
                description="Dive deep into test trends, coverage reports, and performance metrics with our intuitive analytics dashboard."
              />
            </motion.div>
            <motion.div variants={featureVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} transition={{ delay: 0.2 }}>
              <FeatureCard
                icon={Zap}
                title="Seamless Integrations"
                description="Connect with your existing tools. First-class support for GitHub, CI/CD pipelines (Jenkins, CircleCI), Slack, and Jira."
              />
            </motion.div>
             <motion.div variants={featureVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
              <FeatureCard
                icon={GitBranch}
                title="Build & Release Tracking"
                description="Visualize your entire build history, compare performance between releases, and understand the impact of every change."
              />
            </motion.div>
            <motion.div variants={featureVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} transition={{ delay: 0.1 }}>
              <FeatureCard
                icon={TrendingUp}
                title="Flakiness Detection"
                description="Our algorithms identify intermittently failing tests that destabilize your builds, helping you improve reliability."
              />
            </motion.div>
            <motion.div variants={featureVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} transition={{ delay: 0.2 }}>
              <FeatureCard
                icon={ShieldCheck}
                title="Test Health Monitoring"
                description="Get a real-time, comprehensive overview of your test automation health, from success rates to flaky test counts."
              />
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 border-t border-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <p className="text-slate-400">&copy; {new Date().getFullYear()} OpsConverge. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}