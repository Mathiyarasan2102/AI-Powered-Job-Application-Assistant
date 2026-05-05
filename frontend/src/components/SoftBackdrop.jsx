export default function SoftBackdrop() {
    return (
        <div className="fixed inset-0 -z-10 pointer-events-none">
            <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[980px] h-[460px] bg-indigo-800/20 rounded-full blur-[120px]" />
            <div className="absolute right-12 bottom-10 w-[420px] h-[220px] bg-fuchsia-700/20 rounded-full blur-[100px]" />
        </div>
    )
}
