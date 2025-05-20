"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Timeline from "@/components/Timeline";
import FileTextExtractor from "@/components/FileTextExtractor";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function CareerProfile() {
  const { status } = useSession();
  const router = useRouter();
  const [progress, setprogress] = useState(0);
  const [formData, setFormData] = useState({
    experienceSummary: "",
    coreCompetencies: "",
    admirableOrganizations: [""] as string[],
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
      const response = await fetch("/api/career-profile");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setFormData({
            experienceSummary: data.data.experienceSummary || "",
            coreCompetencies: data.data.coreCompetencies || "",
            admirableOrganizations: data.data.admirableOrganizations?.length
              ? data.data.admirableOrganizations
              : [""],
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
  };

  const handleOrganizationChange = (index: number, value: string) => {
    const updatedOrgs = [...formData.admirableOrganizations];
    updatedOrgs[index] = value;
    setFormData((prev) => ({
      ...prev,
      admirableOrganizations: updatedOrgs,
    }));
  };

  const addOrganization = () => {
    if (formData.admirableOrganizations.length < 5) {
      setFormData((prev) => ({
        ...prev,
        admirableOrganizations: [...prev.admirableOrganizations, ""],
      }));
    } else {
      toast.error("You can add up to 5 organizations");
    }
  };

  const removeOrganization = (index: number) => {
    const updatedOrgs = [...formData.admirableOrganizations];
    updatedOrgs.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      admirableOrganizations: updatedOrgs.length ? updatedOrgs : [""],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      // Filter out empty organizations
      const filteredOrgs = formData.admirableOrganizations.filter(
        (org) => org.trim() !== ""
      );

      // Save to database
      const response = await fetch("/api/career-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: JSON.stringify({
            ...formData,
            admirableOrganizations: filteredOrgs,
          }),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      toast.success("Career profile saved successfully");

      // Proceed to next page
      router.push("/dashboard/priorities");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
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
          type: "career profile",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process text");
      }

      const data = await response.json();

      if (data.success && data.content) {
        // Update form with the processed data
        setFormData({
          experienceSummary: data.content.experienceSummary || "",
          coreCompetencies: data.content.coreCompetencies || "",
          admirableOrganizations: data.content.admirableOrganizations?.length
            ? data.content.admirableOrganizations
            : [""],
        });
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

      // Filter out empty organizations
      const filteredOrgs = formData.admirableOrganizations.filter(
        (org) => org.trim() !== ""
      );

      // Save to database
      const response = await fetch("/api/career-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: JSON.stringify({
            ...formData,
            admirableOrganizations: filteredOrgs,
          }),
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
    <>
      {/* Progress Steps */}
      <Timeline
        count={5}
        highlight={2}
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
            <h2 className="text-xl font-bold mb-2">CAREER PROFILE</h2>
            <p className="text-sm text-slate-300">
              Complete your Career profile by uploading your CV or manually
              entering your information
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="upload">Upload CV/Resume</TabsTrigger>
                <TabsTrigger value="manual">Enter Manually</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-6">
                <FileTextExtractor
                  onReturn={handleExtractedText}
                  onprogress={progress}
                />

                <div className="flex justify-end gap-3 mt-6">
                  <Link href="/dashboard">
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
                    onClick={() => router.push("/dashboard/priorities")}
                    disabled={isProcessing || isSaving}
                  >
                    Continue to Priorities
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-6">
                <form onSubmit={handleSubmit} className="grid gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Experience Summary
                    </h3>
                    <Textarea
                      name="experienceSummary"
                      placeholder="Summarize your professional experience..."
                      className="min-h-[100px]"
                      value={formData.experienceSummary}
                      onChange={handleTextareaChange}
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Core Competencies
                    </h3>
                    <Textarea
                      name="coreCompetencies"
                      placeholder="List your key skills and competencies..."
                      className="min-h-[100px]"
                      value={formData.coreCompetencies}
                      onChange={handleTextareaChange}
                    />
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">
                      Admirable Organizations
                    </h3>
                    <p className="text-xs text-slate-500 mb-2">
                      List up to 5 organizations you would like to work for
                    </p>

                    <div className="space-y-2">
                      {formData.admirableOrganizations.map((org, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            placeholder={`Organization ${index + 1}`}
                            value={org}
                            onChange={(e) =>
                              handleOrganizationChange(index, e.target.value)
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            type="button"
                            onClick={() => removeOrganization(index)}
                            disabled={
                              formData.admirableOrganizations.length === 1
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      {formData.admirableOrganizations.length < 5 && (
                        <div className="flex items-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-teal-600"
                            type="button"
                            onClick={addOrganization}
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add another
                            organization
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <Link href="/dashboard">
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
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving..." : "Continue to Priorities"}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
