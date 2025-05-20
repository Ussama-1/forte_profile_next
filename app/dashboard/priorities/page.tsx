"use client";
import { useState, useEffect } from "react";
import type React from "react";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Timeline from "@/components/Timeline";
import FileTextExtractor from "@/components/FileTextExtractor";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Info, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Priority {
  name: string;
  weight: number;
  currentScore: number;
  bestFit: string;
  mediumFit: string;
  worstFit: string;
}

export default function Priorities() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [progress, setprogress] = useState(0);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [totalWeight, setTotalWeight] = useState(100);
  const [weightedScore, setWeightedScore] = useState(0);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiFormData, setAiFormData] = useState({
    careerGoals: "",
    strengths: "",
    values: "",
    experience: "",
    preferences: "",
  });

  // Fetch existing priorities data if available
  useEffect(() => {
    if (status === "authenticated") {
      fetchPrioritiesData();
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Calculate total weight and weighted score
  useEffect(() => {
    const total = priorities.reduce(
      (sum, priority) => sum + priority.weight,
      0
    );
    setTotalWeight(total);

    const score = priorities.reduce((sum, priority) => {
      return sum + (priority.weight / 100) * priority.currentScore;
    }, 0);
    setWeightedScore(Number.parseFloat(score.toFixed(2)));
  }, [priorities]);

  const fetchPrioritiesData = async () => {
    try {
      const response = await fetch("/api/priorities");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.priorities?.length) {
          setPriorities(data.data.priorities);
        }
      }
    } catch (error) {
      console.error("Error fetching priorities data:", error);
    }
  };

  const handlePriorityChange = (
    index: number,
    field: keyof Priority,
    value: string | number
  ) => {
    const updatedPriorities = [...priorities];

    if (field === "weight" || field === "currentScore") {
      // Ensure value is a number and within valid range
      const numValue = Math.max(
        0,
        Math.min(field === "weight" ? 100 : 10, Number(value) || 0)
      );
      updatedPriorities[index][field] = numValue;
    } else {
      // For text fields
      updatedPriorities[index][field] = value as string;
    }

    setPriorities(updatedPriorities);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      // Save to database
      const response = await fetch("/api/priorities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: JSON.stringify({ priorities }),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save priorities");
      }

      toast(
        <div className={cn("text-green-600")}>
          <strong>Success:</strong> Priorities saved successfully
        </div>
      );

      // Proceed to next page
      router.push("/dashboard/job-search");
    } catch (error) {
      console.error("Error saving priorities:", error);
      toast(
        <div className={cn("text-red-600")}>
          <strong>Error:</strong> Failed to save priorities
        </div>
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleExtractedText = async (text: string) => {
    try {
      setIsProcessing(true);

      // Send the extracted text to the OpenAI API
      const response = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: text,
          type: "priorities",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process text");
      }

      await generatePriorities();
      const data = await response.json();

      if (data.success && data.content) {
        // Update form with the processed data
        if (data.content.priorities && Array.isArray(data.content.priorities)) {
          setPriorities(data.content.priorities);
        }

        setprogress(100);
        toast.success("Document processed successfully");
      } else {
        throw new Error(data.error || "Failed to process document");
      }
    } catch (error) {
      console.error("Error processing text:", error);
      toast.error("Failed to process document");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);

      // Save to database
      const response = await fetch("/api/priorities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: JSON.stringify({ priorities }),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save draft");
      }
      toast.success("Draft saved successfully");
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const generatePriorities = async () => {
    try {
      setIsGenerating(true);

      const response = await fetch("/api/generate-priorities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(aiFormData),
      });

      if (!response.ok) {
        throw new Error("Failed to generate priorities");
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Update priorities with the generated data
        if (data.data.priorities && Array.isArray(data.data.priorities)) {
          setPriorities(data.data.priorities);
          setAiDialogOpen(false);

          toast.success("Priorities generated successfully");
        }
      } else {
        throw new Error(data.error || "Failed to generate priorities");
      }
    } catch (error) {
      console.error("Error generating priorities:", error);
      toast.error("Failed to generate priorities");
    } finally {
      setIsGenerating(false);
    }
  };

  const balanceWeights = () => {
    // Automatically adjust weights to sum to 100%
    const updatedPriorities = [...priorities];
    const currentTotal = updatedPriorities.reduce(
      (sum, priority) => sum + priority.weight,
      0
    );

    if (currentTotal === 0) {
      // If all weights are 0, distribute evenly
      const evenWeight = Math.floor(100 / updatedPriorities.length);
      const remainder = 100 - evenWeight * updatedPriorities.length;

      updatedPriorities.forEach((priority, index) => {
        priority.weight = evenWeight + (index === 0 ? remainder : 0);
      });
    } else {
      // Adjust weights proportionally
      const factor = 100 / currentTotal;

      updatedPriorities.forEach((priority) => {
        priority.weight = Math.round(priority.weight * factor);
      });

      // Handle any rounding errors to ensure total is exactly 100
      const newTotal = updatedPriorities.reduce(
        (sum, priority) => sum + priority.weight,
        0
      );
      if (newTotal !== 100) {
        const diff = 100 - newTotal;
        // Add or subtract the difference from the largest weight
        const largestIndex = updatedPriorities.reduce(
          (maxIndex, priority, index, arr) =>
            priority.weight > arr[maxIndex].weight ? index : maxIndex,
          0
        );
        updatedPriorities[largestIndex].weight += diff;
      }
    }

    setPriorities(updatedPriorities);
    toast.success("Priority weights have been adjusted to total 100%");
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  return (
    <div className="">
      {/* Progress Steps */}
      <Timeline
        count={5}
        highlight={3}
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold mb-2">
                  PRIORITIES PULSE CHECK
                </h2>
                <p className="text-sm text-slate-300">
                  Identify your career priorities and assign importance weights
                  (total should equal 100)
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="upload">
                  Upload Priorities Document
                </TabsTrigger>
                <TabsTrigger value="manual">Enter Manually</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-6">
                <FileTextExtractor
                  onReturn={handleExtractedText}
                  onprogress={0}
                />

                <div className="flex justify-end gap-3 mt-6">
                  <Link href="/dashboard/career-profile">
                    <Button
                      variant="outline"
                      disabled={isProcessing || isSaving}
                    >
                      Back
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={isProcessing || isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Draft"}
                  </Button>
                  <Button
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={() => router.push("/dashboard/job-search")}
                    disabled={isProcessing || isSaving}
                  >
                    Continue to Job Search
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="manual">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Header with explanation */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-teal-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="font-medium text-slate-800 mb-2">
                          Understanding Priority Weights
                        </h3>
                        <p className="text-sm text-slate-600">
                          Assign importance weights to each priority category.
                          The total should equal 100%. Then rate your current
                          satisfaction from 1-10 for each priority.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={balanceWeights}
                            className="text-xs"
                          >
                            Auto-Balance Weights to 100%
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Priority items */}
                  {priorities.map((priority, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                    >
                      {/* Priority header */}
                      <div className="bg-slate-50 p-4 border-b border-slate-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Input
                              id={`priority-${index}-name`}
                              value={priority.name}
                              onChange={(e) =>
                                handlePriorityChange(
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                              className="font-medium border-none p-0 h-auto text-lg bg-transparent focus-visible:ring-0 focus-visible:bg-white/50 rounded px-2 -ml-2 w-full"
                              placeholder="Priority name"
                            />
                            <p className="text-sm text-slate-500 mt-1 ml-0.5">
                              {priority.name === "Values Alignment" &&
                                "Mission, purpose, and values alignment"}
                              {priority.name ===
                                "Leveraging Gifts and Strengths" &&
                                "Utilizes core competencies"}
                              {priority.name ===
                                "Leveraging Knowledge and Experience" &&
                                "Previous experience application"}
                              {priority.name === "Compensation" &&
                                "Salary and benefits package"}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <Label
                                htmlFor={`priority-${index}-weight`}
                                className="text-xs text-slate-500 block mb-1"
                              >
                                Weight (%)
                              </Label>
                              <Input
                                id={`priority-${index}-weight`}
                                type="number"
                                min="0"
                                max="100"
                                value={priority.weight}
                                onChange={(e) =>
                                  handlePriorityChange(
                                    index,
                                    "weight",
                                    e.target.value
                                  )
                                }
                                className="text-center w-20 h-9"
                              />
                            </div>
                            <div className="text-center">
                              <Label
                                htmlFor={`priority-${index}-score`}
                                className="text-xs text-slate-500 block mb-1"
                              >
                                Current (1-10)
                              </Label>
                              <Input
                                id={`priority-${index}-score`}
                                type="number"
                                min="0"
                                max="10"
                                value={priority.currentScore}
                                onChange={(e) =>
                                  handlePriorityChange(
                                    index,
                                    "currentScore",
                                    e.target.value
                                  )
                                }
                                className="text-center w-20 h-9"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Fit scenarios */}
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                              <Label
                                htmlFor={`priority-${index}-best`}
                                className="text-sm font-medium text-slate-700"
                              >
                                Best Fit Scenario
                              </Label>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-3.5 w-3.5 ml-1 text-slate-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="w-60 text-xs">
                                      Describe the ideal scenario for this
                                      priority in a job
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Textarea
                              id={`priority-${index}-best`}
                              value={priority.bestFit}
                              onChange={(e) =>
                                handlePriorityChange(
                                  index,
                                  "bestFit",
                                  e.target.value
                                )
                              }
                              className="h-24 text-sm resize-none"
                              placeholder="Describe the ideal scenario..."
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                              <Label
                                htmlFor={`priority-${index}-medium`}
                                className="text-sm font-medium text-slate-700"
                              >
                                Medium Fit Scenario
                              </Label>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-3.5 w-3.5 ml-1 text-slate-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="w-60 text-xs">
                                      Describe an acceptable scenario for this
                                      priority
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Textarea
                              id={`priority-${index}-medium`}
                              value={priority.mediumFit}
                              onChange={(e) =>
                                handlePriorityChange(
                                  index,
                                  "mediumFit",
                                  e.target.value
                                )
                              }
                              className="h-24 text-sm resize-none"
                              placeholder="Describe an acceptable scenario..."
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                              <Label
                                htmlFor={`priority-${index}-worst`}
                                className="text-sm font-medium text-slate-700"
                              >
                                Worst Fit Scenario
                              </Label>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <HelpCircle className="h-3.5 w-3.5 ml-1 text-slate-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="w-60 text-xs">
                                      Describe a deal-breaker scenario for this
                                      priority
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            <Textarea
                              id={`priority-${index}-worst`}
                              value={priority.worstFit}
                              onChange={(e) =>
                                handlePriorityChange(
                                  index,
                                  "worstFit",
                                  e.target.value
                                )
                              }
                              className="h-24 text-sm resize-none"
                              placeholder="Describe a deal-breaker scenario..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Total Weight and Score Summary */}
                  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="p-5">
                      <h3 className="font-medium text-slate-800 mb-4">
                        Summary
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-slate-700">
                                Total Weight:
                              </span>
                              <span
                                className={`font-bold ${totalWeight === 100 ? "text-green-600" : "text-red-600"}`}
                              >
                                {totalWeight}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${totalWeight === 100 ? "bg-green-500" : totalWeight > 100 ? "bg-red-500" : "bg-yellow-500"}`}
                                style={{
                                  width: `${Math.min(100, totalWeight)}%`,
                                }}
                              ></div>
                            </div>
                            {totalWeight !== 100 && (
                              <p className="text-xs text-red-600 mt-1">
                                {totalWeight < 100
                                  ? `Add ${100 - totalWeight}% more`
                                  : `Remove ${totalWeight - 100}%`}{" "}
                                to reach 100%
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-slate-700">
                                Current Weighted Score:
                              </span>
                              <span className="font-bold text-teal-600">
                                {weightedScore} / 10
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-500"
                                style={{ width: `${weightedScore * 10}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Based on your current scores and priority weights
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Priority breakdown */}
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-slate-700 mb-3">
                          Priority Breakdown
                        </h4>
                        <div className="space-y-3">
                          {priorities.map((priority, index) => (
                            <div key={index} className="flex items-center">
                              <div className="w-32 md:w-48 mr-3">
                                <span className="text-sm text-slate-700 truncate block">
                                  {priority.name}
                                </span>
                              </div>
                              <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden flex items-center">
                                <div
                                  className="h-full bg-teal-500 flex items-center justify-end pr-2"
                                  style={{ width: `${priority.weight}%` }}
                                >
                                  {priority.weight >= 15 && (
                                    <span className="text-xs font-medium text-white">
                                      {priority.weight}%
                                    </span>
                                  )}
                                </div>
                                {priority.weight < 15 && (
                                  <span className="text-xs font-medium text-slate-700 ml-2">
                                    {priority.weight}%
                                  </span>
                                )}
                              </div>
                              <div className="ml-3 w-8 text-center">
                                <span className="text-sm font-medium">
                                  {priority.currentScore}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8">
                    <Link href="/dashboard/career-profile">
                      <Button variant="outline" disabled={isSaving}>
                        Back
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleSaveDraft}
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Save Draft"}
                    </Button>
                    <Button
                      type="submit"
                      className="bg-teal-600 hover:bg-teal-700"
                      disabled={isSaving || totalWeight !== 100}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                          Saving...
                        </>
                      ) : (
                        <>
                          Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
