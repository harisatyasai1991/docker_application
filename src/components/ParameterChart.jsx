import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

/**
 * ParameterChart - Auto-generates charts from test parameter data
 * Supports: Bar charts for parameter comparison, Line charts for trends
 */
export const ParameterChart = ({ report, chartType = 'auto' }) => {
  const { chartData, hasNumericData, parameterStats } = useMemo(() => {
    const steps = report?.execution_data?.steps_completed || [];
    const testValues = report?.test_values || report?.execution_data?.test_values || {};
    
    // Collect all parameter readings
    const allReadings = [];
    steps.forEach(step => {
      if (step.parameter_readings) {
        step.parameter_readings.forEach(reading => {
          const value = parseFloat(reading.observed_value || reading.value);
          if (!isNaN(value)) {
            allReadings.push({
              name: reading.parameter_name,
              value: value,
              unit: reading.unit || '',
              step: step.step_number
            });
          }
        });
      }
    });

    // Also include legacy test_values
    Object.entries(testValues).forEach(([name, val]) => {
      const value = parseFloat(val);
      if (!isNaN(value)) {
        allReadings.push({
          name: name.replace(/_/g, ' '),
          value: value,
          unit: '',
          step: 0
        });
      }
    });

    // Group by parameter name
    const paramGroups = {};
    allReadings.forEach(r => {
      if (!paramGroups[r.name]) {
        paramGroups[r.name] = [];
      }
      paramGroups[r.name].push(r);
    });

    // Calculate stats
    const stats = Object.entries(paramGroups).map(([name, readings]) => {
      const values = readings.map(r => r.value);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      return {
        name,
        avg: avg.toFixed(2),
        min: min.toFixed(2),
        max: max.toFixed(2),
        count: values.length,
        unit: readings[0]?.unit || ''
      };
    });

    // Prepare chart data
    const labels = Object.keys(paramGroups);
    const values = labels.map(name => {
      const readings = paramGroups[name];
      return readings.reduce((sum, r) => sum + r.value, 0) / readings.length;
    });

    return {
      chartData: {
        labels,
        values,
        paramGroups
      },
      hasNumericData: allReadings.length > 0,
      parameterStats: stats
    };
  }, [report]);

  if (!hasNumericData) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No numeric parameter data available for charts</p>
        </CardContent>
      </Card>
    );
  }

  // Bar Chart Data
  const barData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Parameter Values',
        data: chartData.values,
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(249, 115, 22, 0.7)',
          'rgba(139, 92, 246, 0.7)',
          'rgba(236, 72, 153, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(251, 191, 36, 0.7)',
          'rgba(99, 102, 241, 0.7)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(99, 102, 241, 1)',
        ],
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Parameter Comparison',
        font: { size: 14, weight: 'bold' },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const stat = parameterStats[context.dataIndex];
            return `Value: ${context.raw.toFixed(2)} ${stat?.unit || ''}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  // Doughnut Chart for distribution
  const doughnutData = {
    labels: chartData.labels.slice(0, 6),
    datasets: [
      {
        data: chartData.values.slice(0, 6),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 10,
          font: { size: 11 }
        }
      },
      title: {
        display: true,
        text: 'Parameter Distribution',
        font: { size: 14, weight: 'bold' },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Parameter Statistics */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Parameter Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {parameterStats.slice(0, 8).map((stat, idx) => (
              <div key={idx} className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground truncate">{stat.name}</p>
                <p className="text-lg font-bold text-primary">{stat.avg} <span className="text-xs font-normal text-muted-foreground">{stat.unit}</span></p>
                {stat.count > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Min: {stat.min} | Max: {stat.max}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Parameter Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={barData} options={barOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Doughnut Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-600" />
              Value Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/**
 * Generate chart as base64 image for PDF export
 * This creates a temporary canvas element and renders the chart
 */
export const generateChartImage = async (report) => {
  // This would be used for PDF generation
  // For now, return null as jsPDF has limited chart support
  // In production, you could use html2canvas or chart.js built-in toBase64Image
  return null;
};

export default ParameterChart;
