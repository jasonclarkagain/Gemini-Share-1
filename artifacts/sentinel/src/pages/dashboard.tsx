import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Layout } from "@/components/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { 
  useGetDashboardStats, 
  useGetRecentActivity,
  useGetRiskDistribution,
  useGetViolationBreakdown,
  useCreateJob,
  getListJobsQueryKey
} from "@workspace/api-client-react";
import { Activity, ShieldAlert, ListVideo, AlertTriangle, PlaySquare, BarChart3, Plus, ArrowRight } from "lucide-react";
import { RiskScore } from "@/components/ui/risk-score";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDistanceToNow } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Cell as PieCell } from "recharts";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  url: z.string().url("Must be a valid URL").min(1, "URL is required")
});

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity({ limit: 10 });
  const { data: riskDistribution } = useGetRiskDistribution();
  const { data: violationBreakdown } = useGetViolationBreakdown();

  const createJob = useCreateJob();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: "" }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createJob.mutate(
      { data: { title: "New Analysis Job", youtubeUrl: values.url } },
      {
        onSuccess: () => {
          form.reset();
          queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
          toast({
            title: "Job Submitted",
            description: "Video has been added to the processing queue.",
          });
        },
        onError: () => {
          toast({
            title: "Submission Failed",
            description: "Could not submit video for analysis.",
            variant: "destructive"
          });
        }
      }
    );
  };

  const COLORS = ['#00e6e6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <Layout>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-mono uppercase tracking-widest text-primary font-bold">NOC Dashboard</h1>
          
          <div className="bg-card border border-border p-2 rounded-lg flex items-center w-96">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex w-full gap-2">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem className="flex-1 space-y-0">
                      <FormControl>
                        <Input 
                          placeholder="Paste YouTube URL to analyze..." 
                          className="font-mono text-xs border-none bg-background/50 h-8"
                          {...field} 
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  size="sm" 
                  className="h-8 uppercase tracking-widest font-mono text-xs"
                  disabled={createJob.isPending}
                >
                  {createJob.isPending ? "INIT..." : "SUBMIT"}
                </Button>
              </form>
            </Form>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 backdrop-blur border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Total Jobs</p>
                  <h3 className="text-3xl font-bold text-foreground mt-2">{statsLoading ? "--" : stats?.totalJobs}</h3>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center text-primary">
                  <ListVideo className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Pending Review</p>
                  <h3 className="text-3xl font-bold text-orange-500 mt-2">{statsLoading ? "--" : stats?.pendingReview}</h3>
                </div>
                <div className="w-10 h-10 bg-orange-500/10 rounded flex items-center justify-center text-orange-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-destructive/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Flagged Today</p>
                  <h3 className="text-3xl font-bold text-destructive mt-2">{statsLoading ? "--" : stats?.flaggedToday}</h3>
                </div>
                <div className="w-10 h-10 bg-destructive/10 rounded flex items-center justify-center text-destructive">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Avg Risk Score</p>
                  <h3 className="text-3xl font-bold text-foreground mt-2">{statsLoading ? "--" : stats?.avgRiskScore}</h3>
                </div>
                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center text-muted-foreground">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2 border-b border-border/50">
                  <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" /> Risk Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 h-[250px]">
                  {riskDistribution && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={riskDistribution}>
                        <XAxis dataKey="label" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                          cursor={{ fill: 'hsl(var(--muted))' }}
                        />
                        <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                          {riskDistribution.map((entry, index) => {
                            const isHigh = parseInt(entry.range.split('-')[0]) >= 70;
                            const isMed = parseInt(entry.range.split('-')[0]) >= 30;
                            return (
                              <Cell key={`cell-${index}`} fill={isHigh ? 'hsl(var(--destructive))' : isMed ? '#f59e0b' : 'hsl(var(--primary))'} />
                            );
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2 border-b border-border/50">
                  <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center">
                    <ShieldAlert className="w-4 h-4 mr-2" /> Violations by Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 h-[250px]">
                  {violationBreakdown && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={violationBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="count"
                          nameKey="category"
                        >
                          {violationBreakdown.map((entry, index) => (
                            <PieCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Quick Actions / Link to full jobs */}
            <Card className="bg-card border-border overflow-hidden">
               <div className="p-6 flex items-center justify-between bg-gradient-to-r from-primary/10 to-transparent">
                 <div>
                   <h3 className="text-lg font-mono font-bold uppercase tracking-wider">Job Queue</h3>
                   <p className="text-sm text-muted-foreground">Manage and review all incoming analysis requests.</p>
                 </div>
                 <Link href="/jobs">
                   <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                     View All Jobs <ArrowRight className="w-4 h-4 ml-2" />
                   </Button>
                 </Link>
               </div>
            </Card>
          </div>

          {/* Activity Feed */}
          <Card className="bg-card border-border flex flex-col">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center">
                <Activity className="w-4 h-4 mr-2" /> Live Event Feed
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-auto">
              <div className="divide-y divide-border/50">
                {activityLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground font-mono">Loading events...</div>
                ) : activity?.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground font-mono">No recent activity</div>
                ) : (
                  activity?.map((event) => (
                    <div key={event.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-xs font-mono text-primary uppercase">{event.eventType}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <Link href={`/jobs/${event.jobId}`}>
                        <p className="text-sm text-foreground font-medium hover:underline cursor-pointer truncate">
                          {event.jobTitle}
                        </p>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{event.message}</p>
                      {event.riskScore !== undefined && event.riskScore !== null && (
                        <div className="mt-2">
                           <RiskScore score={event.riskScore} size="sm" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}