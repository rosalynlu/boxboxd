import { useLocation } from "wouter";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RaceCardProps {
  race: {
    id: number;
    name: string;
    year: number;
    imageUrl?: string;
    averageRating?: string;
    ratingCount?: number;
    tags?: string[];
  };
  compact?: boolean;
}

export default function RaceCard({ race, compact = false }: RaceCardProps) {
  const [, setLocation] = useLocation();

  const handleClick = () => {
    setLocation(`/races/${race.id}`);
  };

  const getTagClass = (tag: string) => {
    const tagLower = tag.toLowerCase().replace(/\s+/g, "-");
    const tagClassMap: { [key: string]: string } = {
      "day-race": "tag-day",
      "night-race": "tag-night",
      "street-circuit": "tag-street",
      "permanent-track": "tag-permanent",
      "dry": "tag-dry",
      "wet": "tag-wet",
      "mixed-weather": "tag-mixed",
      "sprint-weekend": "tag-sprint",
      "safety-car-heavy": "tag-safety-car",
      "historic": "tag-historic",
      "classic": "tag-classic",
      "technical": "tag-technical",
    };
    return tagClassMap[tagLower] || "tag-default";
  };

  if (compact) {
    return (
      <div
        onClick={handleClick}
        className="bg-card-dark rounded-lg overflow-hidden hover:transform hover:scale-105 transition-transform cursor-pointer"
      >
        <img
          src={race.imageUrl || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64"}
          alt={race.name}
          className="w-full h-32 object-cover"
        />
        <div className="p-3">
          <h3 className="font-medium text-sm text-white truncate">{race.name}</h3>
          <p className="text-xs text-gray-400">{race.year}</p>
          <div className="flex items-center mt-1">
            <Star className="h-3 w-3 text-yellow-400 fill-current" />
            <span className="text-xs text-gray-400 ml-1">
              {parseFloat(race.averageRating || "0").toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className="bg-card-dark rounded-lg overflow-hidden hover:transform hover:scale-[1.02] transition-transform cursor-pointer"
    >
      <img
        src={race.imageUrl || "https://images.unsplash.com/photo-1558618666-fcd25c85cd64"}
        alt={race.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg text-white mb-1">{race.name}</h3>
        <p className="text-gray-400 text-sm mb-3">{race.year}</p>
        
        {race.tags && race.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {race.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} className={`text-xs ${getTagClass(tag)}`}>
                {tag}
              </Badge>
            ))}
            {race.tags.length > 3 && (
              <Badge className="text-xs tag-default">
                +{race.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-yellow-400 fill-current" />
            <span className="text-sm text-white font-medium">
              {parseFloat(race.averageRating || "0").toFixed(1)}
            </span>
            <span className="text-xs text-gray-400">
              ({race.ratingCount || 0})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
