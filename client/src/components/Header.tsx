import { useState } from "react";
import { Link } from "wouter";
import { Shield, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";

export default function Header() {
  const isMobile = useMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const NavLinks = () => (
    <>
      <Link href="/" className="text-foreground hover:text-primary transition-colors">
        Dashboard
      </Link>
      <Link href="/match-history" className="text-foreground hover:text-primary transition-colors">
        Match History
      </Link>
      <Link href="/leaderboards" className="text-foreground hover:text-primary transition-colors">
        Leaderboards
      </Link>
      <Link href="/map-stats" className="text-foreground hover:text-primary transition-colors">
        Map Stats
      </Link>
    </>
  );

  return (
    <header className="bg-secondary border-b border-primary/20">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/" className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-bold text-primary">PUBG Analytics</h1>
          </Link>
        </div>
        
        {!isMobile ? (
          <div className="hidden md:flex items-center space-x-6">
            <NavLinks />
          </div>
        ) : (
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-secondary">
              <div className="flex justify-end mb-6">
                <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                  <X className="h-6 w-6" />
                </Button>
              </div>
              <div className="flex flex-col space-y-4">
                <NavLinks />
              </div>
            </SheetContent>
          </Sheet>
        )}
        
        <div className="flex items-center space-x-4">
          <Link href="/settings">
            <Button variant="outline">Settings</Button>
          </Link>
          <Button>Sign In</Button>
        </div>
      </div>
    </header>
  );
}
