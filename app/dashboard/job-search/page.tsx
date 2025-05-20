"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
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

export default function JobSearch() {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);

  const [formData, setFormData] = useState({
    location: "",
    radius: "25",
    includeRemote: true,
    customSites: [""],
    jobSites: {
      linkedin: true,
      indeed: true,
      glassdoor: true,
      ziprecruiter: false,
      monster: false,
      careerbuilder: false,
      usajobs: false,
      dice: false,
      idealist: false,
      simplyhired: false,
    },
    keywords: "",
  });

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

     

 

      // Prepare search parameters
      const searchParams = {
        location: formData.location,
        radius: formData.radius,
        includeRemote: formData.includeRemote,
        jobSites: formData.jobSites,
        keywords: formData.keywords,
      };

      // Send search request to API
      const response = await fetch("/api/job-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchParams),
      });

      if (!response.ok) {
        throw new Error("Failed to search for jobs");
      }

      const data = await response.json();

      if (data.success) {
        // Store jobs in localStorage for the results page
        localStorage.setItem("jobSearchResults", JSON.stringify(data.jobs));

        // Navigate to results page
        router.push("/dashboard/results");
      } else {
        throw new Error(data.error || "Failed to search for jobs");
      }
    } catch (error) {
      console.error("Error searching for jobs:", error);
      toast.error("Failed to search for jobs. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      {/* Progress Steps */}
      <Timeline
        count={5} // Number of circles
        highlight={4} // Highlight first 3 circles
        activeColor="teal-600" // Color for highlighted elements
        inactiveColor="slate-200" // Color for non-highlighted elements
        activeTextColor="white" // Text color in highlighted circles
        inactiveTextColor="gray-500" // Text color in non-highlighted circles
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

          {/* Content */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Search Keywords</h3>
                <p className="text-sm text-slate-500 mb-2">
                  Based on CV skills and Forte profile
                </p>

                <Input
                  name="keywords"
                  placeholder="E.g., education program manager, curriculum development, coaching"
                  className="mb-4"
                  value={formData.keywords}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Location</h3>
                  <Input
                    name="location"
                    placeholder="City, State or Zip Code"
                    value={formData.location}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Search Radius</h3>
                  <Select
                    value={formData.radius}
                    onValueChange={(value) =>
                      handleSelectChange("radius", value)
                    }
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="remote"
                  checked={formData.includeRemote}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="remote">Include Remote Jobs</Label>
              </div>

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
                    "Searching..."
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Start Job Search
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
