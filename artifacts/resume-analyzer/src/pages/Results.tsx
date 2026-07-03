import { useState } from 'react';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { useGetAnalysis, getGetAnalysisQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  RadialBarChart, 
  RadialBar, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  MessageSquare,
  TrendingUp,
  BrainCircuit,
  Award
} from 'lucide-react';

export default function Results({ id }: { id: string }) {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: report, isLoading, isError } = useGetAnalysis(id, {
    query: {
      enabled: !!id,
      queryKey: getGetAnalysisQueryKey(id)
    }
  });

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-6xl space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="md:col-span-1">
            <CardContent className="p-6 pt-8 flex justify-center">
              <Skeleton className="h-48 w-48 rounded-full" />
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="container mx-auto p-8 text-center max-w-md mt-20">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Analysis Not Found</h2>
        <p className="text-muted-foreground mb-6">We couldn't find the resume analysis you're looking for. It may have been deleted or the link is invalid.</p>
        <Button onClick={() => setLocation('/dashboard')}>Return to Dashboard</Button>
      </div>
    );
  }

  const ai = report.aiAnalysis || {};
  const extracted = report.extractedInfo || {};
  const score = report.atsScore;

  // Chart data setup
  const chartColor = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';
  const chartData = [{ name: 'Score', value: score, fill: chartColor }];

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl space-y-8 print:p-0 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Analysis Results
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" />
              {report.filename} • Analyzed on {format(new Date(report.uploadedAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        <Button onClick={handlePrint} variant="secondary" className="gap-2">
          <Download className="h-4 w-4" /> Download Report
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Score & Extracted Info */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className={`h-2 w-full ${score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} />
            <CardHeader className="text-center pb-0">
              <CardTitle>Overall ATS Score</CardTitle>
              <CardDescription>Match against industry standards</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-4">
              <div className="h-48 w-full max-w-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" cy="50%" 
                    innerRadius="70%" outerRadius="100%" 
                    barSize={15} 
                    data={chartData} 
                    startAngle={210} endAngle={-30}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                    <RadialBar 
                      background={{ fill: 'hsl(var(--muted))' }} 
                      dataKey="value" 
                      cornerRadius={10} 
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold tracking-tighter" style={{ color: chartColor }}>{score}</span>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">/ 100</span>
                </div>
              </div>
              <div className="text-center mt-2">
                <p className="font-medium text-foreground">
                  {score >= 80 ? 'Excellent Match' : score >= 60 ? 'Good Potential' : 'Needs Improvement'}
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                  {score >= 80 ? "Your resume is highly optimized and likely to pass ATS screening." : 
                   score >= 60 ? "Your resume is solid but missing key formatting or keywords." : 
                   "Your resume needs significant changes to reliably pass ATS filters."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Extracted Information</CardTitle>
              <CardDescription>What the ATS successfully read</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs uppercase tracking-wider">Contact</span>
                <p className="font-medium">{extracted.name || 'Not detected'}</p>
                <p className="text-muted-foreground">{extracted.email || 'Not detected'}</p>
                <p className="text-muted-foreground">{extracted.phone || 'Not detected'}</p>
              </div>
              
              {extracted.skills && extracted.skills.length > 0 && (
                <div className="space-y-2 pt-2">
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">Detected Skills</span>
                  <div className="flex flex-wrap gap-1">
                    {extracted.skills.slice(0, 10).map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-normal">{skill}</Badge>
                    ))}
                    {extracted.skills.length > 10 && (
                      <Badge variant="outline" className="text-xs font-normal">+{extracted.skills.length - 10} more</Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Analysis Tabs */}
        <div className="md:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 print:hidden">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="improvements">Improvements</TabsTrigger>
              <TabsTrigger value="career">Career AI</TabsTrigger>
              <TabsTrigger value="interview">Interview</TabsTrigger>
            </TabsList>
            
            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BrainCircuit className="h-5 w-5 text-primary" /> AI Professional Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {ai.professionalSummary || "Not enough information to generate a summary."}
                  </p>
                </CardContent>
              </Card>

              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="border-green-200 bg-green-50/30 dark:border-green-900/50 dark:bg-green-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-green-700 dark:text-green-500">
                      <CheckCircle2 className="h-4 w-4" /> Strong Sections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {ai.strongSections?.map((section, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-green-600 mt-0.5">•</span> 
                          <span className="text-muted-foreground">{section}</span>
                        </li>
                      )) || <li className="text-sm text-muted-foreground">None identified.</li>}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-amber-200 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-amber-700 dark:text-amber-500">
                      <AlertTriangle className="h-4 w-4" /> Weak Sections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {ai.weakSections?.map((section, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-amber-600 mt-0.5">•</span> 
                          <span className="text-muted-foreground">{section}</span>
                        </li>
                      )) || <li className="text-sm text-muted-foreground">None identified.</li>}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {ai.missingKeywords && ai.missingKeywords.length > 0 && (
                <Card className="border-destructive/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-destructive" /> Missing Keywords
                    </CardTitle>
                    <CardDescription>Terms commonly found in job descriptions for this profile but missing from your resume.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {ai.missingKeywords.map((keyword, i) => (
                        <Badge key={i} variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* IMPROVEMENTS TAB */}
            <TabsContent value="improvements" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" /> Actionable Improvements
                  </CardTitle>
                  <CardDescription>Specific suggestions to increase your ATS score and human readability.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Accordion type="multiple" className="w-full">
                    {ai.formattingSuggestions && ai.formattingSuggestions.length > 0 && (
                      <AccordionItem value="formatting" className="px-6">
                        <AccordionTrigger className="hover:no-underline font-semibold">
                          Formatting & Layout
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-3 pt-2">
                            {ai.formattingSuggestions.map((item, i) => (
                              <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                    
                    {ai.actionVerbSuggestions && ai.actionVerbSuggestions.length > 0 && (
                      <AccordionItem value="verbs" className="px-6">
                        <AccordionTrigger className="hover:no-underline font-semibold">
                          Action Verbs & Impact
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-3 pt-2">
                            {ai.actionVerbSuggestions.map((item, i) => (
                              <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    )}

                    {ai.keywordOptimizationTips && ai.keywordOptimizationTips.length > 0 && (
                      <AccordionItem value="keywords" className="px-6 border-b-0">
                        <AccordionTrigger className="hover:no-underline font-semibold">
                          Keyword Optimization
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-3 pt-2">
                            {ai.keywordOptimizationTips.map((item, i) => (
                              <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                </CardContent>
              </Card>

              {ai.grammarSuggestions && ai.grammarSuggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Grammar & Phrasing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {ai.grammarSuggestions.map((suggestion, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 bg-muted/30 p-3 rounded-md border border-muted">
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" /> 
                          <span className="text-muted-foreground">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* CAREER TAB */}
            <TabsContent value="career" className="space-y-6 mt-6">
              {ai.jobRoles && ai.jobRoles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" /> Recommended Job Roles
                    </CardTitle>
                    <CardDescription>Based on your experience and skills, you are a strong match for:</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {ai.jobRoles.map((role, i) => (
                        <div key={i} className="flex items-center gap-3 bg-muted/40 p-3 rounded-lg border">
                          <div className="h-8 w-8 rounded bg-background shadow-sm border flex items-center justify-center shrink-0 text-primary font-medium text-xs">
                            #{i+1}
                          </div>
                          <span className="font-medium text-sm">{role}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid sm:grid-cols-2 gap-6">
                {ai.technicalSkillSuggestions && ai.technicalSkillSuggestions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" /> Technical Skills to Learn
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {ai.technicalSkillSuggestions.map((skill, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                            <span className="text-muted-foreground">{skill}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {ai.softSkillSuggestions && ai.softSkillSuggestions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" /> Soft Skills to Highlight
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {ai.softSkillSuggestions.map((skill, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary/60 mt-1.5 shrink-0" />
                            <span className="text-muted-foreground">{skill}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              {ai.careerSuggestions && ai.careerSuggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Strategic Career Advice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      {ai.careerSuggestions.map((suggestion, i) => (
                        <li key={i} className="text-sm flex gap-3">
                          <Award className="h-5 w-5 text-primary shrink-0" /> 
                          <span className="text-muted-foreground leading-relaxed">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* INTERVIEW TAB */}
            <TabsContent value="interview" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" /> Likely Interview Questions
                  </CardTitle>
                  <CardDescription>Based on your specific resume content, prepare for these questions:</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {ai.interviewQuestions?.map((question, i) => (
                      <div key={i} className="p-4 rounded-lg border bg-muted/20 relative pl-10">
                        <span className="absolute left-4 top-4 text-muted-foreground/40 font-serif text-3xl leading-none">"</span>
                        <p className="text-sm font-medium relative z-10 text-foreground">{question}</p>
                      </div>
                    )) || (
                      <p className="text-sm text-muted-foreground">No specific interview questions generated.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Need to define Users icon since it wasn't imported at top
function Users(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}