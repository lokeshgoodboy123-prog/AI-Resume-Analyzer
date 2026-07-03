import { useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { UploadCloud, File, FileText, X, AlertCircle, Sparkles } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function Upload() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File) => {
    setError(null);
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a PDF or DOCX file.');
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum size is 5MB.');
      return false;
    }
    return true;
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setProgress(10);
    setError(null);

    // Simulate progress while uploading/analyzing
    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p < 90) return p + Math.random() * 10;
        return p;
      });
    }, 500);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);
      if (jobDescription.trim()) {
        formData.append('jobDescription', jobDescription.trim());
      }

      const res = await fetch('/api/resumes/upload', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}` 
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed with status ${res.status}`);
      }

      clearInterval(progressInterval);
      setProgress(100);
      
      const data = await res.json();
      
      toast({
        title: "Analysis complete",
        description: "Your resume has been successfully analyzed.",
      });
      
      setTimeout(() => {
        setLocation(`/results/${data.id}`);
      }, 500);

    } catch (err: any) {
      clearInterval(progressInterval);
      setIsUploading(false);
      setProgress(0);
      setError(err.message || 'An error occurred during upload and analysis. Please try again.');
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err.message || "An unexpected error occurred.",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Analysis</h1>
        <p className="text-muted-foreground mt-1">Upload your resume and the job description to get started.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <Card className={isDragging ? "border-primary shadow-md ring-1 ring-primary/50" : ""}>
            <CardHeader>
              <CardTitle>1. Upload Resume</CardTitle>
              <CardDescription>We support PDF and DOCX files up to 5MB.</CardDescription>
            </CardHeader>
            <CardContent>
              {!file ? (
                <div 
                  className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center transition-colors ${
                    isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                  }`}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                >
                  <UploadCloud className={`h-12 w-12 mb-4 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                  <p className="mb-2 font-medium">Drag & drop your file here</p>
                  <p className="text-xs text-muted-foreground mb-6">or</p>
                  <Button variant="secondary" onClick={() => document.getElementById('file-upload')?.click()}>
                    Browse Files
                  </Button>
                  <input 
                    id="file-upload" 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                    onChange={handleFileSelect}
                  />
                </div>
              ) : (
                <div className="border rounded-lg p-6 flex items-center justify-between bg-muted/20">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center text-primary">
                      {file.name.endsWith('.pdf') ? <FileText className="h-6 w-6" /> : <File className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="font-medium max-w-[200px] truncate" title={file.name}>{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  {!isUploading && (
                    <Button variant="ghost" size="icon" onClick={clearFile} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>2. Target Job Description</span>
                <span className="text-xs font-normal bg-muted px-2 py-1 rounded-full">Optional</span>
              </CardTitle>
              <CardDescription>Paste the job posting to get keyword matching and targeted advice.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="job-desc" className="sr-only">Job Description</Label>
                <Textarea 
                  id="job-desc"
                  placeholder="Paste the full job description here..."
                  className="min-h-[200px] resize-y"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  disabled={isUploading}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="h-full flex flex-col sticky top-24">
            <CardHeader>
              <CardTitle>Ready to Analyze</CardTitle>
              <CardDescription>Our AI will scan your resume against industry standards and your target role.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">1</div>
                  <div>
                    <h4 className="font-medium">Information Extraction</h4>
                    <p className="text-sm text-muted-foreground">Parsing skills, experience, and education format.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">2</div>
                  <div>
                    <h4 className="font-medium">ATS Simulation</h4>
                    <p className="text-sm text-muted-foreground">Scoring readability and keyword match rate.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">3</div>
                  <div>
                    <h4 className="font-medium">AI Feedback Generation</h4>
                    <p className="text-sm text-muted-foreground">Creating personalized suggestions to improve your impact.</p>
                  </div>
                </div>
              </div>

              {isUploading && (
                <div className="mt-10 space-y-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Analyzing...</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center animate-pulse mt-2">
                    {progress < 30 ? "Extracting text..." : 
                     progress < 60 ? "Simulating ATS scan..." : 
                     progress < 90 ? "Generating AI suggestions..." : 
                     "Finalizing report..."}
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                size="lg" 
                className="w-full h-14 text-base" 
                onClick={handleUpload}
                disabled={!file || isUploading}
              >
                {isUploading ? (
                  <>
                    <Sparkles className="mr-2 h-5 w-5 animate-pulse" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Analyze Resume
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}