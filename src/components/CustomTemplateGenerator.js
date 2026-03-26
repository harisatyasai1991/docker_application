/**
 * Custom Template PDF Generator
 * 
 * Generates PDF reports based on custom template definitions.
 * Works alongside StandardReportGenerator for template-based customization.
 */

import { generateStandardPDF } from './StandardReportGenerator';

// Element type renderers for custom templates
const ELEMENT_RENDERERS = {
  // Logo element - renders company/custom logo
  logo: async (doc, element, context, y) => {
    const { leftMargin, pageWidth } = context.layout;
    
    if (element.image_base64) {
      try {
        const logoHeight = parseInt(element.styles?.maxHeight || '40') || 40;
        const logoWidth = logoHeight * 2; // Aspect ratio approximation
        
        let xPos = leftMargin;
        if (element.alignment === 'center') {
          xPos = leftMargin + (pageWidth - logoWidth) / 2;
        } else if (element.alignment === 'right') {
          xPos = leftMargin + pageWidth - logoWidth;
        }
        
        doc.addImage(element.image_base64, 'PNG', xPos, y, logoWidth, logoHeight / 3);
        return logoHeight / 3 + 5;
      } catch (error) {
        console.error('Error rendering logo:', error);
        return 0;
      }
    }
    return 0;
  },

  // Text element - renders static or dynamic text
  text: (doc, element, context, y) => {
    const { leftMargin, pageWidth } = context.layout;
    const content = element.content || '';
    
    if (!content) return 0;
    
    doc.setFontSize(element.styles?.fontSize || 10);
    doc.setTextColor(0, 0, 0);
    
    const lines = doc.splitTextToSize(content, pageWidth - 10);
    const lineHeight = 5;
    
    let xPos = leftMargin + 5;
    let align = 'left';
    
    if (element.alignment === 'center') {
      xPos = leftMargin + pageWidth / 2;
      align = 'center';
    } else if (element.alignment === 'right') {
      xPos = leftMargin + pageWidth - 5;
      align = 'right';
    }
    
    lines.forEach((line, idx) => {
      doc.text(line, xPos, y + (idx * lineHeight), { align });
    });
    
    return lines.length * lineHeight + 5;
  },

  // Dynamic field - renders report data fields
  dynamic_field: (doc, element, context, y) => {
    const { leftMargin, pageWidth } = context.layout;
    const { reportData } = context;
    
    const fieldMap = {
      asset_name: reportData.asset_data?.asset_name || reportData.asset_id || '-',
      asset_id: reportData.asset_data?.asset_id || reportData.asset_id || '-',
      test_name: reportData.test_data?.name || reportData.test_data?.test_name || '-',
      test_date: formatDate(reportData.generated_at),
      conductor: reportData.execution_data?.conducted_by || reportData.generated_by || '-',
      test_result: reportData.execution_data?.final_result || 'Pending',
      start_time: formatDate(reportData.execution_data?.started_at, true),
      completion_time: formatDate(reportData.execution_data?.completed_at, true),
      manufacturer: reportData.asset_data?.manufacturer || '-',
      voltage_rating: reportData.asset_data?.voltage_rating || '-',
    };
    
    const value = fieldMap[element.field_name] || `{{${element.field_name}}}`;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    
    let xPos = leftMargin + 5;
    if (element.alignment === 'center') xPos = leftMargin + pageWidth / 2;
    if (element.alignment === 'right') xPos = leftMargin + pageWidth - 5;
    
    doc.text(value, xPos, y, { align: element.alignment || 'left' });
    doc.setFont(undefined, 'normal');
    
    return 8;
  },

  // Test summary block
  test_summary: (doc, element, context, y) => {
    const { leftMargin, pageWidth } = context.layout;
    const { reportData } = context;
    
    const asset = reportData.asset_data || {};
    const test = reportData.test_data || {};
    const execution = reportData.execution_data || {};
    
    // Draw section header
    doc.setFillColor(30, 64, 175);
    doc.rect(leftMargin, y, pageWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Test Information', leftMargin + 3, y + 5.5);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    
    y += 12;
    
    const info = [
      ['Test Name:', test.name || test.test_name || '-'],
      ['Category:', test.category || '-'],
      ['Test Date:', formatDate(reportData.generated_at)],
      ['Conducted By:', execution.conducted_by !== 'Current User' ? execution.conducted_by : (reportData.generated_by || '-')]
    ];
    
    doc.setFontSize(9);
    info.forEach(([label, value]) => {
      doc.setFont(undefined, 'bold');
      doc.text(label, leftMargin, y);
      doc.setFont(undefined, 'normal');
      doc.text(String(value), leftMargin + 40, y);
      y += 5;
    });
    
    return (info.length * 5) + 17;
  },

  // Asset information block
  asset_info: (doc, element, context, y) => {
    const { leftMargin, pageWidth } = context.layout;
    const { reportData } = context;
    
    const asset = reportData.asset_data || {};
    
    // Draw section header
    doc.setFillColor(30, 64, 175);
    doc.rect(leftMargin, y, pageWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Asset Information', leftMargin + 3, y + 5.5);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    
    y += 12;
    
    const info = [
      ['Asset Name:', asset.asset_name || reportData.asset_id || '-'],
      ['Asset Type:', asset.asset_type || '-'],
      ['Asset ID:', asset.asset_id || reportData.asset_id || '-'],
      ['Serial Number:', asset.serial_number || '-'],
      ['Location:', asset.location || '-']
    ];
    
    // Add nameplate details if available
    const nameplate = asset.nameplate_details || asset.nameplate || {};
    Object.entries(nameplate).forEach(([key, value]) => {
      if (value) {
        info.push([`${key.replace(/_/g, ' ')}:`, String(value)]);
      }
    });
    
    doc.setFontSize(9);
    info.forEach(([label, value]) => {
      doc.setFont(undefined, 'bold');
      doc.text(label, leftMargin, y);
      doc.setFont(undefined, 'normal');
      doc.text(String(value), leftMargin + 40, y);
      y += 5;
    });
    
    return (info.length * 5) + 17;
  },

  // Parameters table
  parameters_table: (doc, element, context, y) => {
    const { leftMargin, pageWidth } = context.layout;
    const { reportData } = context;
    
    const testValues = reportData.test_values || reportData.execution_data?.test_values || {};
    const entries = Object.entries(testValues);
    
    if (entries.length === 0) return 0;
    
    // Draw section header
    doc.setFillColor(30, 64, 175);
    doc.rect(leftMargin, y, pageWidth, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Parameter Summary', leftMargin + 3, y + 5.5);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    
    y += 12;
    
    // Table header
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
    
    entries.forEach(([name, value], idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(leftMargin, y - 3, pageWidth, 6, 'F');
      }
      doc.text(String(idx + 1), leftMargin + 5, y);
      doc.text(String(name).replace(/_/g, ' '), leftMargin + 25, y);
      doc.setFont(undefined, 'bold');
      doc.text(String(value || '-'), leftMargin + 110, y);
      doc.setFont(undefined, 'normal');
      y += 6;
    });
    
    return (entries.length * 6) + 26;
  },

  // Signature block
  signature_block: (doc, element, context, y) => {
    const { leftMargin, pageWidth } = context.layout;
    const { reportData } = context;
    
    const execution = reportData.execution_data || {};
    const technicianName = execution.conducted_by !== 'Current User' ? execution.conducted_by : (reportData.generated_by || '');
    const approverName = reportData.reviewed_by || reportData.approved_by || '';
    
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.3);
    
    // Technician signature
    doc.line(leftMargin, y + 10, leftMargin + 70, y + 10);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Technician', leftMargin, y + 15);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text(technicianName, leftMargin, y + 20);
    doc.setFont(undefined, 'normal');
    
    // Approver signature
    doc.line(leftMargin + 100, y + 10, leftMargin + 170, y + 10);
    doc.setTextColor(100, 100, 100);
    doc.text('Approved By', leftMargin + 100, y + 15);
    doc.setTextColor(0, 0, 0);
    
    if (approverName) {
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
    } else {
      doc.text('_________________', leftMargin + 100, y + 20);
    }
    
    return 35;
  },
};

// Helper function to format dates
const formatDate = (dateStr, timeOnly = false) => {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return timeOnly ? date.toLocaleTimeString() : date.toLocaleString();
  } catch {
    return '-';
  }
};

/**
 * Generate PDF from a custom template
 * 
 * @param {Object} template - Template definition with elements
 * @param {Object} reportData - Report data to populate
 * @param {Object} companyData - Company info (name, logo)
 * @param {Object} options - Additional options (chartConfig, editable content)
 * @returns {Promise<jsPDF>} - Generated PDF document
 */
export const generateTemplatedPDF = async (template, reportData, companyData = {}, options = {}) => {
  // If using standard template, delegate to StandardReportGenerator
  if (template.is_standard || template.template_id === 'standard-report') {
    return generateStandardPDF(reportData, companyData, options);
  }
  
  // For custom templates, use element-based rendering
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  
  const layout = {
    leftMargin: 15,
    pageWidth: 180,
    pageHeight: 280,
  };
  
  const context = {
    layout,
    reportData,
    companyData,
    options,
  };
  
  let y = 15;
  let currentPage = 1;
  
  // Sort elements by section and position
  const sortedElements = [...(template.elements || [])].sort((a, b) => {
    const sectionOrder = { header: 0, body: 1, footer: 2 };
    const sectionDiff = (sectionOrder[a.section] || 1) - (sectionOrder[b.section] || 1);
    if (sectionDiff !== 0) return sectionDiff;
    return (a.position || 0) - (b.position || 0);
  });
  
  // Separate elements by section
  const headerElements = sortedElements.filter(e => e.section === 'header');
  const bodyElements = sortedElements.filter(e => e.section === 'body');
  const footerElements = sortedElements.filter(e => e.section === 'footer');
  
  // Helper to render header
  const renderHeader = async () => {
    let headerY = 15;
    for (const element of headerElements) {
      const renderer = ELEMENT_RENDERERS[element.element_type];
      if (renderer) {
        const height = await renderer(doc, element, context, headerY);
        headerY += height;
      }
    }
    return headerY;
  };
  
  // Helper to check page break and add header
  const checkPageBreak = async (neededSpace) => {
    if (y + neededSpace > layout.pageHeight) {
      doc.addPage();
      currentPage++;
      y = await renderHeader();
      return true;
    }
    return false;
  };
  
  // Render first page header
  y = await renderHeader();
  
  // Add report title
  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175);
  doc.setFont(undefined, 'bold');
  const testName = reportData.test_data?.name || reportData.test_data?.test_name || 'Test';
  doc.text(`${testName} - Report`, layout.leftMargin + layout.pageWidth/2, y, { align: 'center' });
  y += 10;
  doc.setFont(undefined, 'normal');
  
  // Render body elements
  for (const element of bodyElements) {
    const renderer = ELEMENT_RENDERERS[element.element_type];
    if (renderer) {
      await checkPageBreak(50); // Estimate space needed
      const height = await renderer(doc, element, context, y);
      y += height;
    }
  }
  
  // Add footers to all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Controlled document from DMS Insight - Diagnostic Monitoring Solutions', layout.leftMargin, layout.pageHeight + 5);
    doc.text(`Page ${i} of ${totalPages}`, layout.leftMargin + layout.pageWidth, layout.pageHeight + 5, { align: 'right' });
  }
  
  return doc;
};

export default { generateTemplatedPDF, ELEMENT_RENDERERS };
