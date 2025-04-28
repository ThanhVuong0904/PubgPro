import { Link } from "wouter";
import { Shield } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-secondary border-t border-primary/20 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Shield className="w-6 h-6 mr-2 text-primary" />
            <span className="text-sm text-primary font-medium">PUBG Analytics</span>
          </div>
          <div className="flex space-x-6 mb-4 md:mb-0">
            <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              About
            </Link>
            <Link href="/api-docs" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              API
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Contact
            </Link>
            <Link href="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              FAQ
            </Link>
          </div>
          <div className="text-xs text-muted-foreground">
            PUBG is a registered trademark. This site is not affiliated with PUBG Corp.
          </div>
        </div>
      </div>
    </footer>
  );
}
