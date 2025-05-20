import Link from "next/link"
import { UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function UploadDocuments() {
  return (
    <>
      {/* Main Content Card */}
      <Card className="border-none shadow-md">
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-6 bg-[#274754] text-white">
            <h2 className="text-xl font-bold mb-2">UPLOAD DOCUMENTS</h2>
            <p className="text-sm text-slate-300">Upload important documents for your career search journey</p>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-4">Upload CV/Resume</h3>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UploadCloud className="h-12 w-12 text-slate-300" />
                    <p className="text-sm text-slate-500">Drag and drop your file here or</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Browse Files
                    </Button>
                    <p className="text-xs text-slate-400 mt-2">Supported files: PDF,DOC,DOCX</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Upload Forte Assessment</h3>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UploadCloud className="h-12 w-12 text-slate-300" />
                    <p className="text-sm text-slate-500">Drag and drop your file here or</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Browse Files
                    </Button>
                    <p className="text-xs text-slate-400 mt-2">Supported files: PDF,DOC,DOCX</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Upload Priorities Document</h3>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UploadCloud className="h-12 w-12 text-slate-300" />
                    <p className="text-sm text-slate-500">Drag and drop your file here or</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Browse Files
                    </Button>
                    <p className="text-xs text-slate-400 mt-2">Supported files: PDF,DOC,DOCX,XLS,XLSX</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Upload Additional Documents</h3>
                <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UploadCloud className="h-12 w-12 text-slate-300" />
                    <p className="text-sm text-slate-500">Drag and drop your file here or</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Browse Files
                    </Button>
                    <p className="text-xs text-slate-400 mt-2">Supported files: PDF,DOC,DOCX,PPT,PPTX,XLS,XLSX</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Link href="/dashboard/results">
                  <Button variant="outline">Back to Results</Button>
                </Link>
                <Button style={{ backgroundColor: "#0d9488" }}>Done</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
