import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Play,
  Pencil,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  CircleDashed,
  Calendar,
  Repeat
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function TestSchedulingTable({ tests, onRunNow, onEdit, onDelete, onToggleActive, runningTests }) {

  const getStatusBadge = (status) => {
    console.log('Status badge for:', status); // Debug log
    switch (status) {
      case 'succeeded':
      case 'success':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1"/> Succeeded</Badge>;
      case 'failed':
      case 'failure':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="w-3 h-3 mr-1"/> Failed</Badge>;
      case 'running':
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200"><Loader className="w-3 h-3 mr-1 animate-spin"/> Running</Badge>;
      case 'pending':
      case 'queued':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="w-3 h-3 mr-1"/> Pending</Badge>;
      case 'never_run':
        return <Badge variant="outline"><CircleDashed className="w-3 h-3 mr-1"/> Never Run</Badge>;
      default:
        return <Badge variant="outline"><CircleDashed className="w-3 h-3 mr-1"/> {status || 'Never Run'}</Badge>;
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            <TableHead>Configuration</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Schedule / Workflow</TableHead>
            <TableHead>Last Run</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tests.map((test) => (
            <TableRow key={test.id}>
              <TableCell>
                <div className="font-medium text-slate-900">{test.name}</div>
                <div className="text-sm text-slate-500">{test.description}</div>
              </TableCell>
              <TableCell>
                <Badge variant={test.test_type === 'scheduled' ? 'default' : 'secondary'} className="capitalize">
                  {test.test_type.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <span className="font-semibold text-slate-700">{test.github_repo_full_name}</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">{test.workflow_file_name}</div>
                {test.test_type === 'scheduled' && (
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Repeat className="w-3 h-3"/>
                    <span className="font-mono">{test.cron_expression}</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {test.last_run_time && test.last_run_time !== 'null' ? (
                  <div className="text-sm text-slate-600">
                    {(() => {
                      try {
                        const date = new Date(test.last_run_time);
                        if (isNaN(date.getTime())) {
                          return <span className="text-slate-400">Invalid date</span>;
                        }
                        return formatDistanceToNow(date, { addSuffix: true });
                      } catch (error) {
                        return <span className="text-slate-400">Invalid date</span>;
                      }
                    })()}
                  </div>
                ) : (
                  <span className="text-sm text-slate-400">-</span>
                )}
              </TableCell>
              <TableCell>{getStatusBadge(test.last_run_status)}</TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={test.is_active}
                  onCheckedChange={(checked) => onToggleActive(test, checked)}
                />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRunNow(test.id)}
                    disabled={runningTests.includes(test.id)}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Run
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(test)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-600" onClick={() => onDelete(test.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {tests.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-slate-500">No test configurations found.</p>
          <p className="text-sm text-slate-400">Click "Add New" to create your first on-demand or scheduled test.</p>
        </div>
      )}
    </div>
  );
}