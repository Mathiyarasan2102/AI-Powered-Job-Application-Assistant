import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);


export default function Footer() {
    return (
        <motion.footer className="bg-white/5 border-t border-white/5 mt-auto pt-10 text-gray-400"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", duration: 0.5 }}
        >
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-between py-6 border-b border-white/5 gap-6">
                    {/* Brand */}
                    <div>
                        <span className="font-display font-bold text-xl tracking-wide text-white">
                            Resu<span className="text-primary">Forge</span>
                        </span>
                        <p className="max-w-[400px] mt-3 text-sm leading-relaxed">
                            Write targeted resumes and personalized emails for every role you apply to — without the grind.
                        </p>
                    </div>

                    {/* Developer Credit + Socials */}
                    <div className="flex flex-col items-center md:items-end gap-3">
                        <p className="text-sm text-gray-400">
                            Developed by{' '}
                            <span className="text-white font-semibold">Mathiyarasan P</span>
                        </p>
                        <div className="flex items-center gap-3">
                            <a
                                href="https://github.com/Mathiyarasan2102"
                                target="_blank"
                                rel="noreferrer"
                                title="GitHub"
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.1] hover:border-white/20 transition-all duration-200"
                            >
                                <GitHubIcon />
                            </a>
                            <a
                                href="https://linkedin.com/in/mathiyarasan-p"
                                target="_blank"
                                rel="noreferrer"
                                title="LinkedIn"
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 hover:border-[#0A66C2]/30 transition-all duration-200"
                            >
                                <LinkedInIcon />
                            </a>
                            <a
                                href="https://portfolio-web-site-seven-alpha.vercel.app"
                                target="_blank"
                                rel="noreferrer"
                                title="Portfolio"
                                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08] text-gray-400 hover:text-primary hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </div>

                <p className="py-6 text-center text-sm text-gray-500">
                    © {new Date().getFullYear()} ResuForge. All rights reserved.
                </p>
            </div>
        </motion.footer>
    );
}
