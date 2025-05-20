"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, FileText, User, ListChecks, Search, BarChart4, ChevronRight } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#264653] to-[#2A9D8F]/80">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center mb-12">
          {/* <img 
            src="/lovable-uploads/8ef49014-b07b-4b85-b1a5-a357b4ed0ad3.png" 
            alt="Crescendo Logo" 
            className="h-16 mb-4"
          /> */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            FINDING YOUR FORTE: QUANTUM LEAP
          </h1>
          <p className="text-xl text-white/90 max-w-2xl">
            Find the perfect career match aligned with your strengths, values, and priorities
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Card className="border-none shadow-lg py-0 overflow-hidden">
            <CardHeader className="bg-[#264653] text-white py-6">
              <CardTitle className="text-2xl">Welcome to Career Compass</CardTitle>
              <CardDescription className="text-gray-200">
                Your comprehensive tool for professional alignment and job matching
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">How It Works</h2>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 bg-[#2A9D8F]/10 p-2 rounded-full">
                        <User className="h-5 w-5 text-[#2A9D8F]" />
                      </div>
                      <div>
                        <h3 className="font-medium">Forte Profile</h3>
                        <p className="text-sm text-muted-foreground">Build your strengths and motivations profile</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 bg-[#2A9D8F]/10 p-2 rounded-full">
                        <FileText className="h-5 w-5 text-[#2A9D8F]" />
                      </div>
                      <div>
                        <h3 className="font-medium">Career Profile</h3>
                        <p className="text-sm text-muted-foreground">Document your experience and admirable organizations</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 bg-[#2A9D8F]/10 p-2 rounded-full">
                        <ListChecks className="h-5 w-5 text-[#2A9D8F]" />
                      </div>
                      <div>
                        <h3 className="font-medium">Priorities</h3>
                        <p className="text-sm text-muted-foreground">Rank what matters most in your next position</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 bg-[#2A9D8F]/10 p-2 rounded-full">
                        <Search className="h-5 w-5 text-[#2A9D8F]" />
                      </div>
                      <div>
                        <h3 className="font-medium">Job Search</h3>
                        <p className="text-sm text-muted-foreground">Search multiple platforms with your profile</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="flex-shrink-0 bg-[#2A9D8F]/10 p-2 rounded-full">
                        <BarChart4 className="h-5 w-5 text-[#2A9D8F]" />
                      </div>
                      <div>
                        <h3 className="font-medium">Results Analysis</h3>
                        <p className="text-sm text-muted-foreground">View top matches with priority scoring</p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h2 className="text-xl font-semibold mb-4">Key Features</h2>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-5 w-5 text-[#2A9D8F]" />
                      <span>Upload CV or enter career details manually</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-5 w-5 text-[#2A9D8F]" />
                      <span>Structured priorities assessment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-5 w-5 text-[#2A9D8F]" />
                      <span>Multi-platform job search integration</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-5 w-5 text-[#2A9D8F]" />
                      <span>Visualization of job matches</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-5 w-5 text-[#2A9D8F]" />
                      <span>Detailed match scoring system</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-5 w-5 text-[#2A9D8F]" />
                      <span>Exportable results and reports</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="font-medium mb-2">Administrator Tools</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Career coaches and administrators can manage multiple clients and generate comprehensive reports.
                    </p>
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/dashboard/settings">
                        Manage Settings
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-6 bg-gray-50 rounded-b-lg">
              <Button size="lg" className="w-full bg-[rgb(13,148,136)] hover:bg-[rgb(40,102,97)]" asChild>
                <Link href="/dashboard">
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      <footer className="py-6 text-center text-white/70">
        <p>© 2025 Crescendo - FINDING YOUR FORTE: QUANTUM LEAP. All rights reserved.</p>
      </footer>
    </div>
  );
}