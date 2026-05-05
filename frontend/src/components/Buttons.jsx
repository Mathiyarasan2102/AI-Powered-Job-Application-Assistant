export const PrimaryButton = ({ children, className, ...props }) => (
    <button className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-medium bg-gradient-to-br from-indigo-500 to-indigo-600 hover:opacity-90 active:scale-95 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] text-white ${className}`} {...props} >
        {children}
    </button>
);

export const GhostButton = ({ children, className, ...props }) => (
    <button className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium border border-white/10 bg-white/5 hover:bg-white/10 backdrop-blur-sm active:scale-95 transition text-white ${className}`} {...props} >
        {children}
    </button>
);
