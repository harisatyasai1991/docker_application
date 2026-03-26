import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { useAPIData } from '../hooks/useAPI';
import { reportTemplateAPI, reportsAPI } from '../services/api';
import { LoadingSpinner } from './LoadingStates';
import { toast } from 'sonner';
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export const GenerateReportDialog = ({ 
  open, 
  onClose, 
  execution, 
  test, 
  asset,
  onReportGenerated 
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch templates for the test type
  const { data: templates, loading: templatesLoading } = useAPIData(
    () => reportTemplateAPI.getAll(test?.test_type || test?.category),
    [test]
  );

  // Auto-generate default title when dialog opens
  React.useEffect(() => {
    if (open && !reportTitle && test && asset) {
      const defaultTitle = `${test.test_name || test.name} - ${asset.asset_name} - ${new Date().toLocaleDateString()}`;
      setReportTitle(defaultTitle);
    }
  }, [open, test, asset]);

  const handleGenerate = async () => {
    if (!selectedTemplateId) {
      toast.error('Please select a template');
      return;
    }
    if (!reportTitle.trim()) {
      toast.error('Please enter a report title');
      return;
    }

    setIsGenerating(true);
    try {
      const reportData = {
        execution_id: execution.execution_id,
        template_id: selectedTemplateId,
        test_id: execution.test_id,
        asset_id: execution.asset_id,
        report_title: reportTitle,
        generated_by: execution.conducted_by, // TODO: Get from auth context
      };

      const generatedReport = await reportsAPI.generate(reportData);
      
      toast.success('Report generated successfully!');
      onReportGenerated(generatedReport);
      onClose();
    } catch (error) {
      toast.error('Failed to generate report');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedTemplate = templates?.find(t => t.template_id === selectedTemplateId);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Generate Test Report
          </DialogTitle>
          <DialogDescription>
            Create a PDF report from this test execution
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Execution Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm">Test Execution Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Test:</span>{' '}
                <span className="font-medium">{test?.test_name || test?.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Asset:</span>{' '}
                <span className="font-medium">{asset?.asset_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Conducted By:</span>{' '}
                <span className="font-medium">{execution?.conducted_by}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>{' '}
                <Badge 
                  variant={execution?.final_result === 'Pass' ? 'success' : execution?.final_result === 'Fail' ? 'destructive' : 'secondary'}
                  className="ml-2"
                >
                  {execution?.final_result || 'Completed'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Report Title */}
          <div className="space-y-2">
            <Label>Report Title</Label>
            <Input
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Enter report title"
            />
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Select Template</Label>
            {templatesLoading ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-sm text-muted-foreground">Loading templates...</span>
              </div>
            ) : templates && templates.length > 0 ? (
              <>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.template_id} value={template.template_id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{template.template_name}</span>
                          <Badge variant="outline" className="ml-2">
                            {template.elements?.length || 0} elements
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Selected Template Preview */}
                {selectedTemplate && (
                  <div className="mt-3 p-3 border rounded-lg bg-muted/30">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-semibold text-sm">{selectedTemplate.template_name}</h5>
                      <Badge variant="outline">{selectedTemplate.test_type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {selectedTemplate.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      <span>{selectedTemplate.elements?.length || 0} elements configured</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 border rounded-lg border-dashed">
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">No templates available</p>
                <p className="text-xs text-muted-foreground">
                  Create a template for this test type first
                </p>
              </div>
            )}
          </div>

          {/* Info Message */}
          {execution?.steps_completed?.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <FileText className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-900">
                <p className="font-medium mb-1">Report will include:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>{execution.steps_completed.length} completed test steps</li>
                  <li>All parameter readings and measurements</li>
                  <li>Test metadata and asset information</li>
                  <li>Photos and documentation (if available)</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedTemplateId}
          >
            {isGenerating ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
