import { Layout } from "@/components/layout";
import { useListJobs } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { RiskScore } from "@/components/ui/risk-score";
import { format } from "date-fns";
import { Link } from "wouter";
import { useState } from "react";
import { Search, Filter, PlaySquare } from "lucide-react";
import { motion } from "framer-motion";

export default function Jobs() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  
  const { data: jobs, isLoading } = useListJobs({ 
    status: statusFilter !== 'all' ? statusFilter as any : undefined 
  });

  const filteredJobs = jobs?.filter(job => 
    job.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6 max-w-[1600px] mx-auto h-full flex flex-col">
        <div>
          <h1 className="text-3xl font-mono uppercase tracking-widest text-primary font-bold mb-2">Job Queue</h1>
          <p className="text-muted-foreground">Manage and review incoming analysis requests.</p>
        </div>

        <Card className="bg-card border-border flex-1 flex flex-col min-h-0">
          <CardHeader className="border-b border-border/50 py-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search jobs by title..." 
                  className="pl-9 font-mono text-sm bg-background/50 border-border"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] font-mono text-sm bg-background/50">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Video</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Stage</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground text-right">Risk Score</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center p-8 text-muted-foreground font-mono">
                      Loading queue...
                    </TableCell>
                  </TableRow>
                ) : filteredJobs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center p-8 text-muted-foreground font-mono">
                      No jobs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJobs?.map((job, i) => (
                    <TableRow 
                      key={job.id} 
                      className="border-border/50 hover:bg-muted/30 transition-colors group cursor-pointer"
                    >
                      <TableCell>
                        <Link href={`/jobs/${job.id}`} className="flex items-center gap-3">
                          <div className="w-16 h-10 bg-muted rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                            {job.thumbnailUrl ? (
                              <img src={job.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <PlaySquare className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">{job.title}</p>
                            <p className="text-xs text-muted-foreground font-mono mt-1">{job.id.substring(0, 8)}...</p>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={job.status} />
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono text-muted-foreground uppercase">{job.analysisStage || '---'}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <RiskScore score={job.riskScore} className="justify-end" />
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground font-mono">
                        {format(new Date(job.createdAt), "MMM d, HH:mm")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}