import { Layout } from "@/components/layout";
import { useListViolations } from "@workspace/api-client-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Filter, ShieldAlert, FileText, Settings, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { format } from "date-fns";

export default function Violations() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const { data: violations, isLoading } = useListViolations({
    category: categoryFilter !== 'all' ? categoryFilter as any : undefined,
    severity: severityFilter !== 'all' ? severityFilter as any : undefined,
    limit: 100
  });

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

  return (
    <Layout>
      <div className="space-y-6 max-w-[1600px] mx-auto h-full flex flex-col">
        <div>
          <h1 className="text-3xl font-mono uppercase tracking-widest text-primary font-bold mb-2">Violations Browser</h1>
          <p className="text-muted-foreground">Global view of all detected policy violations across jobs.</p>
        </div>

        <Card className="bg-card border-border flex-1 flex flex-col min-h-0">
          <CardHeader className="border-b border-border/50 py-4">
            <div className="flex items-center gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[200px] font-mono text-sm bg-background/50">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="visual">Visual</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="metadata">Metadata</SelectItem>
                  <SelectItem value="contextual">Contextual</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-[200px] font-mono text-sm bg-background/50">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>

              <div className="ml-auto text-sm text-muted-foreground font-mono">
                 {violations?.length || 0} violations found
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10 backdrop-blur">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Category/Severity</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Rule & Description</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Confidence</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Job ID</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground text-right">Detected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center p-8 text-muted-foreground font-mono">
                      Loading violations...
                    </TableCell>
                  </TableRow>
                ) : violations?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center p-8 text-muted-foreground font-mono">
                      No violations match the criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  violations?.map((violation) => {
                    const Icon = categoryIcons[violation.category as keyof typeof categoryIcons] || ShieldAlert;
                    return (
                      <TableRow 
                        key={violation.id} 
                        className="border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <TableCell>
                          <div className="flex flex-col items-start gap-2">
                            <div className="flex items-center gap-2 text-foreground">
                              <Icon className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium capitalize">{violation.category}</span>
                            </div>
                            <span className={cn("text-[10px] font-mono uppercase px-2 py-0.5 rounded border", severityColors[violation.severity as keyof typeof severityColors])}>
                              {violation.severity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-md">
                            <p className="font-bold text-sm text-foreground mb-1">{violation.rule}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{violation.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             <div className="w-16 h-1.5 bg-muted rounded overflow-hidden">
                               <div 
                                 className="h-full bg-primary" 
                                 style={{ width: `${violation.confidence * 100}%` }}
                               />
                             </div>
                             <span className="text-xs font-mono">{(violation.confidence * 100).toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link href={`/jobs/${violation.jobId}`}>
                            <span className="text-xs font-mono text-primary hover:underline cursor-pointer">
                              {violation.jobId.substring(0, 8)}...
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground font-mono">
                          {format(new Date(violation.createdAt), "MMM d, HH:mm")}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}