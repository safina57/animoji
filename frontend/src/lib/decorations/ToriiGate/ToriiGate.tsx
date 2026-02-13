export default function ToriiGate() {
  return (
    <div className="relative flex flex-col items-center justify-end z-30 scale-90 md:scale-100 lg:scale-110">
      {/* Top Bar (Kasagi & Shimaki) */}
      <div className="relative">
        <div className="w-64 h-4 bg-[var(--color-torii-red)] rounded-full transform -skew-x-6 shadow-lg relative z-20 flex items-center justify-center">
          <div className="w-60 h-2 bg-black opacity-10 absolute top-1 rounded-full"></div>
        </div>
        {/* Secondary Top Bar (Nuki) */}
        <div className="w-56 h-3 bg-[var(--color-torii-red)] rounded mx-auto mt-6 shadow-md relative z-10"></div>
      </div>

      {/* Pillars (Hashira) */}
      <div className="flex justify-between w-40 -mt-8 relative z-0">
        <div className="w-4 h-48 bg-[var(--color-torii-red)] rounded-t shadow-inner flex flex-col items-center">
          <div className="w-5 h-2 bg-black opacity-10 mt-8"></div>
          <div className="w-full h-full bg-gradient-to-r from-transparent via-red-700 to-transparent opacity-5"></div>
        </div>
        <div className="w-4 h-48 bg-[var(--color-torii-red)] rounded-t shadow-inner flex flex-col items-center">
          <div className="w-5 h-2 bg-black opacity-10 mt-8"></div>
          <div className="w-full h-full bg-gradient-to-r from-transparent via-red-700 to-transparent opacity-5"></div>
        </div>
      </div>

      {/* Gate Base Stones */}
      <div className="flex justify-between w-44 -mt-1 relative z-10">
        <div className="w-6 h-3 bg-[var(--color-stone-gray)] rounded-sm shadow"></div>
        <div className="w-6 h-3 bg-[var(--color-stone-gray)] rounded-sm shadow"></div>
      </div>
    </div>
  );
}
