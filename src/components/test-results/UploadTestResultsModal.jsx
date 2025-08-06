import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud } from "lucide-react";

export default function UploadTestResultsModal({ isOpen, onClose }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [reportFormat, setReportFormat] = useState("junit");

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl glass-effect">
        <DialogHeader>
          <DialogTitle>Manual Test Result Upload</DialogTitle>
          <DialogDescription>
            Upload your test result files directly. For automated uploads, see the Integrations section in Settings.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-6 space-y-6">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50/50 hover:bg-slate-100/50"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-slate-400" />
                <p className="mb-2 text-sm text-slate-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-500">JUnit XML, JSON, or other supported formats</p>
                {selectedFile && (
                  <p className="mt-4 text-sm font-medium text-emerald-600">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
              <Input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <Label htmlFor="report-format">Report Format</Label>
              <Select value={reportFormat} onValueChange={setReportFormat}>
                <SelectTrigger id="report-format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junit">JUnit XML</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="testng">TestNG XML</SelectItem>
                  <SelectItem value="cucumber">Cucumber JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700" disabled={!selectedFile}>
              Upload File
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}