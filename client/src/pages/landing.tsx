import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Flag, Star, Users, List } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-deep-dark text-text-light">
      {/* Header */}
      <header className="bg-card-dark border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Flag className="text-racing-red text-2xl" />
              <h1 className="text-2xl font-bold text-racing-red">boxboxd</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleLogin}
                className="text-gray-300 hover:text-white"
              >
                Sign In
              </Button>
              <Button
                onClick={handleLogin}
                className="bg-racing-red hover:bg-red-700 text-white"
              >
                Join Now
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-deep-dark via-card-dark to-deep-dark">
        <div className="absolute inset-0 opacity-10">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64"
            alt="F1 race track"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Track Every
            <span className="text-racing-red block">F1 Race</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Rate, review, and discover Formula 1 races. Keep track of every session, 
            build your watchlist, and connect with fellow F1 fans.
          </p>
          <Button
            onClick={handleLogin}
            size="lg"
            className="bg-racing-red hover:bg-red-700 text-white text-lg px-8 py-4"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-card-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-transparent border-gray-700">
              <CardContent className="pt-6 text-center">
                <Star className="text-racing-red text-4xl mb-4 mx-auto" />
                <h3 className="text-xl font-semibold mb-2 text-white">Rate & Review</h3>
                <p className="text-gray-300">
                  Share your thoughts on every F1 session from practice to podium
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-transparent border-gray-700">
              <CardContent className="pt-6 text-center">
                <Users className="text-racing-red text-4xl mb-4 mx-auto" />
                <h3 className="text-xl font-semibold mb-2 text-white">Connect</h3>
                <p className="text-gray-300">
                  Follow friends and discover what races fellow fans are watching
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-transparent border-gray-700">
              <CardContent className="pt-6 text-center">
                <List className="text-racing-red text-4xl mb-4 mx-auto" />
                <h3 className="text-xl font-semibold mb-2 text-white">Organize</h3>
                <p className="text-gray-300">
                  Create lists of your favorite races and build your ultimate watchlist
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
