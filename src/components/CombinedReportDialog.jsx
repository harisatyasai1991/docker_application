import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { useAPIData } from '../hooks/useAPI';
import { reportTemplateAPI } from '../services/api';
import { LoadingSpinner } from './LoadingStates';
import { toast } from 'sonner';
import { FileText, CheckCircle2, AlertCircle, Layers, Calendar, User } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

export const CombinedReportDialog = ({ 
  open, 
  onClose, 
  completedTests = [],
  asset,
  onReportGenerated 
}) => {
  const [selectedTests, setSelectedTests] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch all templates
  const { data: templates, loading: templatesLoading } = useAPIData(
    () => reportTemplateAPI.getAll(),
    []
  );

  // Auto-generate default title when dialog opens
  useEffect(() => {
    if (open && !reportTitle && asset) {
      const defaultTitle = `Combined Test Report - ${asset.asset_name} - ${new Date().toLocaleDateString()}`;
      setReportTitle(defaultTitle);
    }
  }, [open, asset, reportTitle]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedTests([]);
      setSelectedTemplateId('');
    }
  }, [open]);

  const handleTestToggle = (executionId) => {
    setSelectedTests(prev => {
      if (prev.includes(executionId)) {
        return prev.filter(id => id !== executionId);
      } else {
        return [...prev, executionId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedTests.length === completedTests.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(completedTests.map(t => t.execution_id));
    }
  };

  const handleGenerate = async () => {
    if (selectedTests.length < 2) {
      toast.error('Please select at least 2 tests to combine');
      return;
    }
    if (!reportTitle.trim()) {
      toast.error('Please enter a report title');
      return;
    }

    setIsGenerating(true);
    try {
      // Get record IDs for selected tests
      const selectedExecutions = completedTests.filter(t => selectedTests.includes(t.execution_id));
      
      // Call the combined report API
      const response = await fetch(`${API_URL}/api/reports/generate-from-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          record_ids: selectedExecutions.map(e => e.record_id).filter(Boolean),
          execution_ids: selectedTests,
          template_id: selectedTemplateId || null,
          report_title: reportTitle,
          generated_by: selectedExecutions[0]?.conducted_by || 'Unknown',
          company_id: asset?.company_id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate combined report');
      }

      const result = await response.json();
      toast.success(`Combined report generated with ${selectedTests.length} tests!`);
      onReportGenerated?.(result);
      onClose();
    } catch (error) {
      toast.error('Failed to generate combined report');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedTemplate = templates?.find(t => t.template_id === selectedTemplateId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600" />
            Generate Combined Report
          </DialogTitle>
          <DialogDescription>
            Combine multiple test results into a single comprehensive report
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4 py-4">
          {/* Report Title */}
          <div className="space-y-2">
            <Label>Report Title</Label>
            <Input
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Enter report title"
            />
          </div>

          {/* Template Selection (Optional) */}
          <div className="space-y-2">
            <Label>Report Template (Optional)</Label>
            {templatesLoading ? (
              <div className="flex items-center justify-center py-2">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-sm text-muted-foreground">Loading templates...</span>
              </div>
            ) : templates && templates.length > 0 ? (
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template - use default format</SelectItem>
                  {templates.map((template) => (
                    <SelectItem key={template.template_id} value={template.template_id}>
                      {template.template_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">No templates available</p>
            )}
          </div>

          {/* Test Selection */}
          <div className="flex-1 space-y-2 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between">
              <Label>Select Tests to Combine</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSelectAll}
                className="text-xs"
              >
                {selectedTests.length === completedTests.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Select at least 2 tests to create a combined report
            </p>

            <ScrollArea className="flex-1 border rounded-lg p-2">
              <div className="space-y-2">
                {completedTests.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>No completed tests available</p>
                  </div>
                ) : (
                  completedTests.map((test) => (
                    <div 
                      key={test.execution_id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTests.includes(test.execution_id) 
                          ? 'bg-purple-50 border-purple-300' 
                          : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => handleTestToggle(test.execution_id)}
                    >
                      <Checkbox 
                        checked={selectedTests.includes(test.execution_id)}
                        onCheckedChange={() => handleTestToggle(test.execution_id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium text-sm truncate">
                            {test.test_name || test.test_code || 'Unknown Test'}
                          </span>
                          <Badge 
                            variant={test.final_result === 'Pass' || test.final_result === 'pass' ? 'success' : 'destructive'}
                            className="text-xs flex-shrink-0"
                          >
                            {test.final_result || 'Completed'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {test.completion_time 
                              ? new Date(test.completion_time).toLocaleDateString() 
                              : new Date(test.created_at).toLocaleDateString()
                            }
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {test.conducted_by || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Selection Summary */}
          {selectedTests.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <Layers className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-purple-900">
                <strong>{selectedTests.length}</strong> test{selectedTests.length !== 1 ? 's' : ''} selected for combined report
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || selectedTests.length < 2}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Layers className="w-4 h-4 mr-2" />
                Generate Combined Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CombinedReportDialog;
