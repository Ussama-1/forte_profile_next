"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Timeline from "@/components/Timeline";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

const jobPlatformEntries = [
  { key: "dice", label: "Dice" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "indeed", label: "Indeed" },
  { key: "wellfound", label: "Wellfound" },
  { key: "glassdoor", label: "Glassdoor" },
  { key: "monster", label: "Monster" },
  { key: "ziprecruiter", label: "ZipRecruiter" },
];

const jobPlatformApiMap: Record<string, string> = {
  // indeed: "/api/indeed-scrapper",
  linkedin: "/api/linkedin-scrapper",
  // wellfound: "/api/wellfound-scraper",
  // glassdoor: "/api/glassdoor-scraper",
  // monster: "/api/monster-scraper",
  dice: "/api/dice-scraper",
  // ziprecruiter: "/api/ziprecruiter-scraper", // Add when available
};

interface JobSearchFormData {
  location: string;
  radius: string;
  includeRemote: boolean;
  jobSites: Record<string, boolean>;
  keywords: string;
}

interface ScrapedJob {
  title: string;
  company: string;
  description: string;
  location: string;
  applyLink: string;
  jobType: string[];
}

interface ProcessedJob extends ScrapedJob {
  id: string;
  overallScore: number;
  priorityMatches: Array<{
    priorityName: string;
    score: number;
    reasoning: string;
  }>;
  source: string;
}

export default function JobSearch() {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  const [formData, setFormData] = useState<JobSearchFormData>({
    location: "",
    radius: "25",
    includeRemote: false,
    jobSites: {
      indeed: false,
      linkedin: false,
      glassdoor: false,
      ziprecruiter: false,
      monster: false,
      dice: true,
      wellfound: false,
    },
    keywords: " ",
  });

  const handleCheckboxChange = (site: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      jobSites: {
        ...prev.jobSites,
        [site]: checked,
      },
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      includeRemote: checked,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSearching(true);
      setSearchProgress(0);
      setCurrentStep("Searching for jobs...");

      // Get selected job platforms
      const selectedPlatforms = Object.entries(formData.jobSites)
        .filter(([, isSelected]) => isSelected)
        .map(([platform]) => platform);

      if (selectedPlatforms.length === 0) {
        toast.error("Please select at least one job platform");
        return;
      }

      // Step 1: Search for jobs on all selected platforms in parallel
      const searchParams = new URLSearchParams({
        jobTitle: formData.keywords,
        location: formData.location || "United States",
        remote: String(formData.includeRemote || false),
        radius: formData.radius,
      });

      setCurrentStep(`Searching ...`);

      // Create promises for all selected platforms
      const searchPromises = selectedPlatforms.map(async (platform) => {
        const apiUrl = jobPlatformApiMap[platform];
        if (!apiUrl) {
          console.warn(`API not available for platform: ${platform}`);
          return {
            platform,
            jobs: [],
            error: `API not available for ${platform}`,
          };
        }

        try {
          const BASE_URL = "fortequantumleap.com/";
          const response = await fetch(`${BASE_URL}${apiUrl}?${searchParams}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to search on ${platform}`);
          }

          const data = await response.json();

          if (!data.success || !data.data) {
            return {
              platform,
              jobs: [],
              error: `No jobs found on ${platform}`,
            };
          }

          // Add source platform to each job
          const jobsWithSource = data.data.map((job: ScrapedJob) => ({
            ...job,
            source: platform,
          }));

          return { platform, jobs: jobsWithSource, error: null };
        } catch (error) {
          console.error(`Error searching on ${platform}:`, error);
          return {
            platform,
            jobs: [],
            error:
              error instanceof Error
                ? error.message
                : `Unknown error on ${platform}`,
          };
        }
      });

      // Wait for all searches to complete
      const searchResults = await Promise.all(searchPromises);

      // Merge all jobs from all platforms
      const allJobs: (ScrapedJob & { source: string })[] = [];
      const platformResults: string[] = [];

      searchResults.forEach(({ platform, jobs, error }) => {
        if (error) {
          console.warn(`${platform}: ${error}`);
          platformResults.push(`${platform}: ${error}`);
        } else {
          allJobs.push(...jobs);
          platformResults.push(`${platform}: ${jobs.length} jobs`);
        }
      });

      if (allJobs.length === 0) {
        toast.error(
          "No jobs found on any platform. Try different keywords or location."
        );
        return;
      }

      setSearchProgress(40);
      setCurrentStep(
        `Found ${allJobs.length} jobs total! Analyzing matches...`
      );

      // Step 2: Analyze jobs with AI
      const analysisResponse = await fetch("/api/analyze-job-match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobs: allJobs }),
      });

      if (!analysisResponse.ok) {
        throw new Error("Failed to analyze job matches");
      }

      const analysisData = await analysisResponse.json();
      setSearchProgress(80);
      setCurrentStep("Processing results...");

      if (analysisData.success && analysisData.data) {
        // Combine scraped jobs with AI analysis results
        const processedJobs: ProcessedJob[] = allJobs.map((job, index) => {
          const analysis:
            | {
                jobIndex: number;
                overallScore: number;
                priorityBreakdown: Array<{
                  priorityName: string;
                  score: number;
                  reasoning: string;
                }>;
              }
            | undefined = analysisData.data.find(
            (a: { jobIndex: number }) => a.jobIndex === index
          );

          return {
            ...job,
            id: `job-${index}`,
            overallScore: analysis?.overallScore || 5,
            priorityMatches: analysis?.priorityBreakdown || [],
          };
        });

        setSearchProgress(100);
        setCurrentStep("Complete!");

        // Store processed jobs in sessionStorage
        sessionStorage.setItem("processedJobs", JSON.stringify(processedJobs));
        sessionStorage.setItem("searchParams", JSON.stringify(formData));

        toast.success(
          `Successfully analyzed ${processedJobs.length} jobs from ${selectedPlatforms.length} platform(s)!`
        );

        // Navigate to results
        setTimeout(() => {
          router.push("/dashboard/results");
        }, 500);
      } else {
        throw new Error(analysisData.error || "Failed to analyze jobs");
      }
    } catch (error) {
      console.error("Error in job search:", error);
      toast.error("Failed to search and analyze jobs. Please try again.");
    } finally {
      setIsSearching(false);
      setSearchProgress(0);
      setCurrentStep("");
    }
  };

  return (
    <>
      {/* Progress Steps */}
      <Timeline
        count={5}
        highlight={4}
        activeColor="teal-600"
        inactiveColor="slate-200"
        activeTextColor="white"
        inactiveTextColor="gray-500"
      />

      {/* Main Content Card */}
      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-6 bg-[#274754] text-white">
            <h2 className="text-xl font-bold mb-2">JOB SEARCH</h2>
            <p className="text-sm text-slate-300">
              Search for jobs based on your CV skills, Forte profile, and
              priorities
            </p>
          </div>

          {/* Search Progress */}
          {isSearching && (
            <div className="p-6 bg-blue-50 border-b">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    {currentStep}
                  </p>
                  <Progress value={searchProgress} className="h-2" />
                  <p className="text-xs text-blue-700 mt-1">
                    {searchProgress}% complete
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Job Platforms Selection */}
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Select Job Platforms
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {jobPlatformEntries.map(({ key, label }) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`site-${key}`}
                        className="hover:cursor-pointer"
                        checked={formData.jobSites[key]}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(key, Boolean(checked))
                        }
                        disabled={isSearching}
                      />
                      <Label
                        htmlFor={`site-${key}`}
                        className="text-sm text-slate-700 hover:cursor-pointer"
                      >
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Search Keywords */}
              <div>
                <h3 className="text-lg font-medium mb-2">Search Keywords</h3>
                <p className="text-sm text-slate-500 mb-2">
                  Based on CV skills and Forte profile
                </p>
                <Input
                  name="keywords"
                  placeholder="E.g., software engineer, data scientist, product manager"
                  className="mb-4"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  disabled={isSearching}
                  required
                />
              </div>

              {/* Location and Radius */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Location</h3>
                  <Input
                    name="location"
                    placeholder="City, State or Zip Code"
                    value={formData.location}
                    onChange={handleInputChange}
                    disabled={isSearching}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Search Radius</h3>
                  <Select
                    value={formData.radius}
                    onValueChange={(value) =>
                      handleSelectChange("radius", value)
                    }
                    disabled={isSearching}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select radius" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 miles</SelectItem>
                      <SelectItem value="10">10 miles</SelectItem>
                      <SelectItem value="25">25 miles</SelectItem>
                      <SelectItem value="50">50 miles</SelectItem>
                      <SelectItem value="100">100 miles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Remote Jobs Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="remote"
                  checked={formData.includeRemote}
                  onCheckedChange={handleSwitchChange}
                  disabled={isSearching}
                />
                <Label htmlFor="remote">Include Remote Jobs</Label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <Link href="/dashboard/priorities">
                  <Button variant="outline" disabled={isSearching}>
                    Back
                  </Button>
                </Link>
                <Button
                  type="submit"
                  style={{ backgroundColor: "#0d9488" }}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {currentStep || "Searching..."}
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Start Job Search & Analysis
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
