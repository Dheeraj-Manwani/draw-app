import Lottie from "lottie-react";
// import animationData from "../public/draw-it-brand-animation.json";
import animationData from "../public/loading-animation.json";

interface LottieLoaderProps {
  size?: number;
  className?: string;
}

export default function LottieLoader({
  size = 64,
  className = "",
}: LottieLoaderProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: size, height: size }}
      />
    </div>
  );
}
