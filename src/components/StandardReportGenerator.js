/**
 * StandardReportGenerator - Generates standardized PDF reports
 * Template includes: Logo, Test Info, SOP Steps with photos/comments, Parameter Table, Graphs, Conclusion
 */

// Generate HTML template for the standard report
export const generateStandardReportHTML = (report, companyData = {}) => {
  const execution = report.execution_data || {};
  const asset = report.asset_data || {};
  const test = report.test_data || {};
  const steps = execution.steps_completed || [];
  const testValues = report.test_values || execution.test_values || {};
  
  // Collect all parameter readings from all steps
  const allParameters = [];
  steps.forEach(step => {
    if (step.parameter_readings) {
      step.parameter_readings.forEach(reading => {
        allParameters.push({
          step: step.step_number,
          stepTitle: step.title,
          ...reading
        });
      });
    }
  });

  // Get unique parameters for the summary table
  const parameterSummary = {};
  allParameters.forEach(p => {
    if (!parameterSummary[p.parameter_name]) {
      parameterSummary[p.parameter_name] = {
        name: p.parameter_name,
        value: p.observed_value || p.value,
        unit: p.unit,
        step: p.step
      };
    }
  });

  const logoUrl = companyData?.logo || '';
  const companyName = companyData?.name || 'DMS Insight';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${report.report_title || 'Test Report'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          color: #1a202c;
          line-height: 1.6;
          background: white;
        }
        .page { 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 40px;
        }
        
        /* Header Section */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          border-bottom: 3px solid #2563eb;
          margin-bottom: 30px;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        .logo {
          width: 60px;
          height: 60px;
          object-fit: contain;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
        }
        .report-title {
          text-align: right;
        }
        .report-title h1 {
          font-size: 20px;
          color: #1e40af;
          margin-bottom: 5px;
        }
        .report-id {
          font-size: 12px;
          color: #6b7280;
        }

        /* Status Badge */
        .status-badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          margin: 10px 0;
        }
        .status-approved {
          background: #dcfce7;
          color: #166534;
        }
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        .status-pass {
          background: #dcfce7;
          color: #166534;
        }
        .status-fail {
          background: #fee2e2;
          color: #991b1b;
        }

        /* Section Styles */
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #1e40af;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
          margin-bottom: 15px;
        }
        
        /* Info Grid */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
        }
        .info-item {
          padding: 10px;
          background: #f8fafc;
          border-radius: 8px;
        }
        .info-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .info-value {
          font-size: 14px;
          font-weight: 500;
        }

        /* SOP Steps */
        .sop-step {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin-bottom: 15px;
          overflow: hidden;
        }
        .step-header {
          background: #f1f5f9;
          padding: 12px 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .step-number {
          width: 28px;
          height: 28px;
          background: #22c55e;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }
        .step-title {
          font-weight: 600;
          flex: 1;
        }
        .step-time {
          font-size: 11px;
          color: #6b7280;
        }
        .step-content {
          padding: 15px;
        }
        .step-notes {
          background: #fefce8;
          border: 1px solid #fde047;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 12px;
          font-size: 13px;
        }
        .step-notes-label {
          font-weight: 600;
          color: #854d0e;
          margin-bottom: 4px;
          font-size: 12px;
        }
        .step-photo {
          max-width: 300px;
          border-radius: 6px;
          margin-top: 10px;
        }
        .step-params {
          margin-top: 12px;
        }
        .step-params table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .step-params th {
          background: #f1f5f9;
          padding: 8px;
          text-align: left;
          font-weight: 600;
        }
        .step-params td {
          padding: 8px;
          border-top: 1px solid #e5e7eb;
        }

        /* Summary Table */
        .summary-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .summary-table th {
          background: #1e40af;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        .summary-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .summary-table tr:nth-child(even) {
          background: #f8fafc;
        }

        /* Graph Section */
        .graph-container {
          background: #f8fafc;
          border-radius: 8px;
          padding: 20px;
          margin-top: 15px;
        }
        .graph-placeholder {
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          font-style: italic;
        }

        /* Conclusion */
        .conclusion-box {
          background: #f0fdf4;
          border: 2px solid #22c55e;
          border-radius: 8px;
          padding: 20px;
        }
        .conclusion-title {
          font-weight: 600;
          color: #166534;
          margin-bottom: 10px;
        }

        /* Footer */
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
        }
        .signature-section {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 30px;
          margin-bottom: 20px;
        }
        .signature-box {
          border-top: 2px solid #1e40af;
          padding-top: 10px;
        }
        .signature-label {
          font-size: 12px;
          color: #6b7280;
        }
        .signature-name {
          font-weight: 500;
        }
        .footer-info {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #6b7280;
        }

        /* Print Styles */
        @media print {
          .page { padding: 20px; }
          .sop-step { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <!-- Header -->
        <div class="header">
          <div class="header-left">
            ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo" />` : ''}
            <span class="company-name">${companyName}</span>
          </div>
          <div class="report-title">
            <h1>TEST REPORT</h1>
            <div class="report-id">ID: ${report.report_id}</div>
          </div>
        </div>

        <!-- Test Result Status -->
        <div style="text-align: center; margin-bottom: 20px;">
          <span class="status-badge ${(execution.final_result || '').toLowerCase() === 'pass' ? 'status-pass' : 'status-fail'}">
            TEST RESULT: ${execution.final_result || report.test_result || 'PENDING'}
          </span>
          <span class="status-badge ${report.status === 'approved' || report.status === 'released' ? 'status-approved' : 'status-pending'}">
            ${(report.status || 'pending').replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>

        <!-- Test Information -->
        <div class="section">
          <h2 class="section-title">📋 Test Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Test Name</div>
              <div class="info-value">${test.name || report.test_id || '-'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Test Category</div>
              <div class="info-value">${test.category || '-'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Test Date</div>
              <div class="info-value">${report.test_date || new Date(report.generated_at).toLocaleDateString()}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Conducted By</div>
              <div class="info-value">${execution.conducted_by || report.generated_by || '-'}</div>
            </div>
          </div>
        </div>

        <!-- Asset Information -->
        <div class="section">
          <h2 class="section-title">🏭 Asset Information</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Asset Name</div>
              <div class="info-value">${asset.asset_name || report.asset_id}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Asset Type</div>
              <div class="info-value">${asset.asset_type || '-'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Asset ID</div>
              <div class="info-value">${asset.asset_id || report.asset_id}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Location</div>
              <div class="info-value">${asset.location || '-'}</div>
            </div>
          </div>
        </div>

        <!-- SOP Steps Execution -->
        <div class="section">
          <h2 class="section-title">📝 SOP Steps Execution</h2>
          ${steps.map((step, idx) => `
            <div class="sop-step">
              <div class="step-header">
                <div class="step-number">${step.step_number || idx + 1}</div>
                <div class="step-title">${step.title || `Step ${step.step_number || idx + 1}`}</div>
                <div class="step-time">${step.completed_at ? new Date(step.completed_at).toLocaleString() : ''}</div>
              </div>
              <div class="step-content">
                ${step.notes ? `
                  <div class="step-notes">
                    <div class="step-notes-label">📌 Engineer's Notes:</div>
                    ${step.notes}
                  </div>
                ` : ''}
                
                ${step.parameter_readings && step.parameter_readings.length > 0 ? `
                  <div class="step-params">
                    <table>
                      <thead>
                        <tr>
                          <th>Parameter</th>
                          <th>Value</th>
                          <th>Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${step.parameter_readings.map(p => `
                          <tr>
                            <td>${p.parameter_name}</td>
                            <td><strong>${p.observed_value || p.value || '-'}</strong></td>
                            <td>${p.unit || '-'}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                ` : ''}
                
                ${step.step_photo_base64 || step.step_photo_url ? `
                  <img src="${step.step_photo_base64 || step.step_photo_url}" 
                       alt="Step ${step.step_number} Photo" 
                       class="step-photo" />
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Parameter Summary Table -->
        ${Object.keys(parameterSummary).length > 0 || Object.keys(testValues).length > 0 ? `
          <div class="section">
            <h2 class="section-title">📊 Parameter Summary</h2>
            <table class="summary-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Value</th>
                  <th>Unit</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(parameterSummary).length > 0 
                  ? Object.entries(parameterSummary).map(([_, p]) => `
                      <tr>
                        <td>${p.name}</td>
                        <td><strong>${p.value || '-'}</strong></td>
                        <td>${p.unit || '-'}</td>
                      </tr>
                    `).join('')
                  : Object.entries(testValues).map(([name, value]) => `
                      <tr>
                        <td>${name.replace(/_/g, ' ')}</td>
                        <td><strong>${value || '-'}</strong></td>
                        <td>-</td>
                      </tr>
                    `).join('')
                }
              </tbody>
            </table>
          </div>
        ` : ''}

        <!-- Graphs Section (Placeholder for Chart.js integration) -->
        <div class="section">
          <h2 class="section-title">📈 Analysis & Trends</h2>
          <div class="graph-container">
            <div id="parameter-chart" class="graph-placeholder">
              [Parameter comparison chart will be rendered here]
            </div>
          </div>
        </div>

        <!-- Conclusion -->
        <div class="section">
          <h2 class="section-title">✅ Conclusion</h2>
          <div class="conclusion-box">
            <div class="conclusion-title">Test Summary</div>
            <p>${execution.final_notes || execution.conclusion || report.conclusion || 
              `Test ${(execution.final_result || report.test_result || 'completed').toLowerCase()} for ${asset.asset_name || report.asset_id}. 
               ${steps.length} SOP steps were executed. 
               ${Object.keys(parameterSummary).length || Object.keys(testValues).length} parameters recorded.`
            }</p>
          </div>
        </div>

        <!-- Footer with Signatures -->
        <div class="footer">
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-label">Technician</div>
              <div class="signature-name">${execution.conducted_by || report.generated_by || '_________________'}</div>
            </div>
            <div class="signature-box">
              <div class="signature-label">Approved By</div>
              <div class="signature-name">${report.reviewed_by || report.approved_by || '_________________'}</div>
            </div>
          </div>
          <div class="footer-info">
            <span>Report ID: ${report.report_id}</span>
            <span>Generated: ${new Date(report.generated_at).toLocaleString()}</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Generate PDF using jsPDF with enhanced formatting
export const generateStandardPDF = async (report, companyData = {}, editableContent = {}) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  
  const execution = report.execution_data || {};
  const asset = report.asset_data || {};
  const test = report.test_data || {};
  const steps = execution.steps_completed || [];
  const testValues = report.test_values || execution.test_values || {};
  
  // Get SOP step names from test_data.sop_steps to map to execution steps
  const sopSteps = test.sop_steps || [];
  
  // Helper function to get step title by step number
  const getStepTitle = (stepNumber) => {
    const sopStep = sopSteps.find(s => s.step_number === stepNumber);
    return sopStep?.title || sopStep?.name || `Step ${stepNumber}`;
  };
  
  // Helper function to safely parse dates - handles various formats
  const safeParseDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      // Handle ISO strings with timezone
      let date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date;
      
      // Try without modifying
      return null;
    } catch (e) {
      return null;
    }
  };
  
  // Helper function to format date in browser timezone
  const formatDate = (dateStr, includeTime = true) => {
    const date = safeParseDate(dateStr);
    if (!date) return '-';
    
    if (includeTime) {
      return date.toLocaleString();
    }
    return date.toLocaleDateString();
  };
  
  // Get actual conductor name - never show "Current User"
  const getConductorName = () => {
    // Check multiple sources for the actual user name
    const conductedBy = execution.conducted_by;
    const generatedBy = report.generated_by;
    const technicianName = execution.technician_name;
    const reviewedBy = report.reviewed_by;
    
    // Filter out "Current User" placeholder
    if (conductedBy && conductedBy !== 'Current User' && conductedBy !== 'Current user') {
      return conductedBy;
    }
    if (technicianName && technicianName !== 'Current User' && technicianName !== 'Current user') {
      return technicianName;
    }
    if (generatedBy && generatedBy !== 'Current User' && generatedBy !== 'Current user') {
      return generatedBy;
    }
    // Last resort - use reviewer if available
    if (reviewedBy) {
      return reviewedBy;
    }
    return 'Technician';
  };
  
  // Use editable content if provided, otherwise use defaults
  const aboutTest = editableContent.aboutTest || test.description || '';
  const conclusion = editableContent.conclusion || execution.final_notes || execution.conclusion || report.conclusion || '';
  // Note: reviewerNotes removed from PDF output per user request (item #11)
  
  let y = 15;
  const leftMargin = 15;
  const pageWidth = 180;
  const pageHeight = 280;
  
  // Helper function to check page break
  const checkPageBreak = (neededSpace) => {
    if (y + neededSpace > pageHeight) {
      doc.addPage();
      y = 15;
      return true;
    }
    return false;
  };
  
  // Helper to add image to PDF
  const addImageToPDF = async (imageData, maxWidth = 80, maxHeight = 60) => {
    if (!imageData) return false;
    
    try {
      // Check if it's a base64 image
      if (imageData.startsWith('data:image')) {
        checkPageBreakWithHeader(maxHeight + 10);
        doc.addImage(imageData, 'JPEG', leftMargin, y, maxWidth, maxHeight);
        y += maxHeight + 5;
        return true;
      }
    } catch (error) {
      console.error('Error adding image to PDF:', error);
    }
    return false;
  };
  
  // Helper to draw section header - REMOVED special characters per user request (item #4)
  const drawSectionHeader = (title) => {
    checkPageBreakWithHeader(20);
    doc.setFillColor(30, 64, 175);
    doc.rect(leftMargin, y, pageWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text(title, leftMargin + 3, y + 5.5);
    y += 12;
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
  };

  // Store logo data for reuse in headers on subsequent pages
  let logoBase64Data = null;
  
  // Try to load the actual DMS logo image first
  try {
    const logoResponse = await fetch('/images/dms-logo.png');
    if (logoResponse.ok) {
      const logoBlob = await logoResponse.blob();
      logoBase64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(logoBlob);
      });
    }
  } catch (logoError) {
    console.warn('Could not load DMS logo, using text fallback:', logoError);
  }

  // Helper function to draw header on any page
  const drawHeader = (isFirstPage = false) => {
    const headerY = 12;
    
    // Draw DMS logo (left)
    if (logoBase64Data) {
      doc.addImage(logoBase64Data, 'PNG', leftMargin, headerY - 5, 35, 12);
    } else {
      // Fallback text logo
      doc.setFillColor(30, 64, 175);
      doc.roundedRect(leftMargin, headerY - 5, 40, 15, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('DMS', leftMargin + 5, headerY + 4);
      doc.setFontSize(8);
      doc.text('INSIGHT', leftMargin + 20, headerY + 4);
    }
    
    // Center title - "TEST REPORT" prominently displayed
    doc.setFontSize(16);
    doc.setTextColor(30, 64, 175);
    doc.setFont(undefined, 'bold');
    doc.text('TEST REPORT', leftMargin + pageWidth/2, headerY + 3, { align: 'center' });
    
    // Report ID on right
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text(`Report ID: ${report.report_id}`, leftMargin + pageWidth, headerY + 2, { align: 'right' });
    
    // Divider line
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.5);
    doc.line(leftMargin, headerY + 10, leftMargin + pageWidth, headerY + 10);
  };

  // Helper function to draw footer on any page
  const drawFooter = (pageNum, totalPages) => {
    const footerY = pageHeight + 5;
    
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    
    // Left side - Controlled document statement
    doc.text('Controlled document from DMS Insight - Diagnostic Monitoring Solutions', leftMargin, footerY);
    
    // Right side - Page number with total
    doc.text(`Page ${pageNum} of ${totalPages}`, leftMargin + pageWidth, footerY, { align: 'right' });
  };

  // Track pages for footer
  let currentPage = 1;
  
  // Override checkPageBreak to add headers on new pages
  const checkPageBreakWithHeader = (neededSpace) => {
    if (y + neededSpace > pageHeight) {
      doc.addPage();
      currentPage++;
      drawHeader(false);
      y = 30; // Start content below header
      return true;
    }
    return false;
  };

  // === DRAW FIRST PAGE HEADER ===
  drawHeader(true);
  y = 30; // Start content below header

  // === REPORT TITLE - Test Template Name - Report ===
  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175);
  doc.setFont(undefined, 'bold');
  // Use test template name followed by "Report"
  const testName = test.name || test.test_name || 'Test';
  const reportTitle = `${testName} - Report`;
  doc.text(reportTitle, leftMargin + pageWidth/2, y, { align: 'center' });
  y += 8;
  doc.setFont(undefined, 'normal');

  // === ASSET NAME & SERIAL NUMBER ABOVE RESULT ===
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text(`Asset: ${asset.asset_name || report.asset_id || '-'}`, leftMargin + pageWidth/2, y, { align: 'center' });
  y += 5;
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Serial No: ${asset.serial_number || asset.asset_id || report.asset_id || '-'}`, leftMargin + pageWidth/2, y, { align: 'center' });
  y += 8;

  // === TEST RESULT BADGE ===
  const result = execution.final_result || report.test_result || 'Pending';
  const isPass = result.toLowerCase() === 'pass';
  
  // Center the badges
  const badgeStartX = leftMargin + pageWidth/2 - 52;
  
  if (isPass) {
    doc.setFillColor(220, 252, 231);
  } else {
    doc.setFillColor(254, 226, 226);
  }
  doc.roundedRect(badgeStartX, y, 50, 10, 2, 2, 'F');
  if (isPass) {
    doc.setTextColor(22, 101, 52);
  } else {
    doc.setTextColor(153, 27, 27);
  }
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text(`RESULT: ${result.toUpperCase()}`, badgeStartX + 25, y + 6.5, { align: 'center' });
  
  // Status badge
  const status = (report.status || 'pending').replace(/_/g, ' ').toUpperCase();
  const isApproved = status.includes('APPROVED') || status.includes('RELEASED');
  if (isApproved) {
    doc.setFillColor(220, 252, 231);
  } else {
    doc.setFillColor(254, 243, 199);
  }
  doc.roundedRect(badgeStartX + 55, y, 45, 10, 2, 2, 'F');
  if (isApproved) {
    doc.setTextColor(22, 101, 52);
  } else {
    doc.setTextColor(146, 64, 14);
  }
  doc.text(status, badgeStartX + 77.5, y + 6.5, { align: 'center' });
  
  y += 18;
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'normal');

  // === TEST INFORMATION - Fixed date/time format and conductor name (item #5) ===
  drawSectionHeader('Test Information');
  
  // Get actual conductor name using our helper
  const conductorName = getConductorName();
  
  // Format test date and time using our safe parser
  const testDateTime = formatDate(report.generated_at, true);
  
  doc.setFontSize(9);
  const testInfo = [
    ['Test Name:', test.name || test.test_name || report.test_id || '-'],
    ['Category:', test.category || '-'],
    ['Test Date & Time:', testDateTime],
    ['Conducted By:', conductorName]
  ];
  
  testInfo.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold');
    doc.text(label, leftMargin, y);
    doc.setFont(undefined, 'normal');
    doc.text(String(value), leftMargin + 40, y);
    y += 5;
  });
  y += 5;

  // === ASSET INFORMATION - Added nameplate details (item #6) ===
  drawSectionHeader('Asset Information');
  
  // Basic asset info
  const basicAssetInfo = [
    ['Asset Name:', asset.asset_name || report.asset_id],
    ['Asset Type:', asset.asset_type || '-'],
    ['Asset ID:', asset.asset_id || report.asset_id],
    ['Serial Number:', asset.serial_number || '-'],
    ['Location:', asset.location || '-']
  ];
  
  basicAssetInfo.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold');
    doc.text(label, leftMargin, y);
    doc.setFont(undefined, 'normal');
    doc.text(String(value), leftMargin + 40, y);
    y += 5;
  });
  
  // Nameplate Details (item #6)
  const nameplateDetails = asset.nameplate_details || asset.nameplate || asset.specifications || {};
  if (Object.keys(nameplateDetails).length > 0) {
    y += 3;
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('Nameplate Details:', leftMargin, y);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    y += 4;
    
    Object.entries(nameplateDetails).forEach(([key, value]) => {
      if (value) {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        doc.text(`${formattedKey}: ${value}`, leftMargin + 5, y);
        y += 4;
      }
    });
  }
  y += 5;

  // === ABOUT TEST SECTION (Editable) - Positioned after Asset Info, before SOP Steps ===
  if (aboutTest) {
    checkPageBreakWithHeader(30);
    drawSectionHeader('About This Test');
    
    doc.setFillColor(248, 250, 252);
    const aboutLines = doc.splitTextToSize(aboutTest, pageWidth - 10);
    const aboutBoxHeight = Math.min(aboutLines.length * 4 + 8, 40);
    doc.roundedRect(leftMargin, y, pageWidth, aboutBoxHeight, 2, 2, 'F');
    
    doc.setFontSize(9);
    doc.text(aboutLines.slice(0, 8), leftMargin + 5, y + 5);
    y += aboutBoxHeight + 5;
  }

  // === SOP STEPS - Fixed step name display (item #7) ===
  if (steps.length > 0) {
    drawSectionHeader(`SOP Steps Execution (${steps.length} steps)`);
    
    for (let idx = 0; idx < steps.length; idx++) {
      const step = steps[idx];
      checkPageBreakWithHeader(30);
      
      // Step header
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(leftMargin, y, pageWidth, 8, 1, 1, 'F');
      
      // Step number circle
      doc.setFillColor(34, 197, 94);
      doc.circle(leftMargin + 5, y + 4, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      const stepNum = step.step_number || idx + 1;
      doc.text(String(stepNum), leftMargin + 5, y + 5, { align: 'center' });
      
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      // Fixed: Get step title from SOP template (item #7)
      const stepTitle = step.title || step.name || step.step_name || getStepTitle(stepNum);
      doc.text(stepTitle, leftMargin + 12, y + 5);
      doc.setFont(undefined, 'normal');
      
      if (step.completed_at) {
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        // Use our safe date formatter
        const stepTime = formatDate(step.completed_at, true);
        doc.text(stepTime, leftMargin + pageWidth - 5, y + 5, { align: 'right' });
      }
      y += 11;
      doc.setTextColor(0, 0, 0);
      
      // Notes
      if (step.notes) {
        checkPageBreakWithHeader(15);
        doc.setFillColor(254, 252, 232);
        const noteLines = doc.splitTextToSize(step.notes, pageWidth - 20);
        const noteBoxHeight = Math.min(noteLines.length * 4 + 6, 30);
        doc.roundedRect(leftMargin + 5, y, pageWidth - 10, noteBoxHeight, 1, 1, 'F');
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(133, 77, 14);
        doc.text('Notes:', leftMargin + 8, y + 4);
        doc.setFont(undefined, 'normal');
        doc.text(noteLines.slice(0, 5), leftMargin + 8, y + 8);
        y += noteBoxHeight + 3;
        doc.setTextColor(0, 0, 0);
      }
      
      // Parameter readings
      if (step.parameter_readings && step.parameter_readings.length > 0) {
        checkPageBreakWithHeader(10 + step.parameter_readings.length * 5);
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text('Parameters:', leftMargin + 5, y);
        y += 4;
        doc.setFont(undefined, 'normal');
        
        step.parameter_readings.forEach(p => {
          doc.text(`• ${p.parameter_name}: `, leftMargin + 8, y);
          doc.setFont(undefined, 'bold');
          doc.text(`${p.observed_value || p.value || '-'} ${p.unit || ''}`, leftMargin + 50, y);
          doc.setFont(undefined, 'normal');
          y += 4;
        });
      }
      
      // Step Photo - CENTER ALIGNED (item #8)
      const stepPhoto = step.step_photo_base64 || step.step_photo_url;
      if (stepPhoto && stepPhoto.startsWith('data:image')) {
        try {
          checkPageBreakWithHeader(50);
          doc.setFontSize(7);
          doc.setTextColor(100, 100, 100);
          // Center the label
          doc.text('Step Photo:', leftMargin + pageWidth/2 - 30, y);
          y += 3;
          // Center the image (item #8)
          const imgWidth = 60;
          const imgX = leftMargin + (pageWidth - imgWidth) / 2;
          doc.addImage(stepPhoto, 'JPEG', imgX, y, imgWidth, 40);
          y += 43;
          doc.setTextColor(0, 0, 0);
        } catch (imgError) {
          console.error('Error adding step photo:', imgError);
        }
      }
      
      // Parameter Photos - CENTER ALIGNED (item #8)
      const paramPhotos = (step.parameter_readings || []).filter(p => 
        (p.photo_base64 || p.photo_url)?.startsWith('data:image')
      );
      if (paramPhotos.length > 0) {
        checkPageBreakWithHeader(35);
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text('Parameter Photos:', leftMargin + pageWidth/2, y, { align: 'center' });
        y += 3;
        
        // Center the photos (item #8)
        const photoWidth = 35;
        const photoSpacing = 5;
        const totalWidth = paramPhotos.length * photoWidth + (paramPhotos.length - 1) * photoSpacing;
        let xOffset = leftMargin + (pageWidth - totalWidth) / 2;
        
        for (let i = 0; i < Math.min(paramPhotos.length, 3); i++) {
          try {
            const photo = paramPhotos[i].photo_base64 || paramPhotos[i].photo_url;
            doc.addImage(photo, 'JPEG', xOffset, y, photoWidth, 25);
            doc.setFontSize(5);
            doc.text(paramPhotos[i].parameter_name.substring(0, 15), xOffset + photoWidth/2, y + 27, { align: 'center' });
            xOffset += photoWidth + photoSpacing;
          } catch (imgError) {
            console.error('Error adding param photo:', imgError);
          }
        }
        y += 30;
        doc.setTextColor(0, 0, 0);
      }
      
      y += 5;
    }
  }

  // === COLLECT ALL PARAMETERS ===
  const entries = Object.entries(testValues);
  
  // Collect parameters from steps
  const allParams = [];
  steps.forEach(step => {
    if (step.parameter_readings) {
      step.parameter_readings.forEach(reading => {
        const val = parseFloat(reading.observed_value || reading.value);
        if (!isNaN(val)) {
          allParams.push({
            name: reading.parameter_name,
            value: val,
            unit: reading.unit || ''
          });
        }
      });
    }
  });
  
  // Add from testValues too
  entries.forEach(([name, val]) => {
    const numVal = parseFloat(val);
    if (!isNaN(numVal) && !allParams.find(p => p.name === name)) {
      allParams.push({ name: name.replace(/_/g, ' '), value: numVal, unit: '' });
    }
  });

  // === PARAMETER SUMMARY TABLE - Added S.No column (item #9) ===
  if (entries.length > 0 || allParams.length > 0) {
    checkPageBreakWithHeader(20 + Math.max(entries.length, allParams.length) * 6);
    drawSectionHeader('Parameter Summary');
    
    // Table header with S.No column (item #9)
    doc.setFillColor(30, 64, 175);
    doc.rect(leftMargin, y, pageWidth, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.text('S.No', leftMargin + 5, y + 5);
    doc.text('Parameter', leftMargin + 25, y + 5);
    doc.text('Value', leftMargin + 110, y + 5);
    doc.text('Unit', leftMargin + 150, y + 5);
    y += 9;
    
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    
    // Use allParams if available, otherwise entries
    const tableData = allParams.length > 0 ? allParams : entries.map(([name, value]) => ({ name, value, unit: '' }));
    
    tableData.forEach((item, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(leftMargin, y - 3, pageWidth, 6, 'F');
      }
      const name = typeof item === 'object' ? item.name : item[0];
      const value = typeof item === 'object' ? item.value : item[1];
      const unit = typeof item === 'object' ? (item.unit || '') : '';
      
      // S.No column (item #9)
      doc.text(String(idx + 1), leftMargin + 5, y);
      doc.text(String(name).replace(/_/g, ' '), leftMargin + 25, y);
      doc.setFont(undefined, 'bold');
      doc.text(String(value || '-'), leftMargin + 110, y);
      doc.setFont(undefined, 'normal');
      doc.text(String(unit), leftMargin + 150, y);
      y += 6;
    });
    y += 5;
  }

  // === CHARTS SECTION - Added units to axis (item #10) ===
  const chartConfig = editableContent.chartConfig || { enabled: true, types: ['bar'], selectedParams: [] };
  
  // Support both old single type and new multiple types format
  const selectedChartTypes = chartConfig.types || (chartConfig.type ? [chartConfig.type] : ['bar']);
  const chartsEnabled = chartConfig.enabled !== false && !selectedChartTypes.includes('none');
  
  if (chartsEnabled && allParams.length > 0) {
    drawSectionHeader('Analysis & Trends');
    
    // Filter parameters based on selection, or use all if none selected
    const chartParams = chartConfig.selectedParams?.length > 0 
      ? allParams.filter(p => chartConfig.selectedParams.includes(p.name))
      : allParams.slice(0, 8);
    
    if (chartParams.length > 0) {
      const maxValue = Math.max(...chartParams.map(p => Math.abs(p.value)));
      const minValue = Math.min(...chartParams.map(p => p.value));
      const chartWidth = pageWidth - 40;
      const chartHeight = 45;
      
      // Get common unit for axis label (item #10)
      const commonUnit = chartParams[0]?.unit || '';
      const yAxisLabel = commonUnit ? `Value (${commonUnit})` : 'Value';
      
      const colors = [
        [59, 130, 246], [16, 185, 129], [249, 115, 22], [139, 92, 246],
        [236, 72, 153], [34, 197, 94], [251, 191, 36], [99, 102, 241]
      ];
      
      // Helper function to draw Y-axis with scale and UNIT LABEL (item #10)
      const drawYAxis = (startY, height, maxVal, minVal = 0, unit = '') => {
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.3);
        // Y-axis line
        doc.line(leftMargin + 25, startY, leftMargin + 25, startY + height);
        
        // Y-axis labels and gridlines
        const steps = 4;
        doc.setFontSize(5);
        doc.setTextColor(100, 100, 100);
        for (let i = 0; i <= steps; i++) {
          const yPos = startY + (height * i / steps);
          const value = maxVal - (maxVal - minVal) * i / steps;
          doc.text(value.toFixed(1), leftMargin + 23, yPos + 1, { align: 'right' });
          // Gridline
          doc.setDrawColor(230, 230, 230);
          doc.line(leftMargin + 26, yPos, leftMargin + pageWidth - 10, yPos);
        }
        
        // Y-axis label with unit (item #10)
        doc.setFontSize(5);
        doc.setTextColor(80, 80, 80);
        const axisLabel = unit ? `Value (${unit})` : 'Value';
        doc.text(axisLabel, leftMargin + 2, startY + height/2, { angle: 90 });
        
        doc.setTextColor(0, 0, 0);
      };
      
      // Helper function to draw X-axis with label (item #10)
      const drawXAxis = (startY, startX, width, label = 'Parameters') => {
        doc.setDrawColor(150, 150, 150);
        doc.setLineWidth(0.3);
        doc.line(startX, startY, startX + width, startY);
        
        // X-axis label (item #10)
        doc.setFontSize(5);
        doc.setTextColor(80, 80, 80);
        doc.text(label, startX + width/2, startY + 12, { align: 'center' });
        doc.setTextColor(0, 0, 0);
      };
      
      // Draw each selected chart type
      for (const chartType of selectedChartTypes) {
        if (chartType === 'none') continue;
        
        checkPageBreakWithHeader(75);
        
        // Chart container
        doc.setFillColor(252, 252, 253);
        doc.roundedRect(leftMargin, y, pageWidth, chartHeight + 30, 2, 2, 'F');
        doc.setDrawColor(220, 220, 220);
        doc.roundedRect(leftMargin, y, pageWidth, chartHeight + 30, 2, 2, 'S');
        
        const chartStartY = y + 8;
        const chartStartX = leftMargin + 30;
        
        if (chartType === 'bar') {
          // === VERTICAL BAR CHART ===
          drawYAxis(chartStartY, chartHeight, maxValue, 0, commonUnit);
          drawXAxis(chartStartY + chartHeight, chartStartX - 5, chartWidth, 'Parameters');
          
          const barWidth = Math.min((chartWidth - 10) / chartParams.length - 4, 20);
          let barX = chartStartX;
          
          chartParams.forEach((param, idx) => {
            const barHeight = (param.value / maxValue) * chartHeight;
            const barY = chartStartY + chartHeight - barHeight;
            
            const color = colors[idx % colors.length];
            doc.setFillColor(color[0], color[1], color[2]);
            doc.roundedRect(barX, barY, barWidth, barHeight, 1, 1, 'F');
            
            // Value on top with unit (item #10)
            doc.setFontSize(5);
            doc.setTextColor(60, 60, 60);
            const valueLabel = param.unit ? `${param.value.toFixed(1)} ${param.unit}` : param.value.toFixed(1);
            doc.text(valueLabel, barX + barWidth/2, barY - 2, { align: 'center' });
            
            // Label below (rotated effect with short text)
            doc.setFontSize(4);
            const label = param.name.length > 8 ? param.name.substring(0, 8) + '..' : param.name;
            doc.text(label, barX + barWidth/2, chartStartY + chartHeight + 5, { align: 'center' });
            
            barX += barWidth + 4;
          });
          
          // Chart title
          doc.setFontSize(7);
          doc.setTextColor(30, 64, 175);
          doc.text('Bar Chart - Parameter Comparison', leftMargin + pageWidth/2, y + 4, { align: 'center' });
          
        } else if (chartType === 'horizontal_bar') {
          // === HORIZONTAL BAR CHART ===
          const barHeight = Math.min(chartHeight / chartParams.length - 2, 6);
          let barY = chartStartY + 2;
          
          // Draw X-axis scale at bottom with unit (item #10)
          doc.setFontSize(5);
          doc.setTextColor(100, 100, 100);
          for (let i = 0; i <= 4; i++) {
            const xPos = chartStartX + (chartWidth - 20) * i / 4;
            const value = maxValue * i / 4;
            doc.text(value.toFixed(0), xPos, chartStartY + chartHeight + 5, { align: 'center' });
            doc.setDrawColor(230, 230, 230);
            doc.line(xPos, chartStartY, xPos, chartStartY + chartHeight);
          }
          
          chartParams.forEach((param, idx) => {
            const barWidth = (param.value / maxValue) * (chartWidth - 25);
            
            const color = colors[idx % colors.length];
            doc.setFillColor(color[0], color[1], color[2]);
            doc.roundedRect(chartStartX, barY, barWidth, barHeight, 1, 1, 'F');
            
            // Label on left
            doc.setFontSize(5);
            doc.setTextColor(60, 60, 60);
            const label = param.name.length > 12 ? param.name.substring(0, 12) + '..' : param.name;
            doc.text(label, chartStartX - 2, barY + barHeight/2 + 1, { align: 'right' });
            
            // Value on right of bar with unit (item #10)
            const valueLabel = param.unit ? `${param.value.toFixed(1)} ${param.unit}` : param.value.toFixed(1);
            doc.text(valueLabel, chartStartX + barWidth + 2, barY + barHeight/2 + 1);
            
            barY += barHeight + 2;
          });
          
          doc.setFontSize(7);
          doc.setTextColor(30, 64, 175);
          doc.text('Horizontal Bar Chart', leftMargin + pageWidth/2, y + 4, { align: 'center' });
          doc.setFontSize(5);
          doc.setTextColor(100, 100, 100);
          const xAxisLabel = commonUnit ? `Value (${commonUnit}) →` : 'Value →';
          doc.text(xAxisLabel, chartStartX + chartWidth/2, chartStartY + chartHeight + 10, { align: 'center' });
          
        } else if (chartType === 'line') {
          // === LINE CHART ===
          drawYAxis(chartStartY, chartHeight, maxValue, minValue > 0 ? 0 : minValue, commonUnit);
          drawXAxis(chartStartY + chartHeight, chartStartX - 5, chartWidth, 'Parameters');
          
          const pointSpacing = (chartWidth - 10) / (chartParams.length - 1 || 1);
          let prevX = null, prevY = null;
          
          // Draw line first
          doc.setDrawColor(59, 130, 246);
          doc.setLineWidth(0.8);
          chartParams.forEach((param, idx) => {
            const pointX = chartStartX + pointSpacing * idx;
            const pointY = chartStartY + chartHeight - (param.value / maxValue) * chartHeight;
            
            if (prevX !== null) {
              doc.line(prevX, prevY, pointX, pointY);
            }
            prevX = pointX;
            prevY = pointY;
          });
          
          // Draw points and labels
          chartParams.forEach((param, idx) => {
            const pointX = chartStartX + pointSpacing * idx;
            const pointY = chartStartY + chartHeight - (param.value / maxValue) * chartHeight;
            
            doc.setFillColor(59, 130, 246);
            doc.circle(pointX, pointY, 1.5, 'F');
            doc.setFillColor(255, 255, 255);
            doc.circle(pointX, pointY, 0.8, 'F');
            
            // Value with unit (item #10)
            doc.setFontSize(5);
            doc.setTextColor(60, 60, 60);
            const valueLabel = param.unit ? `${param.value.toFixed(1)} ${param.unit}` : param.value.toFixed(1);
            doc.text(valueLabel, pointX, pointY - 3, { align: 'center' });
            
            doc.setFontSize(4);
            const label = param.name.length > 8 ? param.name.substring(0, 8) + '..' : param.name;
            doc.text(label, pointX, chartStartY + chartHeight + 5, { align: 'center' });
          });
          
          doc.setFontSize(7);
          doc.setTextColor(30, 64, 175);
          doc.text('Line Chart - Trend Analysis', leftMargin + pageWidth/2, y + 4, { align: 'center' });
          
        } else if (chartType === 'pie') {
          // === PIE CHART ===
          const total = chartParams.reduce((sum, p) => sum + Math.abs(p.value), 0);
          const centerX = leftMargin + pageWidth/3;
          const centerY = chartStartY + chartHeight/2 + 3;
          const radius = Math.min(chartHeight/2 - 2, 20);
          
          let startAngle = -Math.PI/2;
          chartParams.forEach((param, idx) => {
            const sliceAngle = (Math.abs(param.value) / total) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;
            
            const color = colors[idx % colors.length];
            doc.setFillColor(color[0], color[1], color[2]);
            
            // Draw pie slice using lines (approximation)
            const segments = Math.max(Math.ceil(sliceAngle * 10), 3);
            for (let i = 0; i < segments; i++) {
              const a1 = startAngle + (sliceAngle * i / segments);
              const a2 = startAngle + (sliceAngle * (i + 1) / segments);
              const x1 = centerX + radius * Math.cos(a1);
              const y1 = centerY + radius * Math.sin(a1);
              const x2 = centerX + radius * Math.cos(a2);
              const y2 = centerY + radius * Math.sin(a2);
              doc.triangle(centerX, centerY, x1, y1, x2, y2, 'F');
            }
            
            startAngle = endAngle;
          });
          
          // Legend on right side with units (item #10)
          let legendY = chartStartY + 5;
          chartParams.forEach((param, idx) => {
            const color = colors[idx % colors.length];
            doc.setFillColor(color[0], color[1], color[2]);
            doc.rect(leftMargin + pageWidth/2 + 10, legendY, 4, 4, 'F');
            
            doc.setFontSize(5);
            doc.setTextColor(60, 60, 60);
            const pct = ((Math.abs(param.value) / total) * 100).toFixed(1);
            const label = param.name.length > 12 ? param.name.substring(0, 12) + '..' : param.name;
            const unitStr = param.unit ? ` (${param.unit})` : '';
            doc.text(`${label}${unitStr}: ${pct}%`, leftMargin + pageWidth/2 + 16, legendY + 3);
            legendY += 6;
          });
          
          doc.setFontSize(7);
          doc.setTextColor(30, 64, 175);
          doc.text('Pie Chart - Distribution', leftMargin + pageWidth/2, y + 4, { align: 'center' });
          
        } else if (chartType === 'doughnut') {
          // === DOUGHNUT CHART ===
          const total = chartParams.reduce((sum, p) => sum + Math.abs(p.value), 0);
          const centerX = leftMargin + pageWidth/3;
          const centerY = chartStartY + chartHeight/2 + 3;
          const outerRadius = Math.min(chartHeight/2 - 2, 20);
          const innerRadius = outerRadius * 0.5;
          
          let startAngle = -Math.PI/2;
          chartParams.forEach((param, idx) => {
            const sliceAngle = (Math.abs(param.value) / total) * 2 * Math.PI;
            const endAngle = startAngle + sliceAngle;
            
            const color = colors[idx % colors.length];
            doc.setFillColor(color[0], color[1], color[2]);
            
            // Draw doughnut slice
            const segments = Math.max(Math.ceil(sliceAngle * 10), 3);
            for (let i = 0; i < segments; i++) {
              const a1 = startAngle + (sliceAngle * i / segments);
              const a2 = startAngle + (sliceAngle * (i + 1) / segments);
              const ox1 = centerX + outerRadius * Math.cos(a1);
              const oy1 = centerY + outerRadius * Math.sin(a1);
              const ox2 = centerX + outerRadius * Math.cos(a2);
              const oy2 = centerY + outerRadius * Math.sin(a2);
              const ix1 = centerX + innerRadius * Math.cos(a1);
              const iy1 = centerY + innerRadius * Math.sin(a1);
              const ix2 = centerX + innerRadius * Math.cos(a2);
              const iy2 = centerY + innerRadius * Math.sin(a2);
              
              // Draw as two triangles
              doc.triangle(ox1, oy1, ox2, oy2, ix1, iy1, 'F');
              doc.triangle(ox2, oy2, ix2, iy2, ix1, iy1, 'F');
            }
            
            startAngle = endAngle;
          });
          
          // Center circle (white)
          doc.setFillColor(255, 255, 255);
          doc.circle(centerX, centerY, innerRadius - 1, 'F');
          
          // Total in center with unit (item #10)
          doc.setFontSize(6);
          doc.setTextColor(60, 60, 60);
          doc.text('Total', centerX, centerY - 2, { align: 'center' });
          doc.setFontSize(7);
          const totalLabel = commonUnit ? `${total.toFixed(1)} ${commonUnit}` : total.toFixed(1);
          doc.text(totalLabel, centerX, centerY + 3, { align: 'center' });
          
          // Legend on right side with units (item #10)
          let legendY = chartStartY + 5;
          chartParams.forEach((param, idx) => {
            const color = colors[idx % colors.length];
            doc.setFillColor(color[0], color[1], color[2]);
            doc.rect(leftMargin + pageWidth/2 + 10, legendY, 4, 4, 'F');
            
            doc.setFontSize(5);
            doc.setTextColor(60, 60, 60);
            const pct = ((Math.abs(param.value) / total) * 100).toFixed(1);
            const label = param.name.length > 12 ? param.name.substring(0, 12) + '..' : param.name;
            const unitStr = param.unit ? ` (${param.unit})` : '';
            doc.text(`${label}${unitStr}: ${pct}%`, leftMargin + pageWidth/2 + 16, legendY + 3);
            legendY += 6;
          });
          
          doc.setFontSize(7);
          doc.setTextColor(30, 64, 175);
          doc.text('Doughnut Chart - Distribution', leftMargin + pageWidth/2, y + 4, { align: 'center' });
          
        } else if (chartType === 'radar') {
          // === RADAR/SPIDER CHART ===
          const centerX = leftMargin + pageWidth/2;
          const centerY = chartStartY + chartHeight/2 + 5;
          const radius = Math.min(chartHeight/2 - 5, 18);
          const numParams = chartParams.length;
          const angleStep = (2 * Math.PI) / numParams;
          
          // Draw grid circles
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.2);
          for (let r = 0.25; r <= 1; r += 0.25) {
            for (let i = 0; i < numParams; i++) {
              const a1 = -Math.PI/2 + angleStep * i;
              const a2 = -Math.PI/2 + angleStep * (i + 1);
              const x1 = centerX + radius * r * Math.cos(a1);
              const y1 = centerY + radius * r * Math.sin(a1);
              const x2 = centerX + radius * r * Math.cos(a2);
              const y2 = centerY + radius * r * Math.sin(a2);
              doc.line(x1, y1, x2, y2);
            }
          }
          
          // Draw axes with labels including units (item #10)
          for (let i = 0; i < numParams; i++) {
            const angle = -Math.PI/2 + angleStep * i;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            doc.line(centerX, centerY, x, y);
            
            // Label at end of axis with unit (item #10)
            const labelX = centerX + (radius + 5) * Math.cos(angle);
            const labelY = centerY + (radius + 5) * Math.sin(angle);
            doc.setFontSize(4);
            doc.setTextColor(60, 60, 60);
            let label = chartParams[i].name.length > 6 ? chartParams[i].name.substring(0, 6) + '..' : chartParams[i].name;
            if (chartParams[i].unit) label += ` (${chartParams[i].unit})`;
            doc.text(label, labelX, labelY, { align: 'center' });
          }
          
          // Draw data polygon
          doc.setDrawColor(59, 130, 246);
          doc.setFillColor(59, 130, 246, 0.3);
          doc.setLineWidth(0.5);
          
          const points = chartParams.map((param, i) => {
            const angle = -Math.PI/2 + angleStep * i;
            const r = (param.value / maxValue) * radius;
            return {
              x: centerX + r * Math.cos(angle),
              y: centerY + r * Math.sin(angle)
            };
          });
          
          // Draw filled polygon
          if (points.length > 2) {
            for (let i = 0; i < points.length; i++) {
              const next = (i + 1) % points.length;
              doc.setFillColor(59, 130, 246);
              doc.setGState(new doc.GState({ opacity: 0.3 }));
              doc.triangle(centerX, centerY, points[i].x, points[i].y, points[next].x, points[next].y, 'F');
            }
            doc.setGState(new doc.GState({ opacity: 1 }));
          }
          
          // Draw outline and points
          for (let i = 0; i < points.length; i++) {
            const next = (i + 1) % points.length;
            doc.setDrawColor(59, 130, 246);
            doc.line(points[i].x, points[i].y, points[next].x, points[next].y);
            doc.setFillColor(59, 130, 246);
            doc.circle(points[i].x, points[i].y, 1, 'F');
          }
          
          doc.setFontSize(7);
          doc.setTextColor(30, 64, 175);
          doc.text('Radar Chart - Multi-Parameter View', leftMargin + pageWidth/2, y + 4, { align: 'center' });
          
        } else if (chartType === 'area') {
          // === AREA CHART ===
          drawYAxis(chartStartY, chartHeight, maxValue, 0, commonUnit);
          drawXAxis(chartStartY + chartHeight, chartStartX - 5, chartWidth, 'Parameters');
          
          const pointSpacing = (chartWidth - 10) / (chartParams.length - 1 || 1);
          
          // Draw filled area
          doc.setFillColor(59, 130, 246);
          doc.setGState(new doc.GState({ opacity: 0.2 }));
          
          // Build path points
          const pathPoints = chartParams.map((param, idx) => ({
            x: chartStartX + pointSpacing * idx,
            y: chartStartY + chartHeight - (param.value / maxValue) * chartHeight
          }));
          
          // Draw filled triangles from baseline
          const baseY = chartStartY + chartHeight;
          for (let i = 0; i < pathPoints.length - 1; i++) {
            doc.triangle(
              pathPoints[i].x, pathPoints[i].y,
              pathPoints[i + 1].x, pathPoints[i + 1].y,
              pathPoints[i].x, baseY,
              'F'
            );
            doc.triangle(
              pathPoints[i + 1].x, pathPoints[i + 1].y,
              pathPoints[i + 1].x, baseY,
              pathPoints[i].x, baseY,
              'F'
            );
          }
          doc.setGState(new doc.GState({ opacity: 1 }));
          
          // Draw line on top
          doc.setDrawColor(59, 130, 246);
          doc.setLineWidth(0.6);
          for (let i = 0; i < pathPoints.length - 1; i++) {
            doc.line(pathPoints[i].x, pathPoints[i].y, pathPoints[i + 1].x, pathPoints[i + 1].y);
          }
          
          // Draw points and labels with units (item #10)
          chartParams.forEach((param, idx) => {
            const pointX = chartStartX + pointSpacing * idx;
            const pointY = chartStartY + chartHeight - (param.value / maxValue) * chartHeight;
            
            doc.setFillColor(59, 130, 246);
            doc.circle(pointX, pointY, 1.2, 'F');
            
            doc.setFontSize(5);
            doc.setTextColor(60, 60, 60);
            const valueLabel = param.unit ? `${param.value.toFixed(1)} ${param.unit}` : param.value.toFixed(1);
            doc.text(valueLabel, pointX, pointY - 3, { align: 'center' });
            
            doc.setFontSize(4);
            const label = param.name.length > 8 ? param.name.substring(0, 8) + '..' : param.name;
            doc.text(label, pointX, chartStartY + chartHeight + 5, { align: 'center' });
          });
          
          doc.setFontSize(7);
          doc.setTextColor(30, 64, 175);
          doc.text('Area Chart - Trend with Volume', leftMargin + pageWidth/2, y + 4, { align: 'center' });
        }
        
        y += chartHeight + 35;
        doc.setTextColor(0, 0, 0);
      }
    }
  }

  // === CONCLUSION (Uses editable content) ===
  checkPageBreakWithHeader(45);
  drawSectionHeader('Conclusion');
  
  // Use the editable conclusion or fall back to defaults
  const finalConclusion = conclusion || 
    `Test ${result.toLowerCase()} for ${asset.asset_name || report.asset_id}. ${steps.length} SOP steps executed. ${entries.length} parameters recorded.`;
  
  const conclusionLines = doc.splitTextToSize(finalConclusion, pageWidth - 10);
  const conclusionBoxHeight = Math.max(25, Math.min(conclusionLines.length * 4 + 10, 50));
  
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(leftMargin, y, pageWidth, conclusionBoxHeight, 2, 2, 'F');
  doc.setDrawColor(34, 197, 94);
  doc.roundedRect(leftMargin, y, pageWidth, conclusionBoxHeight, 2, 2, 'S');
  
  doc.setFontSize(9);
  doc.text(conclusionLines.slice(0, 10), leftMargin + 5, y + 6);
  y += conclusionBoxHeight + 5;

  // NOTE: Reviewer Notes section REMOVED per user request (item #11)
  // This section was for internal review only and should not appear in the final report

  // === SIGNATURES - Fixed technician name and added digital signature placeholder (item #12) ===
  checkPageBreakWithHeader(40);
  y += 5;
  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.3);
  
  // Get proper technician name using our helper
  const technicianName = getConductorName();
  
  // Get approver name
  const approverName = report.reviewed_by || report.approved_by || '';
  const approvalDate = formatDate(report.approved_at, false);
  
  // Technician signature
  doc.line(leftMargin, y + 10, leftMargin + 70, y + 10);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Technician', leftMargin, y + 15);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text(technicianName, leftMargin, y + 20);
  doc.setFont(undefined, 'normal');
  
  // Approver signature with digital signature indicator (item #12)
  doc.line(leftMargin + 100, y + 10, leftMargin + 170, y + 10);
  doc.setTextColor(100, 100, 100);
  doc.text('Approved By', leftMargin + 100, y + 15);
  doc.setTextColor(0, 0, 0);
  
  if (approverName) {
    // Digital signature representation (item #12)
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(leftMargin + 100, y - 8, 70, 15, 2, 2, 'F');
    doc.setDrawColor(34, 197, 94);
    doc.roundedRect(leftMargin + 100, y - 8, 70, 15, 2, 2, 'S');
    
    doc.setFontSize(7);
    doc.setTextColor(22, 101, 52);
    doc.text('DIGITALLY SIGNED', leftMargin + 135, y - 3, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(approverName, leftMargin + 100, y + 20);
    doc.setFont(undefined, 'normal');
    if (approvalDate && approvalDate !== '-') {
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(`Date: ${approvalDate}`, leftMargin + 100, y + 24);
    }
  } else {
    doc.text('_________________', leftMargin + 100, y + 20);
  }
  
  y += 30;

  // === ADD FOOTERS TO ALL PAGES ===
  const totalPages = doc.internal.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  return doc;
};

export default { generateStandardReportHTML, generateStandardPDF };
