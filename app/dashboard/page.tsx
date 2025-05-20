"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { AlertCircle, Info, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Timeline from "@/components/Timeline";
import FileTextExtractor from "@/components/FileTextExtractor";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ForteProfile() {
  const { status } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState({
    purpose: "",
    strengths: "",
    motivations: "",
    passions: "",
  });
  const [formErrors, setFormErrors] = useState({
    purpose: false,
    strengths: false,
    motivations: false,
    passions: false,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setprogress] = useState(0);

  // Fetch existing profile data if available
  useEffect(() => {
    if (status === "authenticated") {
      fetchProfileData();
    } else if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const fetchProfileData = async () => {
    try {
      const response = await fetch("/api/forte-profile");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setFormData({
            purpose: data.data.purpose || "",
            strengths: data.data.strengths || "",
            motivations: data.data.motivations || "",
            passions: data.data.passions || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (value.trim().length > 0) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: false,
      }));
    }
  };

  const validateForm = () => {
    const errors = {
      purpose: formData.purpose.trim().length === 0,
      strengths: formData.strengths.trim().length === 0,
      motivations: formData.motivations.trim().length === 0,
      passions: formData.passions.trim().length === 0,
    };

    setFormErrors(errors);
    return !Object.values(errors).some((error) => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        setIsSaving(true);

        // Save to database
        const response = await fetch("/api/forte-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: JSON.stringify(formData),
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save profile");
        }

        toast.success("Forte profile saved successfully");

        // Proceed to next page
        router.push("/dashboard/career-profile");
      } catch (error) {
        console.error("Error saving profile:", error);
        toast.error("Failed to save profile");
      } finally {
        setIsSaving(false);
      }
    } else {
      // Scroll to first error
      const firstErrorField = Object.keys(formErrors).find(
        (key) => formErrors[key as keyof typeof formErrors]
      );

      if (firstErrorField) {
        document.getElementsByName(firstErrorField)[0]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  };

  const handleExtractedText = async (text: string) => {
    try {
      setIsProcessing(true);

      setprogress(0);
      // Send the extracted text to the OpenAI API
      const response = await fetch("/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: text,
          type: "forte profile",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process text");
      }

      const data = await response.json();

      if (data.success && data.content) {
        // Update form with the processed data
        setFormData({
          purpose: data.content.purpose || "",
          strengths: data.content.strengths || "",
          motivations: data.content.motivations || "",
          passions: data.content.passions || "",
        });

        // Clear any errors
        setFormErrors({
          purpose: false,
          strengths: false,
          motivations: false,
          passions: false,
        });

        setprogress(100);
        toast("Success", {
          description: "Document processed successfully",
        });
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
      const response = await fetch("/api/forte-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: JSON.stringify(formData),
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

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-64">Loading...</div>
    );
  }

  return (
    <div className="animate-fadeIn">
      {/* Progress Steps */}
      <div className="mb-6">
        <Timeline
          count={5}
          highlight={1}
          activeColor="teal-600"
          inactiveColor="slate-200"
          activeTextColor="white"
          inactiveTextColor="gray-500"
        />
      </div>

      {/* Main Content Card */}
      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-[#274754] text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">FORTE PROFILE</h2>
                <p className="text-sm text-slate-300">
                  Complete your Forte profile to identify your strengths and
                  motivations
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="upload" className="text-sm">
                  Upload Forte Document
                </TabsTrigger>
                <TabsTrigger value="manual" className="text-sm">
                  Enter Manually
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-6">
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium">
                      Upload your Forte Assessment Document
                    </h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-slate-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>
                            Upload your completed Forte assessment document. If
                            you don&apos;t have one, you can complete it
                            manually.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <FileTextExtractor
                    onReturn={handleExtractedText}
                    onprogress={progress}
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    className="order-1 sm:order-none"
                    onClick={handleSaveDraft}
                    disabled={isProcessing || isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Draft"}
                  </Button>
                  <Button
                    className="order-0 sm:order-none bg-teal-600 hover:bg-teal-700 text-white"
                    disabled={isProcessing || isSaving}
                    onClick={() => router.push("/dashboard/career-profile")}
                  >
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="manual">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label
                          htmlFor="purpose"
                          className="text-sm font-medium"
                        >
                          Purpose Statement
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-slate-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>
                                Your purpose statement describes what drives you
                                professionally and what impact you want to make.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Textarea
                        id="purpose"
                        name="purpose"
                        placeholder="I am driven to help others by..."
                        className={`min-h-[100px] ${
                          formErrors.purpose
                            ? "border-red-300 focus-visible:ring-red-300"
                            : ""
                        }`}
                        value={formData.purpose}
                        onChange={handleTextareaChange}
                      />
                      {formErrors.purpose && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" /> Please enter
                          your purpose statement
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label
                          htmlFor="strengths"
                          className="text-sm font-medium"
                        >
                          Strengths
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-slate-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>
                                List your key professional strengths and
                                abilities that set you apart.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Textarea
                        id="strengths"
                        name="strengths"
                        placeholder="My key strengths include..."
                        className={`min-h-[100px] ${
                          formErrors.strengths
                            ? "border-red-300 focus-visible:ring-red-300"
                            : ""
                        }`}
                        value={formData.strengths}
                        onChange={handleTextareaChange}
                      />
                      {formErrors.strengths && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" /> Please enter
                          your strengths
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label
                          htmlFor="motivations"
                          className="text-sm font-medium"
                        >
                          Motivations
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-slate-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>
                                Describe what motivates you professionally and
                                what drives you to perform at your best.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Textarea
                        id="motivations"
                        name="motivations"
                        placeholder="I am motivated by..."
                        className={`min-h-[100px] ${
                          formErrors.motivations
                            ? "border-red-300 focus-visible:ring-red-300"
                            : ""
                        }`}
                        value={formData.motivations}
                        onChange={handleTextareaChange}
                      />
                      {formErrors.motivations && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" /> Please enter
                          your motivations
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label
                          htmlFor="passions"
                          className="text-sm font-medium"
                        >
                          Professional Work Passions
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-slate-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>
                                What aspects of work are you passionate about?
                                What makes you excited to start your workday?
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Textarea
                        id="passions"
                        name="passions"
                        placeholder="I am passionate about..."
                        className={`min-h-[100px] ${
                          formErrors.passions
                            ? "border-red-300 focus-visible:ring-red-300"
                            : ""
                        }`}
                        value={formData.passions}
                        onChange={handleTextareaChange}
                      />
                      {formErrors.passions && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" /> Please enter
                          your professional passions
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                      <Button
                        type="button"
                        variant="outline"
                        className="order-1 sm:order-none"
                        onClick={handleSaveDraft}
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save Draft"}
                      </Button>
                      <Button
                        type="submit"
                        className="order-0 sm:order-none bg-teal-600 hover:bg-teal-700 text-white"
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Continue"}{" "}
                        {!isSaving && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                    </div>
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
