const LoadingDots = ({ size = "md" }) => {
  const sizes = {
    sm: "w-1 h-1",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  };

  const dotSize = sizes[size] || sizes.md;

  return (
    <div className="flex space-x-1">
      <div
        className={`${dotSize} bg-gray-400 rounded-full animate-bounce`}
        style={{ animationDelay: "0ms" }}></div>
      <div
        className={`${dotSize} bg-gray-400 rounded-full animate-bounce`}
        style={{ animationDelay: "150ms" }}></div>
      <div
        className={`${dotSize} bg-gray-400 rounded-full animate-bounce`}
        style={{ animationDelay: "300ms" }}></div>
    </div>
  );
};

export default LoadingDots;
