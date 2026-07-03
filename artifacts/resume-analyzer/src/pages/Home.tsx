import { Link } from 'wouter';
import { ArrowRight, CheckCircle2, UploadCloud, FileSearch, TrendingUp, BarChart3, BrainCircuit, Users, ShieldCheck, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function Home() {
  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background pt-24 pb-32 lg:pt-36 lg:pb-40">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" style={{ backgroundSize: '30px 30px' }}></div>
        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20 mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            GPT-4 Powered Analysis
          </div>
          <h1 className="mx-auto max-w-4xl font-display text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Stop Guessing. Start <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Landing Interviews.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-muted-foreground sm:text-xl">
            Upload your resume and the job description. Our AI analyzes your fit, identifies missing keywords, and gives you actionable feedback to beat the ATS and impress human recruiters.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" className="h-12 px-8 text-base shadow-lg" asChild>
              <Link href="/register">
                Analyze My Resume <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
              <Link href="/login">View Sample Report</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
            <div>
              <p className="text-4xl font-bold text-foreground">98%</p>
              <p className="text-sm text-muted-foreground mt-1">ATS Match Accuracy</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-foreground">3x</p>
              <p className="text-sm text-muted-foreground mt-1">More Interviews</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-foreground">50k+</p>
              <p className="text-sm text-muted-foreground mt-1">Resumes Analyzed</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-foreground">15s</p>
              <p className="text-sm text-muted-foreground mt-1">Average Analysis Time</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground">Three simple steps to a flawless resume.</p>
          </div>
          
          <div className="grid gap-12 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
                <UploadCloud className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Upload Resume</h3>
              <p className="text-muted-foreground">Upload your current PDF or DOCX resume. Optionally paste the job description you are targeting.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
                <BrainCircuit className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">2. AI Analysis</h3>
              <p className="text-muted-foreground">Our advanced AI parses your experience, compares it against industry standards and the job role.</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">3. Optimize & Apply</h3>
              <p className="text-muted-foreground">Get an exact ATS score, missing keywords, and section-by-section improvement suggestions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Detail */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">See Exactly Why You're Getting Rejected</h2>
              <p className="text-lg text-muted-foreground mb-8">Applicant Tracking Systems filter out up to 75% of resumes before a human ever sees them. Our platform shows you what the ATS sees.</p>
              
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm border">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Missing Keyword Detection</h4>
                    <p className="text-muted-foreground mt-1">We identify the exact skills and terms you're missing from the job description.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm border">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Impact Scoring</h4>
                    <p className="text-muted-foreground mt-1">We analyze your bullet points to ensure they focus on measurable achievements, not just duties.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background shadow-sm border">
                    <FileSearch className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Formatting Checks</h4>
                    <p className="text-muted-foreground mt-1">Ensure your layout is machine-readable so nothing gets lost in translation.</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-blue-500/20 blur-3xl rounded-full"></div>
              <div className="relative rounded-xl border bg-background shadow-2xl overflow-hidden aspect-[4/3] flex items-center justify-center p-8">
                {/* Simulated UI Card for visual appeal */}
                <div className="w-full max-w-md bg-card rounded-lg border shadow-sm p-6 space-y-6">
                  <div className="flex justify-between items-center border-b pb-4">
                    <div className="h-4 w-32 bg-muted rounded"></div>
                    <div className="h-8 w-16 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold text-xs">84 / 100</div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-muted rounded"></div>
                    <div className="h-3 w-5/6 bg-muted rounded"></div>
                    <div className="h-3 w-4/6 bg-muted rounded"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 w-20 bg-destructive/10 rounded text-[10px] flex items-center justify-center text-destructive font-medium border border-destructive/20">Missing: React</div>
                    <div className="h-6 w-24 bg-destructive/10 rounded text-[10px] flex items-center justify-center text-destructive font-medium border border-destructive/20">Missing: Node.js</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Success Stories</h2>
            <p className="mt-4 text-lg text-muted-foreground">Join thousands of professionals landing their dream roles.</p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex text-amber-500 mb-4">
                {'★★★★★'.split('').map((_, i) => <span key={i}>★</span>)}
              </div>
              <p className="text-foreground mb-6">"I applied to 50 jobs with no response. After using AI Resume Analyzer to optimize for ATS keywords, I got 4 interviews in two weeks and landed a Senior PM role."</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">SJ</div>
                <div>
                  <p className="text-sm font-bold text-foreground">Sarah J.</p>
                  <p className="text-xs text-muted-foreground">Product Manager</p>
                </div>
              </div>
            </div>
            
            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex text-amber-500 mb-4">
                {'★★★★★'.split('').map((_, i) => <span key={i}>★</span>)}
              </div>
              <p className="text-foreground mb-6">"The missing keyword detection is a game-changer. I didn't realize I was calling my skills by slightly different names than what the system was looking for."</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">MR</div>
                <div>
                  <p className="text-sm font-bold text-foreground">Michael R.</p>
                  <p className="text-xs text-muted-foreground">Software Engineer</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex text-amber-500 mb-4">
                {'★★★★★'.split('').map((_, i) => <span key={i}>★</span>)}
              </div>
              <p className="text-foreground mb-6">"As a career switcher, I struggled to frame my past experience. The AI suggested exactly how to rewrite my bullet points to highlight transferable skills."</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">AK</div>
                <div>
                  <p className="text-sm font-bold text-foreground">Amanda K.</p>
                  <p className="text-xs text-muted-foreground">Data Analyst</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-left font-medium">How accurate is the ATS scoring?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Our system mimics the behavior of major ATS platforms like Workday, Greenhouse, and Taleo. We analyze exact keyword matches, structural readability, and contextual semantics to provide a score that highly correlates with human recruiter pass rates.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-left font-medium">Is my data secure and private?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Yes. We use industry-standard encryption for all uploads. Your resumes are only used for your personal analysis and are never shared with third parties or employers without your explicit consent. You can delete your data at any time.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger className="text-left font-medium">Can it analyze my resume without a job description?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Absolutely. While providing a job description allows for a highly targeted match score and specific keyword analysis, uploading just your resume will still provide comprehensive feedback on formatting, impact, grammar, and general best practices.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger className="text-left font-medium">What file formats are supported?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                Currently, we support PDF and DOCX files. PDF is highly recommended as it preserves your exact formatting, allowing our system to verify that the ATS can accurately parse your text blocks.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">Ready to perfect your resume?</h2>
          <p className="text-primary-foreground/80 text-lg mb-10 max-w-2xl mx-auto">
            Stop sending your resume into a black hole. Get the insights you need to stand out.
          </p>
          <Button size="lg" variant="secondary" className="h-14 px-10 text-lg shadow-xl" asChild>
            <Link href="/register">Start Analyzing Now</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
