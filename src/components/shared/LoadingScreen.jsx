import React from 'react';

function LoadingScreen({ text = "در حال بارگذاری..." }) {
  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-100 font-vazir">
      <div className="flex items-center text-lg text-gray-500">
        <span className="animate-spin inline-block w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full ml-3"></span>
        {text}
      </div>
    </div>
  );
}

export default LoadingScreen;
