"use client";
import { useState, useEffect } from "react";
import Dropzone from "react-dropzone";
import { Cloud, File, FileImage } from "lucide-react";
import { createWorker } from "tesseract.js";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import { Progress } from "./ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

const FileTextExtractor = ({
  onReturn,
  onprogress,
}: {
  onReturn: (text: string) => void;
  onprogress: number;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setloading] = useState(false);
  const [progress, setprogress] = useState(0);
  useEffect(() => {
    GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js";
  }, []);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await getDocument({ data: new Uint8Array(arrayBuffer) })
        .promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
          .map((item) => {
            if (item && "str" in item) {
              return item.str;
            }
            return "";
          })
          .join(" ");

        fullText += pageText + " ";
      }

      return fullText;
    } catch (error) {
      console.error(error);
      return "";
    }
  };

  const extractTextFromImage = async (file: File) => {
    const worker = await createWorker("eng");
    const imageUrl = URL.createObjectURL(file);
    const {
      data: { text },
    } = await worker.recognize(imageUrl);
    await worker.terminate();

    return text;
  };

  const processFiles = async (files: File[]) => {
    try {
      let allText = "";

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        let fileText = "";

        if (file.type === "application/pdf") {
          fileText = await extractTextFromPdf(file);
        } else if (file.type.startsWith("image/")) {
          fileText = await extractTextFromImage(file);
        }
        setprogress(60);

        allText += fileText + "\n\n";

        onReturn(allText);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setloading(true);
      setprogress(0);
      setFiles((prevFiles: File[]) => [...prevFiles, ...acceptedFiles]);
      setprogress(30);
      await processFiles(acceptedFiles);
      setprogress(70);

      setloading(false);
      setprogress(onprogress);
    }
  };

  return (
    <div className="w-full">
      {!loading && files.length === 0 && (
        <Dropzone
          accept={{
            "application/pdf": [".pdf"],
            "image/*": [".png", ".gif", ".jpeg", ".jpg"],
          }}
          multiple={true}
          onDrop={handleDrop}
          disabled={loading}
        >
          {({ getRootProps, getInputProps }) => (
            <div
              {...getRootProps()}
              className={`border h-64 m-4 border-dashed border-gray-300 rounded-md ${
                loading ? "opacity-50" : ""
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex items-center justify-center h-full w-full">
                <label
                  htmlFor="dropzone-file"
                  className="flex flex-col items-center justify-center w-full h-full rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Cloud className="h-6 w-6 text-zinc-500 mb-2" />
                    <p className="mb-2 text-sm text-zinc-700">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-zinc-500">PDF or Image</p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </Dropzone>
      )}

      {/* Upload Progress */}
      {loading && (
        <div className="mx-4 mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-zinc-700">
              Uploading files...
            </span>
            <span className="text-sm font-medium text-zinc-700">
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <Card className="mx-4">
          <CardHeader className="py-3">
            <CardTitle className="text-sm">
              Uploaded Files ({files.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-64 overflow-y-auto">
              <ul className="divide-y divide-gray-200">
                {files.map((file, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between py-3 px-4"
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-md flex items-center justify-center">
                        {file.type.includes("pdf") ? (
                          <File className="h-5 w-5 text-gray-500" />
                        ) : (
                          <FileImage className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {file.name}
                        </p>
                      </div>
                    </div>
                    {/* <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button> */}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileTextExtractor;
