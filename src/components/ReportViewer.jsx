import React, { useState } from 'react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ReportPDFDocument, generatePDFBlob, generatePDFBase64 } from './ReportPDFRenderer';
import { reportsAPI } from '../services/api';
import { toast } from 'sonner';
import {
  Download,
  Mail,
  Share2,
  Printer,
  X,
  Send,
  MessageCircle,
  FileText,
} from 'lucide-react';

export const ReportViewer = ({ report, template, executionData, testData, assetData, onClose }) => {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareMethod, setShareMethod] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const reportData = {
    execution: executionData,
    test: testData,
    asset: assetData,
  };

  const handleDownload = async () => {
    try {
      toast.loading('Generating PDF...');
      const blob = await generatePDFBlob(template, reportData);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.report_title || 'Test_Report'}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.dismiss();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to download PDF');
      console.error(error);
    }
  };

  const handlePrint = async () => {
    try {
      toast.loading('Preparing for print...');
      const blob = await generatePDFBlob(template, reportData);
      const url = URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
      
      toast.dismiss();
      toast.success('Print dialog opened');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to open print dialog');
      console.error(error);
    }
  };

  const handleShare = async () => {
    if (shareMethod === 'email') {
      if (!shareEmail.trim()) {
        toast.error('Please enter an email address');
        return;
      }
      
      setIsSharing(true);
      try {
        // Generate PDF base64 for storage (optional)
        const pdfBase64 = await generatePDFBase64(template, reportData);
        
        // Update report with PDF
        await reportsAPI.updatePDF(report.report_id, pdfBase64);
        
        // Record share action (mocked email)
        await reportsAPI.share(report.report_id, {
          via: 'email',
          to: shareEmail,
          by: report.generated_by,
        });
        
        toast.success(`Report shared via email to ${shareEmail} (mocked)`);
        setShowShareDialog(false);
        setShareEmail('');
        setShareMessage('');
      } catch (error) {
        toast.error('Failed to share report');
        console.error(error);
      } finally {
        setIsSharing(false);
      }
    } else if (shareMethod === 'whatsapp') {
      // Generate shareable link and open WhatsApp
      const message = encodeURIComponent(
        shareMessage || `Check out this test report: ${report.report_title}`
      );
      const whatsappUrl = `https://wa.me/?text=${message}`;
      
      try {
        // Record share action
        await reportsAPI.share(report.report_id, {
          via: 'whatsapp',
          to: 'WhatsApp',
          by: report.generated_by,
        });
        
        window.open(whatsappUrl, '_blank');
        toast.success('WhatsApp opened for sharing');
        setShowShareDialog(false);
        setShareMessage('');
      } catch (error) {
        toast.error('Failed to share via WhatsApp');
        console.error(error);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <div>
                <h2 className="font-semibold">{report.report_title}</h2>
                <p className="text-xs text-muted-foreground">
                  Generated on {new Date(report.generated_at).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShareMethod('email');
                  setShowShareDialog(true);
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShareMethod('whatsapp');
                  setShowShareDialog(true);
                }}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="h-[calc(100vh-73px)]">
        <PDFViewer
          style={{ width: '100%', height: '100%', border: 'none' }}
          showToolbar={true}
        >
          <ReportPDFDocument template={template} data={reportData} />
        </PDFViewer>
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Share Report via {shareMethod === 'email' ? 'Email' : 'WhatsApp'}
            </DialogTitle>
            <DialogDescription>
              {shareMethod === 'email' 
                ? 'Enter the email address to send this report (mocked for demo)'
                : 'Share this report on WhatsApp'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {shareMethod === 'email' && (
              <>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    placeholder="recipient@example.com"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message (Optional)</Label>
                  <Textarea
                    placeholder="Add a message..."
                    value={shareMessage}
                    onChange={(e) => setShareMessage(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            )}

            {shareMethod === 'whatsapp' && (
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Enter message to share..."
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  rows={4}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowShareDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleShare}
              disabled={isSharing}
            >
              <Send className="w-4 h-4 mr-2" />
              {isSharing ? 'Sharing...' : 'Share'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
