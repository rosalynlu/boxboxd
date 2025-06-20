import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function StarRating({ value, onChange, readonly = false, size = "md" }: StarRatingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const rating = index + 1;
        const isFilled = rating <= value;
        
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(rating)}
            disabled={readonly}
            className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform`}
          >
            <Star
              className={`${sizeClasses[size]} ${
                isFilled
                  ? "text-yellow-400 fill-current"
                  : readonly
                  ? "text-gray-400"
                  : "text-gray-400 hover:text-yellow-400"
              } transition-colors`}
            />
          </button>
        );
      })}
    </div>
  );
}
