import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    paddingTop: 80,  // Space for header
    paddingBottom: 60,  // Space for footer
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  headerSection: {
    position: 'absolute',
    top: 20,
    left: 40,
    right: 40,
    borderBottom: '1pt solid #e2e8f0',
    paddingBottom: 10,
  },
  footerSection: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    borderTop: '1pt solid #e2e8f0',
    paddingTop: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  elementWrapper: {
    marginBottom: 10,
  },
  fullWidth: {
    width: '100%',
  },
  halfWidth: {
    width: '48%',
    marginRight: '2%',
  },
  thirdWidth: {
    width: '31%',
    marginRight: '2%',
  },
  quarterWidth: {
    width: '23%',
    marginRight: '2%',
  },
  alignLeft: {
    alignItems: 'flex-start',
  },
  alignCenter: {
    alignItems: 'center',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  alignJustify: {
    textAlign: 'justify',
  },
  logo: {
    maxHeight: 60,
    objectFit: 'contain',
    marginBottom: 5,
  },
  logoSmall: {
    maxHeight: 30,
  },
  logoMedium: {
    maxHeight: 40,
  },
  logoLarge: {
    maxHeight: 60,
  },
  logoXLarge: {
    maxHeight: 80,
  },
  logoHuge: {
    maxHeight: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 15,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
    borderBottom: '1pt solid #e2e8f0',
    paddingBottom: 4,
  },
  text: {
    fontSize: 11,
    lineHeight: 1.6,
    marginBottom: 8,
    color: '#334155',
  },
  boldText: {
    fontWeight: 'bold',
  },
  table: {
    display: 'table',
    width: '100%',
    marginTop: 10,
    marginBottom: 15,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    minHeight: 30,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f1f5f9',
    fontWeight: 'bold',
  },
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#94a3b8',
    borderTop: '1pt solid #e2e8f0',
    paddingTop: 10,
  },
  dynamicField: {
    fontSize: 11,
    color: '#1e40af',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  fieldValue: {
    fontSize: 11,
    color: '#334155',
    marginBottom: 10,
  },
  image: {
    maxWidth: 200,
    maxHeight: 200,
    objectFit: 'contain',
    marginVertical: 10,
  },
});

// Helper function to replace dynamic fields
const replaceDynamicFields = (content, data) => {
  if (!content) return '';
  let result = content;
  
  // Replace placeholders with actual data
  const replacements = {
    '{{asset_name}}': data.asset?.asset_name || 'N/A',
    '{{asset_id}}': data.asset?.asset_id || 'N/A',
    '{{test_name}}': data.test?.test_name || data.test?.name || 'N/A',
    '{{test_date}}': data.execution?.start_time ? new Date(data.execution.start_time).toLocaleDateString() : 'N/A',
    '{{conductor}}': data.execution?.conducted_by || 'N/A',
    '{{test_result}}': data.execution?.final_result || 'Pending',
    '{{start_time}}': data.execution?.start_time ? new Date(data.execution.start_time).toLocaleString() : 'N/A',
    '{{completion_time}}': data.execution?.completion_time ? new Date(data.execution.completion_time).toLocaleString() : 'N/A',
    '{{manufacturer}}': data.asset?.manufacturer || 'N/A',
    '{{voltage_rating}}': data.asset?.voltage_rating || 'N/A',
  };

  Object.keys(replacements).forEach(key => {
    result = result.replace(new RegExp(key, 'g'), replacements[key]);
  });

  return result;
};

// Render text content (handles both plain text and any legacy HTML)
const renderTextContent = (content) => {
  if (!content) return '';
  // Strip any HTML tags if present (for backwards compatibility)
  const cleaned = content
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
  return cleaned;
};

// Helper to get width style
const getWidthStyle = (width) => {
  switch (width) {
    case 'half': return styles.halfWidth;
    case 'third': return styles.thirdWidth;
    case 'quarter': return styles.quarterWidth;
    default: return styles.fullWidth;
  }
};

// Helper to get alignment style
const getAlignmentStyle = (alignment) => {
  switch (alignment) {
    case 'center': return styles.alignCenter;
    case 'right': return styles.alignRight;
    case 'justify': return styles.alignJustify;
    default: return styles.alignLeft;
  }
};

// Helper to get logo height
const getLogoHeight = (styleConfig) => {
  const height = styleConfig?.maxHeight || '60px';
  const heightNum = parseInt(height);
  return heightNum;
};

// Render a single element
const renderElement = (element, data) => {
  const widthStyle = getWidthStyle(element.width);
  const alignStyle = getAlignmentStyle(element.alignment);

  switch (element.element_type) {
    case 'logo':
      if (!element.image_base64) return null;
      return (
        <View style={[widthStyle, alignStyle, styles.elementWrapper]}>
          <Image 
            src={element.image_base64} 
            style={{ maxHeight: getLogoHeight(element.styles), objectFit: 'contain' }} 
          />
        </View>
      );

    case 'text':
      const textContent = replaceDynamicFields(element.content, data);
      const cleanText = renderTextContent(textContent);
      if (!cleanText) return null;
      return (
        <View style={[widthStyle, alignStyle, styles.elementWrapper]}>
          <Text style={[styles.text, element.alignment === 'justify' && { textAlign: 'justify' }]}>
            {cleanText}
          </Text>
        </View>
      );

    case 'dynamic_field':
      if (!element.field_name) return null;
      const fieldValue = data.execution?.[element.field_name] ||
                        data.asset?.[element.field_name] ||
                        data.test?.[element.field_name] ||
                        'N/A';
      const fieldLabel = element.field_name
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return (
        <View style={[widthStyle, alignStyle, styles.elementWrapper]}>
          <Text style={styles.dynamicField}>{fieldLabel}:</Text>
          <Text style={styles.fieldValue}>{String(fieldValue)}</Text>
        </View>
      );

    case 'table':
      if (!element.table_config) return null;
      const tableConfig = element.table_config;
      const columns = tableConfig.columns || [];
      
      let tableData = [];
      if (tableConfig.data_source === 'test_readings') {
        tableData = (data.execution?.steps_completed || []).map(step => {
          const readings = step.parameter_readings || [];
          return readings.map(reading => ({
            Parameter: reading.parameter_name,
            Reading: `${reading.observed_value} ${reading.unit}`,
            Notes: step.notes || '-',
          }));
        }).flat();
      }

      if (tableData.length === 0) return null;

      return (
        <View style={[widthStyle, styles.elementWrapper]}>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              {columns.map((col, colIndex) => (
                <Text key={colIndex} style={styles.tableCell}>
                  {col}
                </Text>
              ))}
            </View>
            {tableData.slice(0, 20).map((row, rowIndex) => (
              <View key={rowIndex} style={styles.tableRow}>
                {columns.map((col, colIndex) => (
                  <Text key={colIndex} style={styles.tableCell}>
                    {row[col] || '-'}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </View>
      );

    default:
      return null;
  }
};

// Main PDF Document Component
export const ReportPDFDocument = ({ template, data }) => {
  if (!template || !data) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>Error: Template or data not provided</Text>
        </Page>
      </Document>
    );
  }

  // Group elements by section
  const allElements = template.elements || [];
  const headerElements = allElements.filter(e => e.section === 'header').sort((a, b) => a.position - b.position);
  const bodyElements = allElements.filter(e => e.section === 'body').sort((a, b) => a.position - b.position);
  const footerElements = allElements.filter(e => e.section === 'footer').sort((a, b) => a.position - b.position);

  // Group body elements by row
  const groupByRow = (elements) => {
    const rows = {};
    elements.forEach(el => {
      const rowNum = el.row || el.position;
      if (!rows[rowNum]) rows[rowNum] = [];
      rows[rowNum].push(el);
    });
    return Object.values(rows);
  };

  const bodyRows = groupByRow(bodyElements);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section - Fixed on all pages */}
        {headerElements.length > 0 && (
          <View style={styles.headerSection} fixed>
            {groupByRow(headerElements).map((row, rowIndex) => (
              <View key={`header-row-${rowIndex}`} style={styles.row}>
                {row.map((element, index) => (
                  <React.Fragment key={`header-${element.element_id}`}>
                    {renderElement(element, data)}
                  </React.Fragment>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Body Section - Main content */}
        {bodyRows.map((row, rowIndex) => (
          <View key={`body-row-${rowIndex}`} style={row.length > 1 ? styles.row : null}>
            {row.map((element) => (
              <React.Fragment key={`body-${element.element_id}`}>
                {renderElement(element, data)}
              </React.Fragment>
            ))}
          </View>
        ))}

        {/* Footer Section - Fixed on all pages */}
        {footerElements.length > 0 ? (
          <View style={styles.footerSection} fixed>
            {groupByRow(footerElements).map((row, rowIndex) => (
              <View key={`footer-row-${rowIndex}`} style={styles.row}>
                {row.map((element) => (
                  <React.Fragment key={`footer-${element.element_id}`}>
                    {renderElement(element, data)}
                  </React.Fragment>
                ))}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.footerSection} fixed>
            <Text style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center' }}>
              Generated by DMS Insight™ on {new Date().toLocaleString()}
            </Text>
            <Text 
              style={{ fontSize: 9, color: '#94a3b8', textAlign: 'center', marginTop: 2 }}
              render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} 
            />
          </View>
        )}
      </Page>
    </Document>
  );
};

// Export function to generate PDF blob
export const generatePDFBlob = async (template, data) => {
  const { pdf } = await import('@react-pdf/renderer');
  const blob = await pdf(<ReportPDFDocument template={template} data={data} />).toBlob();
  return blob;
};

// Export function to generate base64 PDF
export const generatePDFBase64 = async (template, data) => {
  const blob = await generatePDFBlob(template, data);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
