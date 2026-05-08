import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import ThemeToggle from "./ThemeToggle";
import { useTheme } from "../contexts/ThemeContext";
import { Rocket, Users, CheckCircle, Star, Sun, Moon } from "lucide-react";
export default function ThemeShowcase() {
  const { theme } = useTheme();
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div
            className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4 elevation-2"
            style={{
              background: "linear-gradient(135deg, #3A5AFE, #2ECC71)",
            }}
          >
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl">Google Material Design System</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Clean, professional, and scalable design language with full
            light/dark mode support
          </p>
          <div className="flex items-center justify-center gap-3 pt-4">
            <ThemeToggle showLabel={true} />
            <Badge variant="outline" className="text-sm">
              {theme === "light" ? (
                <>
                  <Sun className="w-3 h-3 mr-1.5 inline" />
                  {" Light Mode Active"}
                </>
              ) : (
                <>
                  <Moon className="w-3 h-3 mr-1.5 inline" />
                  {" Dark Mode Active"}
                </>
              )}
            </Badge>
          </div>
        </div>
        <Card className="material-card">
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
            <CardDescription>
              Google Material Design 3 colors with proper contrast
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div
                  className="w-full h-24 rounded-lg mb-2 elevation-1"
                  style={{
                    background: "#3A5AFE",
                  }}
                />
                <p className="text-sm">Primary Blue</p>
                <p className="text-xs text-muted-foreground">#3A5AFE</p>
              </div>
              <div>
                <div
                  className="w-full h-24 rounded-lg mb-2 elevation-1"
                  style={{
                    background: "#2ECC71",
                  }}
                />
                <p className="text-sm">Secondary Green</p>
                <p className="text-xs text-muted-foreground">#2ECC71</p>
              </div>
              <div>
                <div className="w-full h-24 rounded-lg mb-2 bg-google-red elevation-1" />
                <p className="text-sm">Google Red</p>
                <p className="text-xs text-muted-foreground">#EA4335</p>
              </div>
              <div>
                <div className="w-full h-24 rounded-lg mb-2 bg-google-blue elevation-1" />
                <p className="text-sm">Google Blue</p>
                <p className="text-xs text-muted-foreground">#4285F4</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {theme === "light" && (
          <Card className="material-card border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-primary" />
                Light Mode Features
              </CardTitle>
              <CardDescription>
                Clean white background with excellent readability
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-google-green" />
                    Pure White Background
                  </h4>
                  <p className="text-sm text-muted-foreground ml-6">
                    #FFFFFF background for maximum clarity and professional
                    appearance
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-google-green" />
                    Material Shadows
                  </h4>
                  <p className="text-sm text-muted-foreground ml-6">
                    Subtle elevation shadows for depth and hierarchy
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-google-green" />
                    Optimized Contrast
                  </h4>
                  <p className="text-sm text-muted-foreground ml-6">
                    WCAG AAA compliant text contrast ratios
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-google-green" />
                    Clean Borders
                  </h4>
                  <p className="text-sm text-muted-foreground ml-6">
                    Light gray borders (#E0E0E0) for subtle definition
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {theme === "dark" && (
          <Card className="material-card border-2 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="w-5 h-5 text-primary" />
                Dark Mode Features
              </CardTitle>
              <CardDescription>
                Material Design dark theme for reduced eye strain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-google-green" />
                    True Dark Background
                  </h4>
                  <p className="text-sm text-muted-foreground ml-6">
                    #202124 background matching Google's dark theme
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-google-green" />
                    Elevated Surfaces
                  </h4>
                  <p className="text-sm text-muted-foreground ml-6">
                    Layered surfaces with subtle border highlights
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-google-green" />
                    Reduced Blue Light
                  </h4>
                  <p className="text-sm text-muted-foreground ml-6">
                    Warm colors for comfortable night viewing
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-google-green" />
                    OLED Optimized
                  </h4>
                  <p className="text-sm text-muted-foreground ml-6">
                    Pure black backgrounds save battery on OLED screens
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <div>
          <h2 className="text-2xl mb-4">Material Components</h2>
          <div className="mb-6">
            <h3 className="text-lg mb-3">Buttons</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="default" className="material-ripple">
                <Rocket className="w-4 h-4 mr-2" />
                Primary Button
              </Button>
              <Button variant="secondary" className="material-ripple">
                <Users className="w-4 h-4 mr-2" />
                Secondary
              </Button>
              <Button variant="outline" className="material-ripple">
                <Star className="w-4 h-4 mr-2" />
                Outline
              </Button>
              <Button variant="ghost" className="material-ripple">
                Ghost Button
              </Button>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="text-lg mb-3">Material Elevation</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="elevation-0">
                <CardContent className="p-4 text-center">
                  <p className="text-sm">Elevation 0</p>
                </CardContent>
              </Card>
              <Card className="elevation-1">
                <CardContent className="p-4 text-center">
                  <p className="text-sm">Elevation 1</p>
                </CardContent>
              </Card>
              <Card className="elevation-2">
                <CardContent className="p-4 text-center">
                  <p className="text-sm">Elevation 2</p>
                </CardContent>
              </Card>
              <Card className="elevation-3">
                <CardContent className="p-4 text-center">
                  <p className="text-sm">Elevation 3</p>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="text-lg mb-3">Badges</h3>
            <div className="flex flex-wrap gap-2">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge className="bg-google-red text-white">Error</Badge>
              <Badge className="bg-google-green text-white">Success</Badge>
              <Badge className="bg-google-blue text-white">Info</Badge>
              <Badge className="bg-google-yellow text-foreground">
                Warning
              </Badge>
            </div>
          </div>
        </div>
        <Card className="material-card">
          <CardHeader>
            <CardTitle>What's Been Implemented</CardTitle>
            <CardDescription>
              Complete Google Material Design System with light mode
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-google-green" />
                Design System
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Google Material Design 3 color palette</li>
                <li>• Roboto typography with proper scales</li>
                <li>• Material elevation shadows (8 levels)</li>
                <li>• 8px spacing grid system</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-google-green" />
                Light Mode
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Pure white (#FFFFFF) background</li>
                <li>• Enhanced shadows for depth</li>
                <li>• WCAG AAA compliant contrast</li>
                <li>• Clean light gray borders</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-google-green" />
                Dark Mode
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• True dark (#202124) background</li>
                <li>• Border-based elevation (no shadows)</li>
                <li>• Reduced eye strain colors</li>
                <li>• OLED optimized surfaces</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-google-green" />
                Theme Switching
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                <li>• Persistent theme preference (client preferences API)</li>
                <li>• Smooth transitions between themes</li>
                <li>• Theme toggle in header and landing page</li>
                <li>• No flash of wrong theme on load</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
