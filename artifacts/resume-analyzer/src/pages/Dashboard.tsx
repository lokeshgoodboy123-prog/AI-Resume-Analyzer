import { useState } from 'react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import {
  useGetDashboardStats,
  useDeleteResume,
  getGetDashboardStatsQueryKey,
  getGetResumeHistoryQueryKey
} from '@workspace/api-client-react';
import { useAuth } from '@/context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MoreVertical,
  Plus,
  FileText,
  Search,
  Trash2,
  Eye,
  TrendingUp,
  Award,
  BarChart3,
  UploadCloud
} from 'lucide-react';

function getScoreColor(score: number) {
  if (score >= 80) return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-900';
  if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-900';
  return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-900';
}

function getBarColor(score: number) {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#d97706';
  return '#dc2626';
}

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: stats, isLoading, isError } = useGetDashboardStats({
    query: {
      enabled: isAuthenticated,
      queryKey: getGetDashboardStatsQueryKey()
    }
  });

  const deleteMutation = useDeleteResume({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetResumeHistoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() });
        toast({
          title: "Analysis deleted",
          description: "The resume analysis has been removed from your history.",
        });
        setDeleteId(null);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Deletion failed",
          description: "There was an error deleting the analysis. Please try again.",
        });
        setDeleteId(null);
      }
    }
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate({ id: deleteId });
    }
  };

  const filteredHistory = stats?.recentAnalyses.filter(item => 
    item.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.jobDescription && item.jobDescription.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const chartData = [...(stats?.recentAnalyses || [])].reverse().map(item => ({
    name: format(new Date(item.uploadedAt), 'MMM d'),
    score: item.atsScore,
    fullDate: format(new Date(item.uploadedAt), 'MMM d, yyyy'),
    filename: item.filename
  }));

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-7xl">
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
          <Trash2 className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Error Loading Dashboard</h2>
        <p className="text-muted-foreground mb-6">There was a problem fetching your analytics data.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: getGetDashboardStatsQueryKey() })}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'User'}</h1>
          <p className="text-muted-foreground mt-1">Here's an overview of your resume performance.</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/upload">
            <Plus className="h-4 w-4" /> New Analysis
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyses</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAnalyses || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime resumes scanned
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average ATS Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageAtsScore ? Math.round(stats.averageAtsScore) : 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all uploads
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.highestAtsScore || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Your best performing resume
            </p>
          </CardContent>
        </Card>
      </div>

      {stats?.recentAnalyses && stats.recentAnalyses.length > 0 ? (
        <div className="grid gap-8 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Score History</CardTitle>
              <CardDescription>Your ATS scores over time</CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      dy={10}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex flex-col">
                                  <span className="text-[10px] uppercase text-muted-foreground">Date</span>
                                  <span className="font-bold text-muted-foreground">{data.name}</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[10px] uppercase text-muted-foreground">Score</span>
                                  <span className="font-bold">{data.score}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={50}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle>Recent History</CardTitle>
                <CardDescription>Your latest resume analyses</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search resumes..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-4">
                {filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No resumes found matching your search.
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Resume</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredHistory.slice(0, 5).map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium truncate max-w-[150px] sm:max-w-[200px]">{item.filename}</span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(item.uploadedAt), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className={getScoreColor(item.atsScore)}>
                                {item.atsScore}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/results/${item.id}`} className="flex items-center cursor-pointer w-full">
                                      <Eye className="mr-2 h-4 w-4" /> View Report
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteId(item.id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
              
              {filteredHistory.length > 5 && (
                <div className="mt-4 text-center">
                  <Button variant="outline" className="w-full">View All History</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center py-24 text-center bg-muted/20 border-dashed">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <UploadCloud className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-2xl mb-2">No analyses yet</CardTitle>
          <CardDescription className="max-w-md mx-auto mb-8 text-base">
            Upload your first resume to get a comprehensive ATS score, keyword breakdown, and actionable improvement tips.
          </CardDescription>
          <Button size="lg" asChild>
            <Link href="/upload">
              <Plus className="mr-2 h-5 w-5" /> Analyze My Resume
            </Link>
          </Button>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this resume analysis from our servers. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
