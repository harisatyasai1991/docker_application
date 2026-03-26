import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  Check,
  Camera,
  MessageSquare,
  Gauge,
  Clock,
  AlertTriangle,
  Image as ImageIcon,
  FileText,
  Expand,
  Minimize2
} from 'lucide-react';

/**
 * StepByStepReportView - Displays detailed SOP step execution for report review
 * Shows each step with photos, notes, and parameter readings
 */
export const StepByStepReportView = ({ report, onImageClick }) => {
  const [expandedSteps, setExpandedSteps] = useState({});
  const [expandAll, setExpandAll] = useState(false);

  const steps = report?.execution_data?.steps_completed || [];
  const sopSteps = report?.test_data?.sop_steps || [];

  // Toggle individual step
  const toggleStep = (index) => {
    setExpandedSteps(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Toggle all steps
  const toggleAllSteps = () => {
    if (expandAll) {
      setExpandedSteps({});
    } else {
      const allExpanded = {};
      steps.forEach((_, idx) => {
        allExpanded[idx] = true;
      });
      setExpandedSteps(allExpanded);
    }
    setExpandAll(!expandAll);
  };

  if (steps.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No step execution data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with expand/collapse all */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          SOP Execution Steps ({steps.length} steps completed)
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAllSteps}
          className="text-xs"
        >
          {expandAll ? (
            <>
              <Minimize2 className="w-3 h-3 mr-1" />
              Collapse All
            </>
          ) : (
            <>
              <Expand className="w-3 h-3 mr-1" />
              Expand All
            </>
          )}
        </Button>
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const sopStep = sopSteps.find(s => s.step_number === step.step_number) || sopSteps[index] || {};
          const isExpanded = expandedSteps[index] || expandAll;
          const hasPhotos = step.step_photo_base64 || step.step_photo_url || 
            (step.parameter_readings?.some(p => p.photo_base64 || p.photo_url));
          const hasNotes = step.notes && step.notes.trim().length > 0;
          const parameterCount = step.parameter_readings?.length || 0;

          return (
            <Collapsible
              key={index}
              open={isExpanded}
              onOpenChange={() => toggleStep(index)}
            >
              <Card className={`border ${isExpanded ? 'border-primary/50 shadow-md' : 'border-border'}`}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Step Number Badge */}
                        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-semibold text-sm">
                          <Check className="w-4 h-4" />
                        </div>
                        
                        {/* Step Title */}
                        <div>
                          <CardTitle className="text-base font-medium">
                            Step {step.step_number}: {step.title || sopStep.title || `Step ${step.step_number}`}
                          </CardTitle>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {step.completed_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(step.completed_at).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Info Badges */}
                      <div className="flex items-center gap-2">
                        {hasPhotos && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                            <Camera className="w-3 h-3 mr-1" />
                            Photos
                          </Badge>
                        )}
                        {hasNotes && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 text-xs">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Notes
                          </Badge>
                        )}
                        {parameterCount > 0 && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                            <Gauge className="w-3 h-3 mr-1" />
                            {parameterCount} params
                          </Badge>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4 space-y-4">
                    {/* Step Description */}
                    {sopStep.description && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>SOP Instructions:</strong> {sopStep.description}
                        </p>
                      </div>
                    )}

                    {/* Notes Section */}
                    {hasNotes && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <h4 className="text-sm font-medium text-yellow-800 flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4" />
                          Engineer&apos;s Notes
                        </h4>
                        <p className="text-sm text-yellow-900 whitespace-pre-wrap">{step.notes}</p>
                      </div>
                    )}

                    {/* Parameter Readings */}
                    {step.parameter_readings && step.parameter_readings.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-purple-600" />
                          Parameter Readings
                        </h4>
                        <div className="border rounded-lg overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-muted">
                              <tr>
                                <th className="text-left px-3 py-2 font-medium">Parameter</th>
                                <th className="text-center px-3 py-2 font-medium">Value</th>
                                <th className="text-center px-3 py-2 font-medium">Unit</th>
                                <th className="text-center px-3 py-2 font-medium">Photo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {step.parameter_readings.map((reading, ridx) => (
                                <tr key={ridx} className={ridx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                                  <td className="px-3 py-2 border-t">{reading.parameter_name}</td>
                                  <td className="px-3 py-2 border-t text-center font-medium">
                                    {reading.observed_value || reading.value || '-'}
                                  </td>
                                  <td className="px-3 py-2 border-t text-center text-muted-foreground">
                                    {reading.unit || '-'}
                                  </td>
                                  <td className="px-3 py-2 border-t text-center">
                                    {(reading.photo_base64 || reading.photo_url) ? (
                                      <button
                                        onClick={() => onImageClick?.(reading.photo_base64 || reading.photo_url, `${reading.parameter_name} - Step ${step.step_number}`)}
                                        className="inline-flex items-center text-blue-600 hover:text-blue-800"
                                      >
                                        <Camera className="w-4 h-4" />
                                      </button>
                                    ) : reading.photo_is_external ? (
                                      <Badge variant="outline" className="text-xs">External</Badge>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Step Photos */}
                    {(step.step_photo_base64 || step.step_photo_url) && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Camera className="w-4 h-4 text-blue-600" />
                          Step Documentation Photo
                        </h4>
                        <div 
                          className="relative rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity max-w-md"
                          onClick={() => onImageClick?.(step.step_photo_base64 || step.step_photo_url, `Step ${step.step_number} Photo`)}
                        >
                          <img
                            src={step.step_photo_base64 || step.step_photo_url}
                            alt={`Step ${step.step_number} documentation`}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="absolute inset-0 hidden items-center justify-center bg-gray-200">
                            <ImageIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* External Photo Indicator */}
                    {step.step_photo_is_external && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-700 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Step photo marked as external. Expected filename: {step.step_photo_expected_filename || 'Not specified'}
                          </p>
                      </div>
                    )}

                    {/* Parameter Photos Gallery */}
                    {step.parameter_readings?.filter(p => p.photo_base64 || p.photo_url).length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Camera className="w-4 h-4 text-green-600" />
                          Parameter Photos
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {step.parameter_readings
                            .filter(p => p.photo_base64 || p.photo_url)
                            .map((reading, pidx) => (
                              <div 
                                key={pidx}
                                className="relative rounded-lg overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => onImageClick?.(reading.photo_base64 || reading.photo_url, reading.parameter_name)}
                              >
                                <img
                                  src={reading.photo_base64 || reading.photo_url}
                                  alt={reading.parameter_name}
                                  className="w-full h-24 object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                                  {reading.parameter_name}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
};

export default StepByStepReportView;
