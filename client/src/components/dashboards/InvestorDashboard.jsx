import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { DollarSign, Rocket } from "lucide-react";
export default function InvestorDashboard({ user, onLogout, onUpdateUser }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <Card className="max-w-2xl w-full text-center">
        <CardHeader className="pb-3">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <DollarSign className="w-6 h-6 text-orange-600" />
          </div>
          <CardTitle className="text-lg mb-2">
            Investor Features Coming Soon
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            We're building a sophisticated platform for investors to discover
            and evaluate startups.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-left">
            <div className="p-3 border rounded-lg">
              <h4 className="mb-1.5 text-sm">Deal Flow</h4>
              <p className="text-muted-foreground text-[10px]">
                Curated startup opportunities based on your criteria
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="mb-1.5 text-sm">Due Diligence</h4>
              <p className="text-muted-foreground text-[10px]">
                Access metrics, financials, and traction data
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="mb-1.5 text-sm">Portfolio Tracking</h4>
              <p className="text-muted-foreground text-[10px]">
                Monitor your investments and receive regular updates
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <h4 className="mb-1.5 text-sm">Investor Network</h4>
              <p className="text-muted-foreground text-[10px]">
                Co-invest with other angels and VCs
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 pt-3">
            <Badge variant="secondary">
              <Rocket className="w-3 h-3 mr-2" />
              Launching Soon in Version 2
            </Badge>
            <p className="text-sm text-muted-foreground">
              Want to contribute? Share your feedback with our team!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
