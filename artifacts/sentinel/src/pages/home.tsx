import { Link } from "wouter";
import { motion } from "framer-motion";
import { TerminalSquare, ChevronRight, Activity, ShieldAlert, Zap, Lock } from "lucide-react";
import heroImg from "@/assets/hero-visualization.png";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex flex-col">
      <header className="h-20 border-b border-border flex items-center justify-between px-8 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center">
          <TerminalSquare className="w-8 h-8 text-primary mr-3" />
          <span className="text-xl font-bold tracking-widest text-primary">YOUTUBE_SENTINEL</span>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" className="font-mono uppercase tracking-wider border-primary/50 hover:bg-primary hover:text-primary-foreground">
            Launch System
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative h-[80vh] flex items-center px-8 border-b border-border overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src={heroImg} 
              alt="System Architecture" 
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          </div>

          <div className="relative z-10 max-w-3xl space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center px-3 py-1 border border-primary/30 rounded-full text-xs text-primary mb-6 bg-primary/5">
                <Activity className="w-3 h-3 mr-2 animate-pulse" />
                V 2.4.0 ONLINE
              </div>
              <h1 className="text-6xl font-bold tracking-tight text-white leading-tight uppercase">
                Polyglot <br />
                <span className="text-primary">Pre-Moderation</span><br />
                Engine
              </h1>
            </motion.div>

            <motion.p 
              className="text-lg text-muted-foreground max-w-xl leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Real-time analysis pipeline for trust & safety ops. 
              Frame extraction, audio fingerprinting, and contextual synthesis 
              in milliseconds. Don't react. Anticipate.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link href="/dashboard">
                <Button size="lg" className="h-14 px-8 text-lg font-mono uppercase tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(var(--primary),0.4)] transition-all">
                  Initialize NOC <ChevronRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-8 bg-card border-b border-border">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                icon: Zap,
                title: "10-Stage Pipeline",
                desc: "From raw video frames to deep metadata analysis, processed concurrently for minimal latency."
              },
              {
                icon: ShieldAlert,
                title: "Contextual Synthesis",
                desc: "Beyond keyword matching. We analyze the intersection of audio, visuals, and metadata."
              },
              {
                icon: Lock,
                title: "Surgical Action",
                desc: "Auto-fix minor policy violations or escalate critical issues to the human review queue."
              }
            ].map((f, i) => (
              <motion.div 
                key={i}
                className="p-8 border border-border bg-background rounded-lg hover:border-primary/50 transition-colors group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <f.icon className="w-12 h-12 text-primary mb-6 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold uppercase tracking-wider mb-3 text-foreground">{f.title}</h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
