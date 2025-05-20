"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Download,
  ArrowLeft,
  ExternalLink,
  Building,
  MapPin,
  Calendar,
  Search,
  Filter,
  X,
  Briefcase,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Timeline from "@/components/Timeline";
import {
  BarChart,
  XAxis,
  YAxis,
  Bar,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PriorityMatch {
  categoryName: string;
  score: number;
}

interface Job {
  id: string | number;
  title: string;
  description: string;
  company: string;
  location: string;
  postedDate: string;
  matchScore: number;
  requirements?: string[];
  benefits?: string[];
  priorityMatches?: PriorityMatch[];
  source: string;
  url: string;
  applyLink: string;
}

export default function Results() {
  const [results, setResults] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [showRemoteOnly, setShowRemoteOnly] = useState(false);
  const [sortOption, setSortOption] = useState("match");

  // Colors for the charts
  const COLORS = ["#2A9D8F", "#E9C46A", "#F4A261", "#E76F51", "#264653"];

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const storedResults = localStorage.getItem("jobSearchResults");
        if (storedResults) {
          const parsedResults = JSON.parse(storedResults);
          if (Array.isArray(parsedResults) && parsedResults.length > 0) {
            setResults(parsedResults);
          }
        }
      } catch (error) {
        console.error("Error fetching job results:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Apply filters and sorting
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Apply search term filter
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(term) ||
          job.description.toLowerCase().includes(term) ||
          job.company.toLowerCase().includes(term)
      );
    }

    // Apply location filter
    if (locationFilter.trim() !== "") {
      const location = locationFilter.toLowerCase().trim();
      filtered = filtered.filter((job) =>
        job.location.toLowerCase().includes(location)
      );
    }

    // Apply remote filter
    if (showRemoteOnly) {
      filtered = filtered.filter(
        (job) =>
          job.location.toLowerCase().includes("remote") ||
          job.description.toLowerCase().includes("remote")
      );
    }

    // Apply sorting
    if (sortOption === "match") {
      filtered.sort((a, b) => b.matchScore - a.matchScore);
    } else if (sortOption === "recent") {
      filtered.sort((a, b) => {
        const dateA = new Date(a.postedDate).getTime();
        const dateB = new Date(b.postedDate).getTime();
        return dateB - dateA;
      });
    } else if (sortOption === "company") {
      filtered.sort((a, b) => a.company.localeCompare(b.company));
    }

    return filtered;
  }, [results, searchTerm, locationFilter, showRemoteOnly, sortOption]);

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
  };

  const handleExportReport = () => {
    const headers = [
      "Title",
      "Company",
      "Location",
      "Match Score",
      "Source",
      "URL",
    ];
    const csvRows = [headers];

    results.forEach((job) => {
      const row = [
        `"${job.title || ""}"`,
        `"${job.company || ""}"`,
        `"${job.location || ""}"`,
        `${job.matchScore || ""}`,
        `"${job.source || ""}"`,
        `"${job.applyLink || ""}"`,
      ];
      csvRows.push(row);
    });

    const csvString = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "job_search_results.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setLocationFilter("");
    setShowRemoteOnly(false);
    setSortOption("match");
  };

  // Function to truncate description
  const truncateDescription = (text: string, maxLength = 150) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  // Function to get match score color
  const getMatchScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-500";
    if (score >= 6) return "bg-teal-500";
    if (score >= 4) return "bg-yellow-500";
    return "bg-gray-400";
  };

  return (
    <>
      <Timeline
        count={5}
        highlight={5}
        activeColor="teal-600"
        inactiveColor="slate-200"
        activeTextColor="white"
        inactiveTextColor="gray-500"
      />
      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          <div className="p-6 bg-[#274754] text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold mb-2">JOB SEARCH RESULTS</h2>
              <p className="text-sm text-slate-300">
                Top matching jobs based on your profile and priorities
              </p>
            </div>
            <Button
              variant="outline"
              className="text-white border-white/20 bg-transparent hover:cursor-pointer hover:bg-white/10"
              onClick={handleExportReport}
              disabled={results.length === 0}
            >
              <Download className="h-4 w-4 mr-2" /> Export Report
            </Button>
          </div>
          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <p>Loading results...</p>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">
                  No job results found
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  Try adjusting your search criteria or uploading more detailed
                  profile information.
                </p>
                <Link href="/dashboard/job-search">
                  <Button variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Search
                  </Button>
                </Link>
              </div>
            ) : (
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="all">All Results</TabsTrigger>
                  <TabsTrigger value="chart">Chart View</TabsTrigger>
                </TabsList>
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="col-span-1 md:col-span-2">
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <Input
                          placeholder="Search jobs by title, company, or keyword"
                          className="pl-10"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Input
                        placeholder="Filter by location"
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                      />
                    </div>
                    <div>
                      <Select value={sortOption} onValueChange={setSortOption}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="match">
                            Match Score (High to Low)
                          </SelectItem>
                          <SelectItem value="recent">Most Recent</SelectItem>
                          <SelectItem value="company">Company Name</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remote-only"
                        checked={showRemoteOnly}
                        onCheckedChange={(checked) =>
                          setShowRemoteOnly(checked as boolean)
                        }
                      />
                      <Label htmlFor="remote-only">Remote only</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="text-xs"
                      >
                        <X className="h-3 w-3 mr-1" /> Clear Filters
                      </Button>
                      <div className="text-sm text-slate-500">
                        {filteredResults.length} of {results.length} jobs
                      </div>
                    </div>
                  </div>
                </div>
                <TabsContent value="all" className="space-y-6">
                  {filteredResults.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Filter className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <h3 className="text-lg font-medium mb-1">
                        No matching jobs found
                      </h3>
                      <p className="text-sm text-slate-500 mb-4">
                        Try adjusting your filters to see more results.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  ) : (
                    filteredResults.map((job) => (
                      <div
                        key={job.id}
                        className="border rounded-lg hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                        onClick={() => handleJobClick(job)}
                      >
                        <div className="flex flex-col md:flex-row">
                          {/* Left side with match score */}
                          <div className="md:w-20 p-4 flex flex-row md:flex-col items-center justify-center bg-gray-50 border-b md:border-b-0 md:border-r">
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-12 h-12 rounded-full ${getMatchScoreColor(job.matchScore)} flex items-center justify-center text-white font-bold text-lg`}
                              >
                                {job.matchScore}
                              </div>
                              <span className="text-xs text-gray-500 mt-1">
                                Match
                              </span>
                            </div>
                          </div>

                          {/* Main content */}
                          <div className="flex-1 p-4">
                            <div className="flex flex-col md:flex-row justify-between">
                              <div>
                                <h3 className="text-lg font-bold text-gray-800">
                                  {job.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <Building className="h-3.5 w-3.5 mr-1 text-gray-500" />
                                    <span>{job.company}</span>
                                  </div>
                                  <div className="flex items-center">
                                    <MapPin className="h-3.5 w-3.5 mr-1 text-gray-500" />
                                    <span>{job.location}</span>
                                  </div>
                                  {job.postedDate && (
                                    <div className="flex items-center">
                                      <Calendar className="h-3.5 w-3.5 mr-1 text-gray-500" />
                                      <span>Posted {job.postedDate}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="mt-2 md:mt-0">
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                  {job.source}
                                </Badge>
                              </div>
                            </div>

                            <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                              {truncateDescription(job.description)}
                            </p>

                            {job.priorityMatches &&
                              job.priorityMatches.length > 0 && (
                                <div className="mt-3">
                                  <div className="flex flex-wrap gap-2">
                                    {job.priorityMatches.map((match, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className="text-xs bg-gray-50"
                                      >
                                        {match.categoryName}: {match.score}%
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div className="flex justify-center mt-6">
                    <Link href="/dashboard/job-search">
                      <Button variant="outline" className="w-full sm:w-auto">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Search
                      </Button>
                    </Link>
                  </div>
                </TabsContent>
                <TabsContent value="chart">
                  <CardContent className="p-6">
                    <div className="h-96 mb-6">
                      <h3 className="font-medium mb-4">Job Match Comparison</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={filteredResults.slice(0, 10).map((job) => ({
                            name: job.title,
                            company: job.company,
                            score: job.matchScore,
                          }))}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <XAxis dataKey="name" />
                          <YAxis domain={[0, 10]} />
                          <Tooltip
                            formatter={(value) => [
                              `${value} / 10`,
                              "Match Score",
                            ]}
                            labelFormatter={(value) =>
                              `${value} (${filteredResults.find((job) => job.title === value)?.company})`
                            }
                          />
                          <Bar dataKey="score" name="Match Score">
                            {filteredResults.slice(0, 10).map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <Separator className="my-6" />
                    <div className="space-y-4">
                      <h3 className="font-medium mb-2">
                        Priority Breakdown by Job
                      </h3>
                      {filteredResults.slice(0, 3).map((job, idx) => (
                        <div key={job.id} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{
                                backgroundColor: COLORS[idx % COLORS.length],
                              }}
                            ></div>
                            <h4 className="font-medium">
                              {job.title} - {job.company}
                            </h4>
                          </div>
                          {job.priorityMatches &&
                            job.priorityMatches.length > 0 && (
                              <div className="pl-5">
                                {job.priorityMatches.map((match, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between text-sm mb-1"
                                  >
                                    <span>{match.categoryName}</span>
                                    <div className="flex items-center">
                                      <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                                        <div
                                          className="h-2 bg-teal-500 rounded-full"
                                          style={{ width: `${match.score}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-xs">
                                        {match.score}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </CardContent>
      </Card>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-0">
          {selectedJob && (
            <>
              <DialogTitle className="sr-only">
                {selectedJob.title} at {selectedJob.company}
              </DialogTitle>
              <div className="flex flex-col">
                {/* Header with colored background */}
                <div className="bg-[#274754] text-white p-6 rounded-t-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-bold">{selectedJob.title}</h2>
                    <div
                      className={`px-3 py-1 rounded-full ${getMatchScoreColor(selectedJob.matchScore)} text-white font-bold`}
                    >
                      {selectedJob.matchScore}/10 Match
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-200">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      <span className="font-medium">{selectedJob.company}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{selectedJob.location}</span>
                    </div>
                    {selectedJob.postedDate && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Posted {selectedJob.postedDate}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" />
                      <span>{selectedJob.source}</span>
                    </div>
                  </div>
                </div>

                {/* Main content */}
                <div className="p-6">
                  {/* Priority matches section */}
                  {selectedJob.priorityMatches &&
                    selectedJob.priorityMatches.length > 0 && (
                      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-lg mb-3 flex items-center">
                          <Star className="h-5 w-5 mr-2 text-yellow-500" />
                          Priority Matches
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedJob.priorityMatches.map((match, index) => (
                            <div
                              key={index}
                              className="bg-white p-3 rounded-md border"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium">
                                  {match.categoryName}
                                </span>
                                <span className="text-sm font-bold">
                                  {match.score}/100
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full">
                                <div
                                  className={`h-2 rounded-full ${match.score > 70 ? "bg-green-500" : match.score > 40 ? "bg-yellow-500" : "bg-red-400"}`}
                                  style={{ width: `${match.score}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Job description */}
                  <div className="mb-6">
                    <h3 className="font-medium text-lg mb-3">
                      Job Description
                    </h3>
                    <div className="text-sm text-gray-700 whitespace-pre-line bg-white p-4 rounded-lg border">
                      {selectedJob.description}
                    </div>
                  </div>

                  {/* Requirements */}
                  {selectedJob.requirements &&
                    selectedJob.requirements.length > 0 && (
                      <div className="mb-6">
                        <h3 className="font-medium text-lg mb-3">
                          Requirements
                        </h3>
                        <div className="bg-white p-4 rounded-lg border">
                          <ul className="list-disc list-inside space-y-2">
                            {selectedJob.requirements.map((req, index) => (
                              <li key={index} className="text-sm text-gray-700">
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                  {/* Benefits */}
                  {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-medium text-lg mb-3">Benefits</h3>
                      <div className="bg-white p-4 rounded-lg border">
                        <ul className="list-disc list-inside space-y-2">
                          {selectedJob.benefits.map((benefit, index) => (
                            <li key={index} className="text-sm text-gray-700">
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Apply button */}
                  <div className="flex justify-end mt-6">
                    {selectedJob.applyLink && (
                      <Button asChild className="bg-teal-600 hover:bg-teal-700">
                        <a
                          href={selectedJob.applyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Apply Now <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
