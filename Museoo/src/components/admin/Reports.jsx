import React, { useState, useEffect } from "react";
import api from "../../config/api";
import AIChat from "./AIChat";
import { canView, canEdit, canAdmin, getAccessLevel } from '../../utils/permissions';

const Reports = ({ userPermissions }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [error, setError] = useState("");
  const [aiStatus, setAiStatus] = useState({ available: false, provider: 'Unknown', message: 'Checking...' });
  const [realTimeInsights, setRealTimeInsights] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');

  // Check permissions
  const canViewReports = canView(userPermissions, 'reports');
  const canEditReports = canEdit(userPermissions, 'reports');
  const canAdminReports = canAdmin(userPermissions, 'reports');
  const accessLevel = getAccessLevel(userPermissions, 'reports');

  console.log("🔍 Reports permissions:", { canViewReports, canEditReports, canAdminReports, accessLevel });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/reports");
      setReports(res.data.reports || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true);
      const [statsRes, insightsRes] = await Promise.all([
        api.get('/api/stats/summary'),
        api.get('/api/reports/real-time-insights')
      ]);
      
      setAnalyticsData(statsRes.data);
      if (insightsRes.data.success) {
        setRealTimeInsights(insightsRes.data.insights);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const checkAIStatus = async () => {
    try {
      const response = await api.get('/api/reports/ai-status');
      if (response.data.success) {
        setAiStatus(response.data.status);
      }
    } catch (error) {
      console.error('Error checking AI status:', error);
      setAiStatus({ available: false, provider: 'Error', message: 'Failed to check AI status' });
    }
  };

  useEffect(() => {
    fetchReports();
    checkAIStatus();
    fetchAnalyticsData();
    
    // Refresh analytics data every 5 minutes
    const interval = setInterval(fetchAnalyticsData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const downloadReport = async (reportId, format = 'pdf') => {
    try {
      const res = await api.get(`/api/reports/${reportId}/download?format=${format}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${reportId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading report:", err);
      setError("Failed to download report");
    }
  };

  const handleAIGenerateReport = async (reportData) => {
    try {
      console.log('handleAIGenerateReport called with:', reportData);
      
      // If the AI returns a report object, display it
      if (reportData) {
        console.log('Setting generated report:', reportData);
        setGeneratedReport(reportData);
        setReports(prev => [reportData, ...prev]);
        console.log('Report set successfully');
      } else {
        console.log('No report data received');
      }
    } catch (error) {
      console.error('Error handling AI report:', error);
      setError("Failed to process AI report");
    }
  };

  const formatReportContent = (reportData) => {
    if (!reportData) return '';
    
    console.log('🔍 Formatting report data:', reportData);
    
    // If it's already HTML content, return as is
    if (typeof reportData === 'string' && reportData.includes('<')) {
      return reportData;
    }
    
    // If it's JSON data, format it into a readable report
    if (typeof reportData === 'object') {
      let html = '<div class="report-content">';
      
      // Check if this is a report from the database (has content field)
      if (reportData.content && typeof reportData.content === 'string') {
                 // This is a report from the database, use the pre-generated content
         html += `
           <div class="mb-6">
             <h3 class="text-lg font-bold text-[#2e2b41] mb-3">AI Generated Report</h3>
             <div class="bg-gray-50 p-4 rounded-lg">
               <div class="prose max-w-none">
                 ${reportData.content}
               </div>
             </div>
           </div>
         `;
      } else {
        // This is raw data from AI generation, format it manually
        
        // Executive Summary
        if (reportData.executiveSummary) {
          html += `
            <div class="mb-6">
              <h3 class="text-lg font-bold text-[#2e2b41] mb-3">Executive Summary</h3>
              <p class="text-gray-700">${reportData.executiveSummary}</p>
            </div>
          `;
        }
        
        // Key Insights
        if (reportData.keyInsights && Array.isArray(reportData.keyInsights)) {
          html += `
            <div class="mb-6">
              <h3 class="text-lg font-bold text-[#2e2b41] mb-3">Key Insights</h3>
              <ul class="list-disc list-inside space-y-2">
                ${reportData.keyInsights.map(insight => `<li class="text-gray-700">${insight}</li>`).join('')}
              </ul>
            </div>
          `;
        }
        
        // AI Recommendations
        if (reportData.aiRecommendations && Array.isArray(reportData.aiRecommendations)) {
          html += `
            <div class="mb-6">
              <h3 class="text-lg font-bold text-[#2e2b41] mb-3">AI Recommendations</h3>
              <ul class="list-disc list-inside space-y-2">
                ${reportData.aiRecommendations.map(rec => `<li class="text-gray-700">${rec}</li>`).join('')}
              </ul>
            </div>
          `;
        }
        
        // Visitor Information Table
        if (reportData.visitorDetails && Array.isArray(reportData.visitorDetails)) {
          html += `
            <div class="mb-6">
              <h3 class="text-lg font-bold text-[#2e2b41] mb-3">Complete Visitor Information</h3>
              <p class="text-sm text-gray-600 mb-4">Showing all visitor information recorded in the visitor section for those who actually entered the museum (based on QR scan check-in time)</p>
              <div class="overflow-x-auto">
                <table class="min-w-full bg-white border border-gray-300">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Visitor ID</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Name</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Gender</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Visitor Type</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Email</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Address</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Purpose</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Main Visitor</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Registration Date</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Booking ID</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Entry Date</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Visit Time</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Time Slot</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Status</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    ${reportData.visitorDetails.map(visitor => `
                      <tr>
                        <td class="px-4 py-2 text-sm text-gray-900">${visitor.visitor_id}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${visitor.first_name} ${visitor.last_name}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${visitor.gender}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${visitor.visitor_type}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${visitor.email}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${visitor.address}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${visitor.purpose}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${visitor.is_main_visitor ? 'Yes' : 'No'}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${new Date(visitor.registration_date).toLocaleDateString()}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${visitor.booking_id}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${new Date(visitor.visit_date).toLocaleDateString()}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${new Date(visitor.checkin_time).toLocaleString()}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${visitor.time_slot}</td>
                        <td class="px-4 py-2 text-sm text-gray-900">${visitor.booking_status}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        }
      }
      
      html += '</div>';
      return html;
    }
    
    return reportData;
  };

  // Check if user has permission to view reports
  if (!canViewReports) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-ban text-red-600 text-2xl"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access the Reports section.</p>
          <div className="text-sm text-gray-500">
            <p>Required permission: <span className="font-semibold">Reports Access</span></p>
            <p>Your status: <span className="font-semibold">{accessLevel === 'access' ? 'Have Access' : 'Access Hidden'}</span></p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[#2e2b41]">
          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
          Loading reports...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#2e2b41] mb-2">
              <i className="fa-solid fa-chart-bar mr-3 text-[#AB8841]"></i>
              AI-Powered Reports & Analytics
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Chat with AI to generate comprehensive reports with advanced insights, predictive analytics, and real-time recommendations
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm text-gray-500">AI Assistant</p>
            <div className={`text-sm font-semibold ${aiStatus.available ? 'text-green-600' : 'text-orange-600'}`}>
              <i className={`fa-solid ${aiStatus.available ? 'fa-robot' : 'fa-exclamation-triangle'} mr-1`}></i>
              {aiStatus.available ? 'Active' : 'Limited'}
            </div>
            <p className="text-xs text-gray-500 mt-1">{aiStatus.provider}</p>
            {!aiStatus.available && (
              <p className="text-xs text-orange-600 mt-1">{aiStatus.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#2e2b41]">
            <i className="fa-solid fa-chart-pie mr-2 text-[#AB8841]"></i>
            Museum Analytics Dashboard
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Timeframe:</span>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-[#AB8841] focus:border-[#AB8841]"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
            </select>
          </div>
        </div>

        {analyticsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-[#2e2b41]">
              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              Loading analytics...
            </div>
          </div>
        ) : analyticsData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Metrics */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#2e2b41] mb-4">Key Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Total Visitors</p>
                      <p className="text-2xl font-bold text-blue-800">{analyticsData.visitors?.toLocaleString() || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                      <i className="fa-solid fa-users text-white"></i>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    <i className="fa-solid fa-arrow-up mr-1"></i>
                    +{analyticsData.todayVisitors || 0} today
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Cultural Objects</p>
                      <p className="text-2xl font-bold text-green-800">{analyticsData.culturalObjects?.toLocaleString() || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <i className="fa-solid fa-landmark text-white"></i>
                    </div>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    <i className="fa-solid fa-database mr-1"></i>
                    In collection
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Archive Files</p>
                      <p className="text-2xl font-bold text-purple-800">{analyticsData.archives?.toLocaleString() || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                      <i className="fa-solid fa-box-archive text-white"></i>
                    </div>
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    <i className="fa-solid fa-folder mr-1"></i>
                    Digital archives
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-orange-600 font-medium">Total Events</p>
                      <p className="text-2xl font-bold text-orange-800">{analyticsData.events?.toLocaleString() || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                      <i className="fa-solid fa-calendar-week text-white"></i>
                    </div>
                  </div>
                  <p className="text-xs text-orange-600 mt-2">
                    <i className="fa-solid fa-calendar mr-1"></i>
                    +{analyticsData.exhibits || 0} exhibits
                  </p>
                </div>
              </div>
            </div>

            {/* Analytics Chart */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#2e2b41] mb-4">Visitor Trends</h3>
              <div className="bg-gray-50 rounded-lg p-4 h-64 flex items-center justify-center">
                <div className="text-center">
                  <i className="fa-solid fa-chart-line text-4xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500 text-sm">Interactive chart would be displayed here</p>
                  <p className="text-gray-400 text-xs mt-2">
                    Showing {selectedTimeframe} data for visitor trends
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <i className="fa-solid fa-chart-bar text-4xl mb-4 text-gray-300"></i>
            <p>Unable to load analytics data</p>
          </div>
        )}
      </div>

      {/* Real-Time AI Insights */}
      {realTimeInsights && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#2e2b41]">
              <i className="fa-solid fa-bolt mr-2 text-blue-600"></i>
              Real-Time AI Insights
            </h2>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              <i className="fa-solid fa-circle mr-1"></i>
              Live
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {realTimeInsights.map((insight, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border border-blue-200">
                <div className="flex items-center mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    insight.type === 'positive' ? 'bg-green-100 text-green-600' :
                    insight.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <i className={`fa-solid ${insight.icon} text-sm`}></i>
                  </div>
                  <h3 className="font-semibold text-[#2e2b41]">{insight.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Report Display */}
      {generatedReport && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#2e2b41]">
              <i className="fa-solid fa-file-alt mr-2 text-[#AB8841]"></i>
              AI Generated Report
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => downloadReport(generatedReport.id, 'pdf')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <i className="fa-solid fa-download mr-1"></i>
                PDF
              </button>
              <button
                onClick={() => downloadReport(generatedReport.id, 'excel')}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                <i className="fa-solid fa-file-excel mr-1"></i>
                Excel
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-[#2e2b41] mb-2">{generatedReport.title || 'AI Generated Report'}</h3>
            <p className="text-gray-600 text-sm mb-3">{generatedReport.description || 'Comprehensive analysis generated by AI'}</p>
            <div className="flex flex-wrap gap-4 text-xs text-gray-500">
              <span>Generated: {new Date(generatedReport.created_at || Date.now()).toLocaleString()}</span>
              {generatedReport.start_date && generatedReport.end_date && (
                <span>Period: {generatedReport.start_date} to {generatedReport.end_date}</span>
              )}
              <span>Type: {generatedReport.report_type || 'AI Analysis'}</span>
            </div>
          </div>

          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: formatReportContent(generatedReport.content || generatedReport) }} />
          </div>
        </div>
      )}

             {/* AI Chat Section - Much Larger */}
       <div className="bg-white rounded-lg shadow-lg border border-gray-200 min-h-[1200px]">
         <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-[#AB8841] to-[#8B6B21]">
           <h3 className="text-2xl font-bold text-white">
             <i className="fa-solid fa-comments mr-3"></i>
             Chat with AI Assistant
           </h3>
           <p className="text-white/80 text-base mt-2">
             Ask me to generate any report you need. For example: "Generate a visitor analytics report for this month" or "Create a financial summary report"
           </p>
         </div>
         <div className="p-6 h-full">
           <AIChat onGenerateReport={handleAIGenerateReport} />
         </div>
       </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#AB8841] to-[#8B6B21]">
          <h3 className="text-lg font-bold text-white">
            <i className="fa-solid fa-history mr-2"></i>
            Recent Reports
          </h3>
        </div>
        <div className="p-6">
          {reports.length > 0 ? (
            <div className="space-y-4">
              {reports.slice(0, 5).map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#AB8841] rounded-full flex items-center justify-center">
                      <i className="fa-solid fa-file-alt text-white"></i>
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#2e2b41]">{report.title}</h4>
                      <p className="text-sm text-gray-600">
                        {report.report_type} • {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                                     <div className="flex gap-2">
                     <button
                       onClick={() => setGeneratedReport(report)}
                       className="text-blue-600 hover:text-blue-700 transition-colors"
                       title="View Report"
                     >
                       <i className="fa-solid fa-eye"></i>
                     </button>
                     <button
                       onClick={() => downloadReport(report.id, 'pdf')}
                       className="text-[#AB8841] hover:text-[#8B6B21] transition-colors"
                       title="Download PDF"
                     >
                       <i className="fa-solid fa-download"></i>
                     </button>
                     <button
                       onClick={() => downloadReport(report.id, 'excel')}
                       className="text-green-600 hover:text-green-700 transition-colors"
                       title="Download Excel"
                     >
                       <i className="fa-solid fa-file-excel"></i>
                     </button>
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <i className="fa-solid fa-file-alt text-4xl mb-4 text-gray-300"></i>
              <p>No reports generated yet</p>
              <p className="text-sm">Chat with the AI assistant above to generate your first report</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports; 