export default function StonePath() {
  return (
    <div className="flex flex-col items-center relative z-30 transform">
      {/* Path stones getting larger towards bottom with gradients */}
      <div className="w-16 h-4 bg-gradient-to-br from-gray-200 to-[#A0ABA8] rounded-full mb-1 opacity-90 shadow-sm border-b-2 border-gray-400"></div>
      <div className="w-20 h-6 bg-gradient-to-br from-gray-100 to-gray-400 rounded-full mb-2 opacity-95 shadow-md flex items-center justify-center border-b-2 border-gray-500">
        <div className="w-10 h-3 bg-gray-500 rounded-full opacity-10 blur-[1px]"></div>
      </div>
      <div className="w-24 h-8 bg-gradient-to-b from-gray-200 via-gray-300 to-gray-500 rounded-full mb-2 shadow-lg relative overflow-hidden border-b-4 border-gray-600/30">
        <div className="absolute top-0 right-2 w-10 h-6 bg-white opacity-20 rounded-full blur-[2px]"></div>
      </div>
      <div className="w-32 h-10 bg-gradient-to-br from-[#E0E0E0] via-[#BDBDBD] to-[#757575] rounded-full shadow-xl flex items-center justify-center relative border-b-4 border-gray-700/20">
        <div className="absolute bottom-2 left-6 w-8 h-4 bg-green-700 opacity-20 rounded-full blur-[2px]"></div>
        <div className="absolute top-1 right-6 w-12 h-4 bg-white opacity-10 rounded-full blur-[1px]"></div>
      </div>
    </div>
  )
}
