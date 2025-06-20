import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Flag, Search, Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const [, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleProfile = () => {
    if (user?.username) {
      setLocation(`/users/${user.username}`);
    }
  };

  return (
    <nav className="bg-card-dark border-b border-gray-700 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center space-x-2"
            >
              <Flag className="text-racing-red text-xl" />
              <h1 className="text-xl font-bold text-racing-red">boxboxd</h1>
            </button>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-6">
              <button
                onClick={() => setLocation("/")}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md transition-colors"
              >
                Home
              </button>
              <button className="text-gray-300 hover:text-white px-3 py-2 rounded-md transition-colors">
                Races
              </button>
              <button className="text-gray-300 hover:text-white px-3 py-2 rounded-md transition-colors">
                Lists
              </button>
              <button className="text-gray-300 hover:text-white px-3 py-2 rounded-md transition-colors">
                Following
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Input
                type="text"
                placeholder="Search races..."
                className="bg-deep-dark border-gray-600 text-white pl-10 w-64"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-gray-300 hover:text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <div className="w-8 h-8 bg-racing-red rounded-full flex items-center justify-center">
                    {user?.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={user.username}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white font-semibold text-sm">
                        {user?.username?.[0]?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card-dark border-gray-700">
                <DropdownMenuItem
                  onClick={handleProfile}
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-300 hover:text-white hover:bg-gray-700">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-700 py-4">
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => {
                  setLocation("/");
                  setIsMenuOpen(false);
                }}
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-left transition-colors"
              >
                Home
              </button>
              <button className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-left transition-colors">
                Races
              </button>
              <button className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-left transition-colors">
                Lists
              </button>
              <button className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-left transition-colors">
                Following
              </button>
              <div className="px-3 py-2">
                <Input
                  type="text"
                  placeholder="Search races..."
                  className="bg-deep-dark border-gray-600 text-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
