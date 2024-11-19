import React from "react";

const Loader = () => {
  return (
    <div className="flex flex-row w-[90px] h-[120px]">
      <div className="w-4 h-20 mx-auto rounded bg-[#014073] animate-[squareAnim1_1.2s_cubic-bezier(0.445,0.05,0.55,0.95)_0ms_infinite]" />
      <div className="w-4 h-20 mx-auto rounded bg-[#014073] animate-[squareAnim2_1.2s_cubic-bezier(0.445,0.05,0.55,0.95)_200ms_infinite]" />
      <div className="w-4 h-20 mx-auto rounded bg-[#014073] animate-[squareAnim3_1.2s_cubic-bezier(0.445,0.05,0.55,0.95)_400ms_infinite]" />

      <style jsx>{`
        @keyframes squareAnim1 {
          0%,
          100% {
            height: 80px;
            background-color: #014073;
          }
          20% {
            height: 80px;
          }
          40% {
            height: 120px;
            background-color: #015693;
          }
          80% {
            height: 80px;
          }
        }
        @keyframes squareAnim2 {
          0%,
          100% {
            height: 80px;
            background-color: #014073;
          }
          20% {
            height: 80px;
          }
          40% {
            height: 120px;
            background-color: #015693;
          }
          80% {
            height: 80px;
          }
        }
        @keyframes squareAnim3 {
          0%,
          100% {
            height: 80px;
            background-color: #014073;
          }
          20% {
            height: 80px;
          }
          40% {
            height: 120px;
            background-color: #015693;
          }
          80% {
            height: 80px;
          }
        }
      `}</style>
    </div>
  );
};

export default Loader;
