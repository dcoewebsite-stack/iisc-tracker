const SkeletonCard = () => {
    return (
      <div className="bg-white rounded-2xl p-4 border border-warmgray animate-pulse">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="h-4 bg-warmgray rounded-full flex-1 max-w-[60%]" />
          <div className="h-6 w-20 bg-warmgray rounded-full" />
        </div>
        <div className="h-3 bg-warmgray rounded-full w-[40%] mb-3" />
        <div className="h-3 bg-warmgray rounded-full w-[50%] mt-3 pt-3 border-t border-warmgray" />
      </div>
    );
  };
  
  export default SkeletonCard;