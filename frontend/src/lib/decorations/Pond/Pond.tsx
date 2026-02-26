import FloatingPetal from "../FloatingPetal/FloatingPetal"

export default function Pond() {
  return (
    <div className="relative w-full h-32 overflow-visible flex justify-center items-end">
      {/* Deep Water Layer (Back) - extends to bottom */}
      <div className="absolute bottom-0 w-[95%] h-40 bg-[#8AB6C7] rounded-[100%_100%_0_0] opacity-90 blur-sm transform scale-y-50 translate-y-12 shadow-inner"></div>

      {/* Mid Water Layer */}
      <div className="absolute bottom-0 w-[85%] h-36 bg-[var(--color-water-blue)] rounded-[100%_100%_0_0] opacity-80 blur-[2px] transform scale-y-50 translate-y-10"></div>

      {/* Top Water Layer (Highlights) */}
      <div className="absolute bottom-0 w-[75%] h-32 bg-[#D5EFF5] rounded-[100%_100%_0_0] opacity-40 blur-md transform scale-y-50 translate-y-8 animate-pulse"></div>

      {/* Ripples */}
      <div
        className="absolute bottom-6 left-1/4 w-20 h-10 border-2 border-white rounded-full opacity-30 animate-ripple"
        style={{ animationDelay: "0s" }}
      ></div>
      <div
        className="absolute bottom-8 right-1/3 w-16 h-8 border-2 border-white rounded-full opacity-30 animate-ripple"
        style={{ animationDelay: "1.5s" }}
      ></div>

      {/* Floating Petals - visible on md+ screens */}
      <FloatingPetal
        style={{ bottom: "1.5rem", left: "20%", transform: "rotate(15deg)" }}
        delay="0s"
      />
      <FloatingPetal
        style={{ bottom: "2rem", right: "30%", transform: "rotate(-45deg)" }}
        delay="1s"
      />
      <FloatingPetal
        style={{ bottom: "1rem", left: "45%", transform: "rotate(90deg)" }}
        delay="2s"
      />
      <div className="hidden md:block">
        <FloatingPetal
          style={{ bottom: "1.8rem", right: "15%", transform: "rotate(30deg)" }}
          delay="3.5s"
        />
        <FloatingPetal
          style={{ bottom: "0.8rem", left: "35%", transform: "rotate(-10deg)" }}
          delay="4s"
        />
      </div>

      {/* Koi Fish 1 - visible on md+ screens */}
      <div className="hidden md:block absolute bottom-6 left-1/3 animate-float opacity-70 z-10">
        <div className="w-6 h-3 bg-gradient-to-r from-orange-600 to-orange-400 rounded-full relative transform rotate-12 shadow-sm">
          <div className="absolute -right-1 top-1 w-2 h-2 bg-white rounded-full opacity-50"></div>
          <div className="absolute -left-1 top-0.5 w-2 h-2 bg-orange-400 rounded-full opacity-80 blur-[1px]"></div>
        </div>
      </div>

      {/* Koi Fish 2 - visible on md+ screens */}
      <div
        className="hidden md:block absolute bottom-4 right-1/4 animate-float opacity-70 z-10"
        style={{ animationDelay: "2s" }}
      >
        <div className="w-5 h-2 bg-gradient-to-r from-red-500 to-red-300 rounded-full relative transform -rotate-12 shadow-sm">
          <div className="absolute -left-1 top-0.5 w-1.5 h-1.5 bg-white rounded-full opacity-50"></div>
          <div className="absolute -right-0.5 top-0.5 w-1.5 h-1.5 bg-red-300 rounded-full opacity-80 blur-[1px]"></div>
        </div>
      </div>

      {/* Lily Pads - visible on md+ screens */}
      <div
        className="hidden md:block absolute bottom-7 left-1/4 w-6 h-4 bg-[var(--color-moss-green)] rounded-full opacity-90 shadow-sm animate-float border-b-2 border-green-800"
        style={{ animationDelay: "3s" }}
      >
        <div className="absolute top-1 right-2 w-2 h-2 bg-pink-200 rounded-full"></div>
      </div>
      <div
        className="hidden md:block absolute bottom-3 right-[15%] w-7 h-5 bg-[var(--color-moss-green)] rounded-full opacity-90 shadow-sm animate-float border-b-2 border-green-800"
        style={{ animationDelay: "2.5s" }}
      ></div>
    </div>
  )
}
