import { Layout } from "@/components/layout";
import { useParams, Link, useLocation } from "wouter";
import { useGetJob, useApproveJob, useRejectJob, getGetJobQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { RiskScore } from "@/components/ui/risk-score";
import { ChevronLeft, Check, X, ShieldAlert, AlertTriangle, ExternalLink, PlaySquare, FileText, Settings, Volume2 } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function JobDetail() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const id = params.id || "";

  const { data: job, isLoading } = useGetJob(id, { query: { enabled: !!id, queryKey: getGetJobQueryKey(id) } });
  
  const approveJob = useApproveJob();
  const rejectJob = useRejectJob();

  const handleAction = (action: 'approve' | 'reject') => {
    const mutation = action === 'approve' ? approveJob : rejectJob;
    mutation.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetJobQueryKey(id) });
          toast({
            title: `Job ${action === 'approve' ? 'Approved' : 'Rejected'}`,
            description: `The video has been ${action === 'approve' ? 'approved for publishing' : 'rejected'}.`
          });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="h-full flex items-center justify-center font-mono text-muted-foreground uppercase tracking-widest animate-pulse">
          Loading Analysis Data...
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="h-full flex items-center justify-center font-mono text-destructive uppercase tracking-widest">
          Job Not Found
        </div>
      </Layout>
    );
  }

  const categoryIcons = {
    visual: ShieldAlert,
    audio: Volume2,
    metadata: FileText,
    contextual: Settings
  };

  const severityColors = {
    low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    critical: "bg-destructive/10 text-destructive border-destructive/20"
  };

  const isPendingReview = job.status === 'flagged' || job.status === 'completed';

  return (
    <Layout>
      <div className="space-y-6 max-w-[1600px] mx-auto pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/jobs">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
                <StatusBadge status={job.status} />
              </div>
              <p className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
                ID: {job.id} • {format(new Date(job.createdAt), "yyyy-MM-dd HH:mm:ss")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {job.youtubeUrl && (
              <Button variant="outline" size="sm" className="font-mono text-xs uppercase" asChild>
                <a href={job.youtubeUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" /> Source
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Top Section - Metadata & Score */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-card border-border overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
            <CardContent className="p-6 relative z-10 flex gap-6">
              <div className="w-64 h-36 bg-muted rounded-lg border border-border overflow-hidden flex-shrink-0 relative group">
                {job.thumbnailUrl ? (
                   <img src={job.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PlaySquare className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 backdrop-blur rounded text-xs font-mono text-white">
                  {job.duration ? `${Math.floor(job.duration / 60)}:${(job.duration % 60).toString().padStart(2, '0')}` : '--:--'}
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                <div>
                   <h3 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">Analysis Stage</h3>
                   <div className="font-mono text-primary bg-primary/10 px-3 py-1.5 rounded inline-block uppercase text-sm border border-primary/20">
                     {job.analysisStage || 'COMPLETED'}
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase mb-1">Created</p>
                    <p className="text-sm">{format(new Date(job.createdAt), "MMM d, yyyy HH:mm")}</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-muted-foreground uppercase mb-1">Last Updated</p>
                    <p className="text-sm">{format(new Date(job.updatedAt), "MMM d, yyyy HH:mm")}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border flex flex-col items-center justify-center p-6 relative overflow-hidden">
             {/* Animated score ring background */}
             <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                <div className={cn(
                  "w-48 h-48 rounded-full border-8 border-dashed animate-[spin_10s_linear_infinite]",
                  job.riskScore >= 70 ? "border-destructive" : job.riskScore >= 30 ? "border-orange-500" : "border-green-500"
                )} />
             </div>
             
             <div className="relative z-10 text-center">
               <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">System Risk Assessment</p>
               <RiskScore score={job.riskScore} size="xl" className="justify-center mb-2" />
               <p className="text-sm text-muted-foreground max-w-[200px] mt-4">
                 {job.riskScore >= 70 ? "Critical policy violations detected. Immediate action required." : 
                  job.riskScore >= 30 ? "Borderline content flagged for manual review." : 
                  "Clean analysis. No significant violations detected."}
               </p>
             </div>
          </Card>
        </div>

        {/* Violations Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-mono uppercase tracking-widest text-foreground font-bold flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-primary" /> Detected Violations
            <span className="ml-3 px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
              {job.violations?.length || 0}
            </span>
          </h2>
          
          {job.violations && job.violations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {job.violations.map((violation, i) => {
                const Icon = categoryIcons[violation.category as keyof typeof categoryIcons] || ShieldAlert;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={violation.id}
                  >
                    <Card className="bg-card/50 border-border hover:border-primary/50 transition-colors h-full flex flex-col">
                      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-muted rounded">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="text-xs font-mono uppercase text-muted-foreground">{violation.category}</span>
                        </div>
                        <span className={cn("text-[10px] font-mono uppercase px-2 py-0.5 rounded border", severityColors[violation.severity as keyof typeof severityColors])}>
                          {violation.severity}
                        </span>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 flex-1 flex flex-col">
                        <h4 className="font-bold text-sm mb-2">{violation.rule}</h4>
                        <p className="text-xs text-muted-foreground mb-4 flex-1 line-clamp-3">
                          {violation.description}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-border/50">
                          <div>
                            <p className="text-[10px] font-mono text-muted-foreground uppercase">Confidence</p>
                            <p className="text-sm font-mono">{(violation.confidence * 100).toFixed(1)}%</p>
                          </div>
                          {violation.timestampStart !== null && violation.timestampStart !== undefined && (
                            <div>
                              <p className="text-[10px] font-mono text-muted-foreground uppercase">Timestamp</p>
                              <p className="text-sm font-mono text-primary">
                                {Math.floor(violation.timestampStart / 60)}:{(violation.timestampStart % 60).toString().padStart(2, '0')}
                                {violation.timestampEnd ? ` - ${Math.floor(violation.timestampEnd / 60)}:{(violation.timestampEnd % 60).toString().padStart(2, '0')}` : ''}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {violation.autoFixAvailable && (
                          <div className="mt-3 px-2 py-1 bg-primary/10 border border-primary/20 text-primary text-[10px] uppercase font-mono rounded flex items-center">
                            <Check className="w-3 h-3 mr-1" /> Auto-fix Available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <Card className="bg-card/30 border-border border-dashed">
              <CardContent className="p-12 text-center">
                <ShieldAlert className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground font-mono uppercase tracking-widest text-sm">No policy violations detected</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Bar (Sticky Bottom) */}
        {isPendingReview && (
          <div className="fixed bottom-0 left-64 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-50 flex justify-between items-center px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
             <div className="flex items-center gap-4">
               <AlertTriangle className="w-5 h-5 text-orange-500" />
               <div>
                 <p className="text-sm font-bold">Manual Review Required</p>
                 <p className="text-xs text-muted-foreground">Please approve or reject this job to close the queue item.</p>
               </div>
             </div>
             
             <div className="flex gap-4">
               <Button 
                 variant="outline" 
                 className="w-40 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground font-mono uppercase tracking-wider"
                 onClick={() => handleAction('reject')}
                 disabled={rejectJob.isPending || approveJob.isPending}
               >
                 <X className="w-4 h-4 mr-2" /> Reject
               </Button>
               <Button 
                 className="w-40 bg-green-600 hover:bg-green-700 text-white font-mono uppercase tracking-wider"
                 onClick={() => handleAction('approve')}
                 disabled={rejectJob.isPending || approveJob.isPending}
               >
                 <Check className="w-4 h-4 mr-2" /> Approve
               </Button>
             </div>
          </div>
        )}
      </div>
    </Layout>
  );
}