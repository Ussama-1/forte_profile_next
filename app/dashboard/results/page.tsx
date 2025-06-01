"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Download,
  ArrowLeft,
  ExternalLink,
  Building,
  MapPin,
  Search,
  Filter,
  Briefcase,
  Star,
  TrendingUp,
  Users,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Timeline from "@/components/Timeline";
import {
  BarChart,
  XAxis,
  YAxis,
  Bar,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatHtml, extractPlainText } from "./formatHtml";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PriorityMatch {
  priorityName: string;
  score: number;
  reasoning: string;
}

interface ProcessedJob {
  id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  applyLink: string;
  jobType: string[];
  overallScore: number;
  priorityMatches: PriorityMatch[];
  source: string;
}

// Colors for the charts
const COLORS = [
  "#2A9D8F",
  "#E9C46A",
  "#F4A261",
  "#E76F51",
  "#264653",
  "#A8DADC",
  "#457B9D",
  "#1D3557",
];

export default function Results() {
  const [processedJobs, setProcessedJobs] = useState<ProcessedJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ProcessedJob | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [list, setlist] = useState(false)
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [showRemoteOnly, setShowRemoteOnly] = useState(false);
  const [sortOption, setSortOption] = useState("match");

  const [formattedHtml, setFormattedHtml] = useState("");

  // Load processed jobs from sessionStorage
  useEffect(() => {
    const loadProcessedJobs = () => {
      try {
        const storedJobs = sessionStorage.getItem("processedJobs");
        if (storedJobs) {
          const jobs: ProcessedJob[] = JSON.parse(storedJobs);
          setProcessedJobs(jobs);

          // Clear the session storage after loading
          sessionStorage.removeItem("processedJobs");
          sessionStorage.removeItem("searchParams");
        } else {
          // If no jobs in session storage, redirect back to search
          toast.error("No job data found. Please perform a new search.");
        }
      } catch (error) {
        console.error("Error loading processed jobs:", error);
        toast.error("Error loading job data. Please try searching again.");
      }
    };

    loadProcessedJobs();
  }, []);

  useEffect(() => {
    const cleaned = formatHtml(selectedJob?.description || "");
    setFormattedHtml(cleaned);
  }, [selectedJob]);

  // Apply filters and sorting
  const filteredResults = useMemo(() => {
    let filtered = [...processedJobs];

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
      filtered.sort((a, b) => b.overallScore - a.overallScore);
    } else if (sortOption === "company") {
      filtered.sort((a, b) => a.company.localeCompare(b.company));
    } else if (sortOption === "title") {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  }, [processedJobs, searchTerm, locationFilter, showRemoteOnly, sortOption]);

  const handleJobClick = (job: ProcessedJob) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
  };

  const handleExportReport = () => {
    const headers = [
      "Title",
      "Company",
      "Location",
      "Overall Score",
      "Source",
      "Apply Link",
      "Priority Scores",
    ];
    const csvRows = [headers];

    filteredResults.forEach((job) => {
      const priorityScores = job.priorityMatches
        .map((p) => `${p.priorityName}: ${p.score}`)
        .join("; ");

      const row = [
        `"${job.title}"`,
        `"${job.company}"`,
        `"${job.location}"`,
        `${job.overallScore}`,
        `"${job.source}"`,
        `"${job.applyLink}"`,
        `"${priorityScores}"`,
      ];
      csvRows.push(row);
    });

    const csvString = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "job_analysis_results.csv");
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

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 6) return "text-teal-600 bg-teal-50 border-teal-200";
    if (score >= 4) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-gray-600 bg-gray-50 border-gray-200";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 8) return "#10b981";
    if (score >= 6) return "#0d9488";
    if (score >= 4) return "#f59e0b";
    return "#6b7280";
  };

  // Prepare chart data with truncated names for better display
  const chartData = filteredResults.map((job, index) => ({
    name: `${job.title.substring(0, 15)}${job.title.length > 15 ? "..." : ""}`,
    fullName: job.title,
    company: job.company,
    score: job.overallScore,
    index,
  }));

  if (processedJobs.length === 0) {
    return (
      <Card className="border-none shadow-md">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No job data found</h3>
            <p className="text-sm text-slate-500 mb-6">
              Please perform a new job search to see results.
            </p>
            <Link href="/dashboard/job-search">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Search
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

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
          {/* Header */}
          <div className="p-6 bg-[#274754] text-white flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold mb-2">JOB ANALYSIS RESULTS</h2>
              <p className="text-sm text-slate-300">
                Found {processedJobs.length} jobs with AI-powered priority
                matching
              </p>
            </div>
            <Button
              variant="outline"
              className="text-white border-white/20 bg-transparent hover:bg-white/10"
              onClick={handleExportReport}
              disabled={processedJobs.length === 0}
            >
              <Download className="h-4 w-4 mr-2" /> Export Report
            </Button>
          </div>

          <div className="p-6">
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger onClick={()=>setlist(false)} value="list">Job List</TabsTrigger>
                <TabsTrigger onClick={()=>setlist(true)} value="chart">Match Analysis</TabsTrigger>
              </TabsList>

              {/* Filters */}

              <div className={`mb-6 space-y-4 transition-all duration-300 ${list ? "hidden":""}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <Input
                        placeholder="Search jobs..."
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
                        <SelectItem value="match">Excellent</SelectItem>
                        <SelectItem value="title">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remote-only"
                      checked={showRemoteOnly}
                      onCheckedChange={(checked) =>
                        setShowRemoteOnly(checked as boolean)
                      }
                    />
                    <Label htmlFor="remote-only">Remote only</Label>
                  </div> */}
                
                </div>
              </div>

              <TabsContent value="list" className="space-y-4">
                {filteredResults.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Filter className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <h3 className="text-lg font-medium mb-1">
                      No matching jobs found
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Try adjusting your filters to see more results.
                    </p>
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  filteredResults.map((job) => (
                    <Card
                      key={job.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleJobClick(job)}
                    >
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800 mb-2">
                              {job.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Building className="h-4 w-4 mr-1" />
                                <span>{job.company}</span>
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center">
                                <Briefcase className="h-4 w-4 mr-1" />
                                <span>{job.source}</span>
                              </div>
                            </div>
                          </div>
                          <div className="sm:ml-4">
                            <Badge
                              className={`text-lg font-bold px-3 py-1 border ${getScoreColor(
                                job.overallScore
                              )}`}
                            >
                              {job.overallScore.toFixed(1)}/10
                            </Badge>
                          </div>
                        </div>

                        <div className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {extractPlainText(job.description).substring(0, 200)}
                          ...
                        </div>

                        {job.priorityMatches.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {job.priorityMatches
                              .slice(0, 4)
                              .map((match, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {match.priorityName}: {match.score}/10
                                </Badge>
                              ))}
                            {job.priorityMatches.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{job.priorityMatches.length - 4} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}

                <div className="flex justify-center mt-6">
                  <Link href="/dashboard/job-search">
                    <Button variant="outline" className="w-full sm:w-auto">
                      <ArrowLeft className="h-4 w-4 mr-2" /> New Search
                    </Button>
                  </Link>
                </div>
              </TabsContent>

              <TabsContent value="chart">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center py-9">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Job Match Scores Analysis ({filteredResults.length} jobs)
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 sm:p-6">
                    <div className="h-96 w-full overflow-x-auto">
                      <div
                        style={{
                          minWidth: `${Math.max(600, chartData.length * 60)}px`,
                          height: "100%",
                        }}
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
                            margin={{
                              top: 20,
                              right: 30,
                              left: 20,
                              bottom: 60,
                            }}
                            barCategoryGap="10%"
                          >
                            <XAxis
                              dataKey="name"
                              angle={-45}
                              textAnchor="end"
                              height={80}
                              fontSize={12}
                              interval={0}
                            />
                            <YAxis
                              domain={[0, 10]}
                              label={{
                                value: "Match Score",
                                angle: -90,
                                position: "insideLeft",
                                style: { textAnchor: "middle" },
                              }}
                            />
                            <Tooltip
                              formatter={(value: number) => [
                                `${value.toFixed(1)}/10`,
                                "Match Score",
                              ]}
                              labelFormatter={(_, payload) => {
                                if (payload && payload[0]) {
                                  const data = payload[0].payload;
                                  return `${data.fullName} - ${data.company}`;
                                }
                                return "";
                              }}
                            />
                            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                              {chartData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Priority breakdown for top jobs */}
                    <Separator className="my-6" />
                    <div className="space-y-4">
                      <h3 className="font-medium mb-4">
                        Top 5 Jobs Priority Breakdown
                      </h3>
                      {filteredResults.slice(0, 5).map((job, idx) => (
                        <div
                          key={job.id}
                          className="space-y-3 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{
                                backgroundColor: COLORS[idx % COLORS.length],
                              }}
                            ></div>
                            <h4 className="font-medium text-sm sm:text-base">
                              {job.title} - {job.company} (
                              {job.overallScore.toFixed(1)}/10)
                            </h4>
                          </div>
                          {job.priorityMatches &&
                            job.priorityMatches.length > 0 && (
                              <div className="pl-3 sm:pl-5 space-y-2">
                                {job.priorityMatches.map((match, index) => (
                                  <div
                                    key={index}
                                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-2"
                                  >
                                    <span className="font-medium">
                                      {match.priorityName}
                                    </span>
                                    <div className="flex items-center">
                                      <div className="w-24 sm:w-32 h-2 bg-gray-200 rounded-full mr-2">
                                        <div
                                          className="h-2 bg-teal-500 rounded-full"
                                          style={{
                                            width: `${
                                              (match.score / 10) * 100
                                            }%`,
                                          }}
                                        ></div>
                                      </div>
                                      <span className="text-xs font-medium">
                                        {match.score}/10
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
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Job Detail Dialog */}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0">
          {selectedJob && (
            <>
              <DialogTitle className="sr-only">
                {selectedJob.title} at {selectedJob.company}
              </DialogTitle>

              {/* Header */}
              <div className="bg-[#274754] text-white p-4 sm:p-6 rounded-t-lg">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold mb-2">
                      {selectedJob.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-200">
                      <div className="flex items-center">
                        <Building className="h-5 w-5 mr-2" />
                        <span className="font-medium text-base sm:text-lg">
                          {selectedJob.company}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-5 w-5 mr-2" />
                        <span>{selectedJob.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Briefcase className="h-5 w-5 mr-2" />
                        <span>{selectedJob.source}</span>
                      </div>
                    </div>
                  </div>
                  <div className="sm:ml-4 flex flex-row sm:flex-col items-center sm:items-end justify-between sm:space-y-2 w-full sm:w-auto mr-5">
                    <Badge
                      className={`text-lg font-bold px-3 py-1 sm:px-4 sm:py-2 border-2 ${getScoreColor(
                        selectedJob.overallScore
                      )}`}
                    >
                      {selectedJob.overallScore.toFixed(1)}/10
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <ScrollArea className="max-h-[calc(90vh-200px)] p-4 sm:p-6">
                <div className="space-y-6">
                  {/* Priority Analysis Section */}
                  {selectedJob.priorityMatches.length > 0 && (
                    <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border">
                      <h3 className="font-bold text-lg sm:text-xl mb-4 flex items-center text-gray-800">
                        <Star className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-yellow-500" />
                        Priority Match Analysis
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedJob.priorityMatches.map((match, index) => (
                          <div
                            key={index}
                            className="bg-white p-4 rounded-lg border shadow-sm"
                          >
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-semibold text-gray-800">
                                {match.priorityName}
                              </span>
                              <Badge
                                className={`font-bold ${getScoreColor(
                                  match.score
                                )}`}
                              >
                                {match.score}/10
                              </Badge>
                            </div>
                            <div className="w-full h-3 bg-gray-200 rounded-full mb-3">
                              <div
                                className="h-3 rounded-full transition-all duration-300"
                                style={{
                                  width: `${(match.score / 10) * 100}%`,
                                  backgroundColor: getScoreBarColor(
                                    match.score
                                  ),
                                }}
                              />
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {match.reasoning}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Job Description */}
                  <div className="bg-white border rounded-lg p-4 sm:p-6">
                    <h3 className="font-bold text-lg sm:text-xl mb-4 text-gray-800">
                      Job Description
                    </h3>
                    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                      <div
                        dangerouslySetInnerHTML={{ __html: formattedHtml }}
                      />
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="bg-white border rounded-lg p-4 sm:p-6">
                    <h4 className="font-semibold text-gray-800 mb-3">
                      Job Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-gray-600">
                            Company: {selectedJob.company}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-gray-600">
                            Location: {selectedJob.location}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                          <span className="text-gray-600">
                            Source: {selectedJob.source}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {selectedJob.jobType.length > 0 && (
                          <div className="flex items-start text-sm">
                            <Award className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                            <div>
                              <span className="text-gray-600">Type: </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedJob.jobType.map((type, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {type}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <div
                            className="text-2xl font-bold mb-2"
                            style={{
                              color: getScoreBarColor(selectedJob.overallScore),
                            }}
                          >
                            {selectedJob.overallScore.toFixed(1)}/10
                          </div>
                          <p className="text-sm text-gray-600">
                            Overall Match Score
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Footer with Apply Button */}
              <div className="border-t bg-gray-50 p-4 sm:p-6 rounded-b-lg">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-600 text-center sm:text-left">
                    Ready to apply? Click the button to visit the job posting.
                  </div>
                  <Button
                    asChild
                    size="lg"
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6 sm:px-8 w-full sm:w-auto"
                  >
                    <a
                      href={selectedJob.applyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center"
                    >
                      Apply Now
                      <ExternalLink className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
