/**
 * Canvas Template PDF Generator
 * Generates PDF documents from canvas-style templates with drag-and-drop elements
 */

import jsPDF from 'jspdf';

// A4 dimensions in mm
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

// Default canvas dimensions (pixels)
const CANVAS_PORTRAIT = { width: 595, height: 842 };
const CANVAS_LANDSCAPE = { width: 842, height: 595 };

/**
 * Convert pixel position to mm for PDF
 */
const pxToMm = (px, canvasSize, pageSize) => {
  return (px / canvasSize) * pageSize;
};

/**
 * Generate PDF from canvas template
 * @param {Object} template - The canvas template with elements
 * @param {Object} data - Report data (execution, asset, test info)
 * @param {Object} options - Additional options
 * @returns {jsPDF} The generated PDF document
 */
export const generateCanvasPDF = (template, data = {}, options = {}) => {
  const orientation = template.orientation || 'portrait';
  const isLandscape = orientation === 'landscape';
  
  // Create PDF
  const doc = new jsPDF({
    orientation: isLandscape ? 'l' : 'p',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = isLandscape ? A4_HEIGHT_MM : A4_WIDTH_MM;
  const pageHeight = isLandscape ? A4_WIDTH_MM : A4_HEIGHT_MM;
  const canvasWidth = template.canvas_width || (isLandscape ? CANVAS_LANDSCAPE.width : CANVAS_PORTRAIT.width);
  const canvasHeight = template.canvas_height || (isLandscape ? CANVAS_LANDSCAPE.height : CANVAS_PORTRAIT.height);
  
  // Add margin
  const margin = 10; // mm
  const contentWidth = pageWidth - (margin * 2);
  const contentHeight = pageHeight - (margin * 2);
  
  // Pass full template in options for TOC generation
  const enhancedOptions = {
    ...options,
    fullTemplate: template
  };
  
  // Check if template has multi-page structure
  const pages = template.pages || [];
  
  // Collect ALL header and footer elements from ALL pages
  // Headers and footers should repeat on every page
  let allHeaderElements = [];
  let allFooterElements = [];
  
  if (pages.length > 0) {
    // Multi-page template - collect headers/footers from all pages
    pages.forEach((page) => {
      const pageComponents = page.components || [];
      pageComponents.forEach((comp) => {
        if (comp.section === 'header' && !allHeaderElements.find(h => h.id === comp.id)) {
          allHeaderElements.push(comp);
        }
        if (comp.section === 'footer' && !allFooterElements.find(f => f.id === comp.id)) {
          allFooterElements.push(comp);
        }
      });
    });
    
    // Render each page
    pages.forEach((page, pageIndex) => {
      if (pageIndex > 0) {
        doc.addPage();
      }
      
      const pageComponents = page.components || [];
      
      // ALWAYS render header components on every page
      allHeaderElements.forEach((element) => {
        const x = margin + pxToMm(element.x, canvasWidth, contentWidth);
        const y = margin + pxToMm(element.y, canvasHeight, contentHeight);
        const width = pxToMm(element.width, canvasWidth, contentWidth);
        const height = pxToMm(element.height, canvasHeight, contentHeight);
        renderElement(doc, element, x, y, width, height, data, enhancedOptions);
      });
      
      // Render page-specific content (excluding headers/footers which are handled above)
      pageComponents.forEach((element) => {
        // Skip header/footer components - they're rendered separately on all pages
        if (element.section === 'header' || element.section === 'footer') return;
        
        const x = margin + pxToMm(element.x, canvasWidth, contentWidth);
        const y = margin + pxToMm(element.y, canvasHeight, contentHeight);
        const width = pxToMm(element.width, canvasWidth, contentWidth);
        const height = pxToMm(element.height, canvasHeight, contentHeight);
        renderElement(doc, element, x, y, width, height, data, enhancedOptions);
      });
      
      // ALWAYS render footer components on every page
      allFooterElements.forEach((element) => {
        const x = margin + pxToMm(element.x, canvasWidth, contentWidth);
        const y = margin + pxToMm(element.y, canvasHeight, contentHeight);
        const width = pxToMm(element.width, canvasWidth, contentWidth);
        const height = pxToMm(element.height, canvasHeight, contentHeight);
        renderElement(doc, element, x, y, width, height, data, enhancedOptions);
      });
    });
  } else {
    // Single page / flat elements structure (backward compatibility)
    const elements = template.elements || [];
    
    // Separate headers, footers, and body content
    const headerElements = elements.filter(e => e.section === 'header');
    const footerElements = elements.filter(e => e.section === 'footer');
    const bodyElements = elements.filter(e => e.section !== 'header' && e.section !== 'footer');
    
    // Render in order: headers first, then body, then footers
    // For single-page templates, this ensures proper layering
    [...headerElements, ...bodyElements, ...footerElements].forEach((element) => {
      const x = margin + pxToMm(element.x, canvasWidth, contentWidth);
      const y = margin + pxToMm(element.y, canvasHeight, contentHeight);
      const width = pxToMm(element.width, canvasWidth, contentWidth);
      const height = pxToMm(element.height, canvasHeight, contentHeight);
      
      renderElement(doc, element, x, y, width, height, data, enhancedOptions);
    });
  }
  
  return doc;
};

/**
 * Render a single element to the PDF
 */
const renderElement = (doc, element, x, y, width, height, data, options) => {
  const { type } = element;
  
  switch (type) {
    case 'logo':
      renderLogo(doc, element, x, y, width, height, options.companyLogo);
      break;
    case 'text':
      renderText(doc, element, x, y, width, height);
      break;
    case 'heading':
      renderHeading(doc, element, x, y, width, height);
      break;
    case 'test_summary':
      renderTestSummary(doc, element, x, y, width, height, data);
      break;
    case 'asset_details':
      renderAssetDetails(doc, element, x, y, width, height, data);
      break;
    case 'parameters_table':
      renderParametersTable(doc, element, x, y, width, height, data);
      break;
    case 'sop_steps':
      renderSOPSteps(doc, element, x, y, width, height, data);
      break;
    case 'index_toc':
      renderIndexTOC(doc, element, x, y, width, height, data, options);
      break;
    case 'signature_block':
      renderSignatureBlock(doc, element, x, y, width, height, data);
      break;
    case 'image_placeholder':
      renderImagePlaceholder(doc, element, x, y, width, height);
      break;
    case 'chart':
      renderChartPlaceholder(doc, element, x, y, width, height);
      break;
    case 'qr_code':
      renderQRCode(doc, element, x, y, width, height, data);
      break;
    case 'divider':
      renderDivider(doc, element, x, y, width, height);
      break;
    case 'box':
      renderBox(doc, element, x, y, width, height);
      break;
    case 'page_number':
      renderPageNumber(doc, element, x, y, width, height);
      break;
    default:
      // Unknown element type - render placeholder
      renderPlaceholder(doc, element, x, y, width, height);
  }
};

/**
 * Render company logo
 */
const renderLogo = (doc, element, x, y, width, height, logoBase64) => {
  if (logoBase64) {
    try {
      // Determine image type
      let imageType = 'PNG';
      if (logoBase64.includes('data:image/jpeg') || logoBase64.includes('data:image/jpg')) {
        imageType = 'JPEG';
      }
      
      // Remove data URL prefix if present
      const base64Data = logoBase64.replace(/^data:image\/\w+;base64,/, '');
      doc.addImage(base64Data, imageType, x, y, width, height);
    } catch (e) {
      console.error('Error adding logo:', e);
      // Draw placeholder if logo fails
      doc.setFillColor(240, 240, 240);
      doc.rect(x, y, width, height, 'F');
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Logo', x + width / 2, y + height / 2, { align: 'center', baseline: 'middle' });
    }
  } else {
    // Draw placeholder
    doc.setFillColor(240, 240, 240);
    doc.rect(x, y, width, height, 'F');
    doc.setDrawColor(200);
    doc.setLineDash([2, 2], 0);
    doc.rect(x, y, width, height, 'S');
    doc.setLineDash([]);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Company Logo', x + width / 2, y + height / 2, { align: 'center', baseline: 'middle' });
  }
};

/**
 * Render text block
 */
const renderText = (doc, element, x, y, width, height) => {
  const content = element.content || 'Text content';
  const fontSize = element.fontSize || 12;
  const textAlign = element.textAlign || 'left';
  const textColor = hexToRgb(element.textColor || '#000000');
  
  doc.setFontSize(fontSize * 0.75); // Scale for mm
  doc.setTextColor(textColor.r, textColor.g, textColor.b);
  
  if (element.bold) {
    doc.setFont(undefined, 'bold');
  } else {
    doc.setFont(undefined, 'normal');
  }
  
  // Calculate text position based on alignment
  let textX = x;
  if (textAlign === 'center') textX = x + width / 2;
  if (textAlign === 'right') textX = x + width;
  
  // Split text to fit width
  const lines = doc.splitTextToSize(content, width);
  doc.text(lines, textX, y + fontSize * 0.35, { align: textAlign });
};

/**
 * Render heading
 */
const renderHeading = (doc, element, x, y, width, height) => {
  const content = element.content || 'Heading';
  const fontSize = element.fontSize || 18;
  const textAlign = element.textAlign || 'center';
  const textColor = hexToRgb(element.textColor || '#0066cc');
  
  doc.setFontSize(fontSize * 0.75);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(textColor.r, textColor.g, textColor.b);
  
  let textX = x;
  if (textAlign === 'center') textX = x + width / 2;
  if (textAlign === 'right') textX = x + width;
  
  doc.text(content, textX, y + fontSize * 0.35, { align: textAlign });
};

/**
 * Render test summary block
 */
const renderTestSummary = (doc, element, x, y, width, height, data) => {
  // Draw background
  doc.setFillColor(239, 246, 255); // Light blue
  doc.rect(x, y, width, height, 'F');
  doc.setDrawColor(147, 197, 253);
  doc.rect(x, y, width, height, 'S');
  
  // Title
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('Test Summary', x + 3, y + 5);
  
  // Content
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(75, 85, 99);
  
  const execution = data.execution || {};
  const test = data.test || {};
  
  const summaryLines = [
    `Test Name: ${test.test_name || execution.test_name || '[Auto-filled]'}`,
    `Test Date: ${execution.executed_at ? new Date(execution.executed_at).toLocaleDateString() : '[Auto-filled]'}`,
    `Conducted By: ${execution.technician_name || '[Auto-filled]'}`,
    `Result: ${execution.result || execution.status || '[Auto-filled]'}`
  ];
  
  let lineY = y + 10;
  summaryLines.forEach(line => {
    doc.text(line, x + 3, lineY);
    lineY += 5;
  });
};

/**
 * Render asset details block
 */
const renderAssetDetails = (doc, element, x, y, width, height, data) => {
  // Draw background
  doc.setFillColor(236, 253, 245); // Light green
  doc.rect(x, y, width, height, 'F');
  doc.setDrawColor(134, 239, 172);
  doc.rect(x, y, width, height, 'S');
  
  // Title
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('Asset Details', x + 3, y + 5);
  
  // Content
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(75, 85, 99);
  
  const asset = data.asset || {};
  
  const assetLines = [
    `Asset Name: ${asset.asset_name || '[Auto-filled]'}`,
    `Asset ID: ${asset.asset_id || '[Auto-filled]'}`,
    `Type: ${asset.asset_type || '[Auto-filled]'}`
  ];
  
  let lineY = y + 10;
  assetLines.forEach(line => {
    doc.text(line, x + 3, lineY);
    lineY += 5;
  });
};

/**
 * Render parameters table
 */
const renderParametersTable = (doc, element, x, y, width, height, data) => {
  // Draw background
  doc.setFillColor(255, 247, 237); // Light orange
  doc.rect(x, y, width, height, 'F');
  doc.setDrawColor(253, 186, 116);
  doc.rect(x, y, width, height, 'S');
  
  // Title
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(154, 52, 18);
  doc.text('Parameters Table', x + 3, y + 5);
  
  // Table header
  const colWidths = [width * 0.4, width * 0.3, width * 0.3];
  const headers = ['Parameter', 'Value', 'Unit'];
  
  doc.setFillColor(254, 215, 170);
  doc.rect(x, y + 8, width, 6, 'F');
  
  doc.setFontSize(7);
  doc.setTextColor(0);
  let colX = x + 2;
  headers.forEach((header, i) => {
    doc.text(header, colX, y + 12);
    colX += colWidths[i];
  });
  
  // Table data
  const execution = data.execution || {};
  const parameters = execution.parameters || [];
  
  let rowY = y + 18;
  if (parameters.length > 0) {
    parameters.slice(0, 5).forEach((param) => {
      colX = x + 2;
      doc.text(String(param.name || ''), colX, rowY);
      colX += colWidths[0];
      doc.text(String(param.value || ''), colX, rowY);
      colX += colWidths[1];
      doc.text(String(param.unit || ''), colX, rowY);
      rowY += 5;
    });
  } else {
    // Placeholder rows
    for (let i = 0; i < 3; i++) {
      colX = x + 2;
      doc.text('[Auto]', colX, rowY);
      colX += colWidths[0];
      doc.text('[Auto]', colX, rowY);
      colX += colWidths[1];
      doc.text('[Auto]', colX, rowY);
      rowY += 5;
    }
  }
};

/**
 * Render Index / Table of Contents
 * Scans template pages for headings and auto-filled sections, then renders a TOC
 */
const renderIndexTOC = (doc, element, x, y, width, height, data, options) => {
  // Draw background
  doc.setFillColor(255, 251, 235); // Light amber
  doc.rect(x, y, width, height, 'F');
  doc.setDrawColor(252, 211, 77);
  doc.rect(x, y, width, height, 'S');
  
  // Title
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(146, 64, 14);
  doc.text('Table of Contents', x + 3, y + 6);
  
  // Build TOC entries from template pages
  const template = options.fullTemplate || {};
  const pages = template.pages || [];
  const tocEntries = [];
  
  // Define which component types should appear in the TOC
  const tocComponentTypes = {
    'heading': true,
    'test_summary': 'Test Summary',
    'asset_details': 'Asset Details',
    'parameters_table': 'Parameters Table',
    'sop_steps': 'SOP / Test Procedure',
    'signature_block': 'Signatures & Approval',
    'chart': 'Charts & Analysis'
  };
  
  // Scan all pages for TOC-worthy components
  pages.forEach((page, pageIndex) => {
    const pageNumber = pageIndex + 1;
    const components = page.components || [];
    
    components.forEach((comp) => {
      // Skip the index_toc component itself
      if (comp.type === 'index_toc') return;
      
      if (comp.type === 'heading' && comp.content) {
        // Use the actual heading text
        tocEntries.push({
          title: comp.content,
          page: pageNumber,
          y: comp.y || 0,
          isHeading: true
        });
      } else if (tocComponentTypes[comp.type] && comp.type !== 'heading') {
        // Use the predefined label for auto-filled components
        // Only add if not already added for this page
        const label = tocComponentTypes[comp.type];
        const exists = tocEntries.some(e => e.title === label && e.page === pageNumber);
        if (!exists) {
          tocEntries.push({
            title: label,
            page: pageNumber,
            y: comp.y || 0,
            isHeading: false
          });
        }
      }
    });
  });
  
  // Sort by page number first, then by Y position within each page
  tocEntries.sort((a, b) => {
    if (a.page !== b.page) {
      return a.page - b.page; // Sort by page number first
    }
    return a.y - b.y; // Then sort by Y position (top to bottom)
  });
  
  // If no entries found, show default placeholder entries
  if (tocEntries.length === 0) {
    const defaultEntries = [
      { title: 'Executive Summary', page: 1 },
      { title: 'Asset Details', page: 1 },
      { title: 'Test Parameters', page: 2 },
      { title: 'Test Procedure (SOP)', page: 2 },
      { title: 'Results & Observations', page: 3 },
      { title: 'Conclusions', page: 3 }
    ];
    tocEntries.push(...defaultEntries);
  }
  
  // Render TOC entries
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);
  
  const startY = y + 12;
  const lineHeight = 5;
  const maxEntries = Math.floor((height - 18) / lineHeight); // Calculate how many entries fit
  const entriesToRender = tocEntries.slice(0, maxEntries);
  
  entriesToRender.forEach((entry, index) => {
    const entryY = startY + (index * lineHeight);
    
    // Entry number and title
    doc.setFont(undefined, entry.isHeading ? 'bold' : 'normal');
    const entryText = `${index + 1}. ${entry.title}`;
    doc.text(entryText, x + 3, entryY);
    
    // Calculate text width for dotted line
    const textWidth = doc.getTextWidth(entryText);
    const pageNumText = String(entry.page);
    const pageNumWidth = doc.getTextWidth(pageNumText);
    
    // Draw dotted line
    const lineStartX = x + 5 + textWidth;
    const lineEndX = x + width - 5 - pageNumWidth;
    
    if (lineEndX > lineStartX + 5) {
      doc.setDrawColor(209, 213, 219);
      doc.setLineDash([1, 1], 0);
      doc.line(lineStartX, entryY - 1, lineEndX, entryY - 1);
      doc.setLineDash([]);
    }
    
    // Page number (right-aligned)
    doc.setFont(undefined, 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(pageNumText, x + width - 5, entryY, { align: 'right' });
    
    // Reset text color for next entry
    doc.setTextColor(55, 65, 81);
  });
  
  // Show "more entries" indicator if truncated
  if (tocEntries.length > maxEntries) {
    doc.setFontSize(6);
    doc.setTextColor(146, 64, 14);
    doc.text(`+ ${tocEntries.length - maxEntries} more sections...`, x + 3, y + height - 3);
  }
  
  // Auto-generated note
  doc.setFontSize(6);
  doc.setTextColor(180, 83, 9);
  doc.setFont(undefined, 'italic');
  doc.text('* Auto-generated from report sections', x + width - 3, y + height - 3, { align: 'right' });
};

/**
 * Render SOP steps
 */
const renderSOPSteps = (doc, element, x, y, width, height, data) => {
  // Draw background
  doc.setFillColor(240, 253, 250); // Light teal
  doc.rect(x, y, width, height, 'F');
  doc.setDrawColor(94, 234, 212);
  doc.rect(x, y, width, height, 'S');
  
  // Title
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(17, 94, 89);
  doc.text('SOP Steps', x + 3, y + 5);
  
  // Steps
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(75, 85, 99);
  
  const execution = data.execution || {};
  const steps = execution.sop_steps || [];
  
  let stepY = y + 12;
  if (steps.length > 0) {
    steps.slice(0, 5).forEach((step, index) => {
      doc.setFont(undefined, 'bold');
      doc.text(`${index + 1}.`, x + 3, stepY);
      doc.setFont(undefined, 'normal');
      const stepText = doc.splitTextToSize(step.title || step.description || `Step ${index + 1}`, width - 10);
      doc.text(stepText, x + 8, stepY);
      stepY += stepText.length * 4 + 2;
    });
  } else {
    // Placeholder steps
    for (let i = 1; i <= 3; i++) {
      doc.text(`${i}. Step title [Auto-filled]`, x + 3, stepY);
      stepY += 6;
    }
  }
  
  // Photos indicator
  doc.setFontSize(6);
  doc.setTextColor(13, 148, 136);
  doc.text('+ Photos included', x + 3, y + height - 3);
};

/**
 * Render signature block
 */
const renderSignatureBlock = (doc, element, x, y, width, height, data) => {
  // Draw background
  doc.setFillColor(238, 242, 255); // Light indigo
  doc.rect(x, y, width, height, 'F');
  doc.setDrawColor(165, 180, 252);
  doc.rect(x, y, width, height, 'S');
  
  // Title
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(55, 48, 163);
  doc.text('Signatures', x + 3, y + 5);
  
  // Signature lines
  const sigWidth = (width - 20) / 2;
  const sig1X = x + 5;
  const sig2X = x + width / 2 + 5;
  const sigY = y + height - 15;
  
  doc.setDrawColor(156, 163, 175);
  doc.line(sig1X, sigY, sig1X + sigWidth, sigY);
  doc.line(sig2X, sigY, sig2X + sigWidth, sigY);
  
  doc.setFontSize(7);
  doc.setTextColor(107, 114, 128);
  doc.text('Technician', sig1X + sigWidth / 2, sigY + 4, { align: 'center' });
  doc.text('Supervisor', sig2X + sigWidth / 2, sigY + 4, { align: 'center' });
};

/**
 * Render image placeholder
 */
const renderImagePlaceholder = (doc, element, x, y, width, height) => {
  doc.setFillColor(253, 242, 248); // Light pink
  doc.rect(x, y, width, height, 'F');
  doc.setDrawColor(249, 168, 212);
  doc.setLineDash([2, 2], 0);
  doc.rect(x, y, width, height, 'S');
  doc.setLineDash([]);
  
  doc.setFontSize(8);
  doc.setTextColor(219, 39, 119);
  doc.text('Image/Photo', x + width / 2, y + height / 2, { align: 'center', baseline: 'middle' });
};

/**
 * Render chart placeholder
 */
const renderChartPlaceholder = (doc, element, x, y, width, height) => {
  doc.setFillColor(236, 254, 255); // Light cyan
  doc.rect(x, y, width, height, 'F');
  doc.setDrawColor(103, 232, 249);
  doc.rect(x, y, width, height, 'S');
  
  doc.setFontSize(8);
  doc.setTextColor(8, 145, 178);
  doc.text('Chart Area', x + width / 2, y + height / 2, { align: 'center', baseline: 'middle' });
};

/**
 * Render QR code placeholder
 */
const renderQRCode = (doc, element, x, y, width, height, data) => {
  doc.setFillColor(243, 244, 246);
  doc.rect(x, y, width, height, 'F');
  doc.setDrawColor(209, 213, 219);
  doc.rect(x, y, width, height, 'S');
  
  // Draw simplified QR pattern
  const gridSize = Math.min(width, height) / 7;
  doc.setFillColor(31, 41, 55);
  
  // Corner squares
  doc.rect(x + gridSize * 0.5, y + gridSize * 0.5, gridSize * 2, gridSize * 2, 'F');
  doc.rect(x + width - gridSize * 2.5, y + gridSize * 0.5, gridSize * 2, gridSize * 2, 'F');
  doc.rect(x + gridSize * 0.5, y + height - gridSize * 2.5, gridSize * 2, gridSize * 2, 'F');
};

/**
 * Render divider line
 */
const renderDivider = (doc, element, x, y, width, height) => {
  const lineWidth = element.lineWidth || 2;
  const lineColor = hexToRgb(element.lineColor || '#cccccc');
  
  doc.setDrawColor(lineColor.r, lineColor.g, lineColor.b);
  doc.setLineWidth(lineWidth * 0.25);
  doc.line(x, y + height / 2, x + width, y + height / 2);
  doc.setLineWidth(0.2);
};

/**
 * Render box/container
 */
const renderBox = (doc, element, x, y, width, height) => {
  const bgColor = hexToRgb(element.bgColor || '#ffffff');
  const borderColor = hexToRgb(element.borderColor || '#cccccc');
  const borderWidth = element.borderWidth || 1;
  
  if (element.bgColor && element.bgColor !== 'transparent') {
    doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
    doc.rect(x, y, width, height, 'F');
  }
  
  doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
  doc.setLineWidth(borderWidth * 0.25);
  doc.rect(x, y, width, height, 'S');
  doc.setLineWidth(0.2);
};

/**
 * Render page number
 */
const renderPageNumber = (doc, element, x, y, width, height) => {
  const pageNum = doc.getCurrentPageInfo().pageNumber;
  const totalPages = doc.getNumberOfPages();
  
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`Page ${pageNum} of ${totalPages}`, x + width / 2, y + height / 2, { align: 'center', baseline: 'middle' });
};

/**
 * Render unknown element placeholder
 */
const renderPlaceholder = (doc, element, x, y, width, height) => {
  doc.setFillColor(243, 244, 246);
  doc.rect(x, y, width, height, 'F');
  doc.setDrawColor(209, 213, 219);
  doc.rect(x, y, width, height, 'S');
  
  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.text(element.type || 'Unknown', x + width / 2, y + height / 2, { align: 'center', baseline: 'middle' });
};

/**
 * Convert hex color to RGB
 */
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

/**
 * Download the generated PDF
 */
export const downloadCanvasPDF = (template, data = {}, options = {}) => {
  const doc = generateCanvasPDF(template, data, options);
  const fileName = `${template.template_name || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  return fileName;
};

/**
 * Get PDF as base64 string
 */
export const getCanvasPDFBase64 = (template, data = {}, options = {}) => {
  const doc = generateCanvasPDF(template, data, options);
  return doc.output('datauristring');
};

/**
 * Open PDF in new window for preview
 */
export const previewCanvasPDF = (template, data = {}, options = {}) => {
  const doc = generateCanvasPDF(template, data, options);
  const pdfBlob = doc.output('blob');
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, '_blank');
  return url;
};

export default {
  generateCanvasPDF,
  downloadCanvasPDF,
  getCanvasPDFBase64,
  previewCanvasPDF
};
