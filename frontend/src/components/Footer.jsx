import { motion } from 'framer-motion';

export default function Footer() {
    return (
        <motion.footer className="bg-white/5 border-t border-white/5 mt-auto pt-10 text-gray-400"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", duration: 0.5 }}
        >
            <div className="max-w-6xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-between py-6 border-b border-white/5">
                    <div className="mb-4 md:mb-0">
                        <span className="font-display font-bold text-xl tracking-wide text-white">
                            Resu<span className="text-primary">Forge</span>
                        </span>
                        <p className="max-w-[400px] mt-4 text-sm leading-relaxed">
                            Write targeted resumes and personalized emails for every role you apply to — without the grind.
                        </p>
                    </div>


                </div>
                <p className="py-6 text-center text-sm text-gray-500">
                    © {new Date().getFullYear()} ResuForge. All rights reserved.
                </p>
            </div>
        </motion.footer>
    );
}
