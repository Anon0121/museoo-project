import React, { useState, useRef, useEffect } from "react";
import api from "../../config/api";

const AIChat = ({ onGenerateReport }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your AI assistant for museum reports and analytics. I can help you:\n\n• Generate comprehensive reports (visitor analytics, cultural objects, archives, financial)\n• Analyze visitor trends and patterns\n• Provide insights on cultural object popularity\n• Create predictive analytics for resource planning\n• Generate custom reports with AI recommendations\n\nWhat would you like to analyze or report on today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState({ available: false, provider: 'Unknown' });
  const [conversationMode, setConversationMode] = useState('general'); // general, report, analysis
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    checkAIStatus();
  }, [messages]);

  const checkAIStatus = async () => {
    try {
      const response = await api.get('/api/reports/ai-status');
      if (response.data.success) {
        setAiStatus(response.data.status);
      }
    } catch (error) {
      console.error('Error checking AI status:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Check if this is a report generation request
      const lowerInput = inputMessage.toLowerCase();
      const isReportRequest = lowerInput.includes('report') || 
                             lowerInput.includes('generate') || 
                             lowerInput.includes('create') ||
                             lowerInput.includes('analytics') ||
                             lowerInput.includes('summary');

      if (isReportRequest) {
        // Generate a report
        const reportResponse = await generateReport(inputMessage);
        
        const aiMessage = {
          id: Date.now() + 1,
          type: 'ai',
          content: reportResponse.message,
          timestamp: new Date(),
          report: reportResponse.report
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Pass the generated report to parent component
        if (reportResponse.report && onGenerateReport) {
          console.log('Passing report to parent component:', reportResponse.report);
          onGenerateReport(reportResponse.report);
        } else {
          console.log('No report to pass or no onGenerateReport function');
        }
        
        setConversationMode('report');
      } else {
        // Regular chat response
        const response = await api.post('/api/reports/ai-chat', {
          message: inputMessage,
          conversationHistory: messages.slice(-10) // Send last 10 messages for context
        });

        if (response.data.success) {
          const aiMessage = {
            id: Date.now() + 1,
            type: 'ai',
            content: response.data.response,
            timestamp: new Date(),
            actions: response.data.actions || []
          };
          setMessages(prev => [...prev, aiMessage]);
          
          // Update conversation mode based on user input
          if (lowerInput.includes('analyze') || lowerInput.includes('trend')) {
            setConversationMode('analysis');
          }
        } else {
          throw new Error(response.data.message || 'Failed to get AI response');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: "I'm sorry, I encountered an error. Please try again or check your connection.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async (userRequest) => {
    try {
      console.log('Generating report for request:', userRequest);
      
      // Determine report type from user request
      const lowerRequest = userRequest.toLowerCase();
      let reportType = 'comprehensive_dashboard';
      
      if (lowerRequest.includes('visitor') || lowerRequest.includes('visitors')) {
        reportType = 'visitor_analytics';
      } else if (lowerRequest.includes('cultural') || lowerRequest.includes('object')) {
        reportType = 'cultural_objects';
      } else if (lowerRequest.includes('archive') || lowerRequest.includes('digital')) {
        reportType = 'archive_analytics';
      } else if (lowerRequest.includes('financial') || lowerRequest.includes('revenue') || lowerRequest.includes('donation')) {
        reportType = 'financial_report';
      } else if (lowerRequest.includes('event')) {
        reportType = 'event_performance';
      } else if (lowerRequest.includes('exhibit')) {
        reportType = 'exhibit_analytics';
      } else if (lowerRequest.includes('staff') || lowerRequest.includes('performance')) {
        reportType = 'staff_performance';
      } else if (lowerRequest.includes('predict') || lowerRequest.includes('forecast')) {
        reportType = 'predictive_analytics';
      }

      console.log('Selected report type:', reportType);

      // Natural-language date parsing
      const parseDateRange = (text) => {
        const normalize = (d) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const format = (d) => d.toISOString().split('T')[0];

        const now = new Date();
        const today = normalize(now);

        const monthNames = [
          'january','february','march','april','may','june','july','august','september','october','november','december'
        ];

        // Helpers
        const firstDayOfMonth = (year, monthIdx) => new Date(Date.UTC(year, monthIdx, 1));
        const lastDayOfMonth = (year, monthIdx) => new Date(Date.UTC(year, monthIdx + 1, 0));
        const getQuarter = (d) => Math.floor(d.getMonth() / 3) + 1;
        const quarterRange = (q, year) => {
          const startMonth = (q - 1) * 3;
          return {
            start: firstDayOfMonth(year, startMonth),
            end: lastDayOfMonth(year, startMonth + 2)
          };
        };

        const m = text.toLowerCase();

        // Explicit range: from X to Y / between X and Y
        const rangeMatch = m.match(/\b(from|between)\s+([a-z0-9 ,\/-]+?)\s+(to|and)\s+([a-z0-9 ,\/-]+)\b/);
        if (rangeMatch) {
          const startRaw = rangeMatch[2].trim();
          const endRaw = rangeMatch[4].trim();
          const s = new Date(startRaw);
          const e = new Date(endRaw);
          if (!isNaN(s) && !isNaN(e)) {
            return { startDate: format(normalize(s)), endDate: format(normalize(e)) };
          }
        }

        // Last N days
        const lastNDays = m.match(/last\s+(\d{1,3})\s+days?/);
        if (lastNDays) {
          const n = parseInt(lastNDays[1], 10);
          const start = new Date(today);
          start.setUTCDate(start.getUTCDate() - (n - 1));
          return { startDate: format(start), endDate: format(today) };
        }

        // This/Last week
        if (m.includes('this week')) {
          const day = today.getUTCDay();
          const diff = (day + 6) % 7; // Monday=0
          const start = new Date(today);
          start.setUTCDate(start.getUTCDate() - diff);
          const end = new Date(start);
          end.setUTCDate(start.getUTCDate() + 6);
          return { startDate: format(start), endDate: format(end) };
        }
        if (m.includes('last week')) {
          const day = today.getUTCDay();
          const diff = (day + 6) % 7;
          const thisWeekStart = new Date(today);
          thisWeekStart.setUTCDate(thisWeekStart.getUTCDate() - diff);
          const start = new Date(thisWeekStart);
          start.setUTCDate(start.getUTCDate() - 7);
          const end = new Date(thisWeekStart);
          end.setUTCDate(end.getUTCDate() - 1);
          return { startDate: format(start), endDate: format(end) };
        }

        // This/Last month
        if (m.includes('this month')) {
          const start = firstDayOfMonth(today.getUTCFullYear(), today.getUTCMonth());
          const end = lastDayOfMonth(today.getUTCFullYear(), today.getUTCMonth());
          return { startDate: format(start), endDate: format(end) };
        }
        if (m.includes('last month')) {
          const year = today.getUTCMonth() === 0 ? today.getUTCFullYear() - 1 : today.getUTCFullYear();
          const month = (today.getUTCMonth() + 11) % 12;
          const start = firstDayOfMonth(year, month);
          const end = lastDayOfMonth(year, month);
          return { startDate: format(start), endDate: format(end) };
        }

        // This/Last quarter
        if (m.includes('this quarter')) {
          const q = getQuarter(today);
          const { start, end } = quarterRange(q, today.getUTCFullYear());
          return { startDate: format(start), endDate: format(end) };
        }
        if (m.includes('last quarter')) {
          let q = getQuarter(today) - 1;
          let year = today.getUTCFullYear();
          if (q === 0) { q = 4; year -= 1; }
          const { start, end } = quarterRange(q, year);
          return { startDate: format(start), endDate: format(end) };
        }

        // QN YYYY (e.g., Q2 2024)
        const qMatch = m.match(/\bq([1-4])\s*(\d{4})\b/);
        if (qMatch) {
          const q = parseInt(qMatch[1], 10);
          const year = parseInt(qMatch[2], 10);
          const { start, end } = quarterRange(q, year);
          return { startDate: format(start), endDate: format(end) };
        }

        // Month [YYYY] or "for March", "in July 2024"
        for (let i = 0; i < monthNames.length; i++) {
          if (m.includes(monthNames[i])) {
            const yearMatch = m.match(/\b(20\d{2})\b/);
            const year = yearMatch ? parseInt(yearMatch[1], 10) : today.getUTCFullYear();
            const start = firstDayOfMonth(year, i);
            const end = lastDayOfMonth(year, i);
            return { startDate: format(start), endDate: format(end) };
          }
        }

        // Today / Yesterday
        if (m.includes('today')) {
          return { startDate: format(today), endDate: format(today) };
        }
        if (m.includes('yesterday')) {
          const y = new Date(today);
          y.setUTCDate(y.getUTCDate() - 1);
          return { startDate: format(y), endDate: format(y) };
        }

        // Fallback: try to parse single date like "July 15, 2024" or ISO
        const singleDate = new Date(text);
        if (!isNaN(singleDate)) {
          const d = normalize(singleDate);
          return { startDate: format(d), endDate: format(d) };
        }

        return null;
      };

      // Enhance: support phrases like "1 week", "a week", "1 day", "daily/weekly/monthly report"
      const parsed = (() => {
        const m = userRequest.toLowerCase();
        const base = parseDateRange(userRequest);
        if (base) return base;

        const normalize = (d) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const format = (d) => d.toISOString().split('T')[0];
        const today = normalize(new Date());

        // N weeks (without 'last') => last N weeks including today
        const nWeeks = m.match(/(?:for\s+)?(\d{1,2})\s+weeks?/);
        if (nWeeks) {
          const n = parseInt(nWeeks[1], 10);
          const start = new Date(today);
          start.setUTCDate(start.getUTCDate() - (n * 7 - 1));
          return { startDate: format(start), endDate: format(today) };
        }

        // N days (without 'last')
        const nDays = m.match(/(?:for\s+)?(\d{1,3})\s+days?/);
        if (nDays) {
          const n = parseInt(nDays[1], 10);
          const start = new Date(today);
          start.setUTCDate(start.getUTCDate() - (n - 1));
          return { startDate: format(start), endDate: format(today) };
        }

        // A day / one day / day report -> today
        if (m.includes('a day') || m.includes('one day') || m.includes('day report') || m.includes('daily')) {
          return { startDate: format(today), endDate: format(today) };
        }

        // A week / one week / weekly
        if (m.includes('a week') || m.includes('one week') || m.includes('weekly')) {
          const start = new Date(today);
          start.setUTCDate(start.getUTCDate() - 6);
          return { startDate: format(start), endDate: format(today) };
        }

        // Monthly -> this month
        if (m.includes('monthly')) {
          const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
          const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
          return { startDate: format(start), endDate: format(end) };
        }

        // Past week
        if (m.includes('past week')) {
          const start = new Date(today);
          start.setUTCDate(start.getUTCDate() - 6);
          return { startDate: format(start), endDate: format(today) };
        }

        // Last year / This year / YTD
        if (m.includes('last year')) {
          const year = today.getUTCFullYear() - 1;
          const start = new Date(Date.UTC(year, 0, 1));
          const end = new Date(Date.UTC(year, 11, 31));
          return { startDate: format(start), endDate: format(end) };
        }
        if (m.includes('this year') || m.includes('year to date') || m.includes('ytd')) {
          const year = today.getUTCFullYear();
          const start = new Date(Date.UTC(year, 0, 1));
          return { startDate: format(start), endDate: format(today) };
        }

        return null;
      })();
      // Default if no parseable range: broader window
      const now = new Date();
      const defaultStart = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
      const defaultEnd = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

      const reportParams = {
        reportType: reportType,
        startDate: (parsed?.startDate) || defaultStart.toISOString().split('T')[0],
        endDate: (parsed?.endDate) || defaultEnd.toISOString().split('T')[0],
        aiAssisted: true,
        includeCharts: true,
        includeRecommendations: true,
        includePredictions: true,
        includeComparisons: true,
        userRequest: userRequest
      };

      console.log('Report parameters:', reportParams);

      // Generate the report
      const response = await api.post("/api/reports/generate", reportParams);

      console.log('API response:', response.data);

      if (response.data.success) {
        const report = response.data.report;
        console.log('Generated report:', report);
        
        // Create a friendly response message
        const reportNames = {
          'visitor_analytics': 'Visitor Analytics Report',
          'exhibit_analytics': 'Cultural Objects Report',
          'archive_analytics': 'Archive Analysis Report',
          'financial_report': 'Financial Report',
          'event_performance': 'Event Performance Report',
          'staff_performance': 'Staff Performance Report',
          'cultural_objects': 'Cultural Objects Report',
          'predictive_analytics': 'Predictive Analytics Report',
          'comprehensive_dashboard': 'Comprehensive Museum Report'
        };

        const reportName = reportNames[reportType] || 'Custom Report';
        
        return {
          message: `✅ I've generated your ${reportName}!\n\n📊 **Report Summary:**\n• ${report.description}\n• Period: ${report.start_date} to ${report.end_date}\n• Generated with AI insights and recommendations\n\n📄 The report is now displayed above with download options for PDF and Excel formats.`,
          report: report
        };
      } else {
        console.error('API returned error:', response.data);
        
        // Handle specific error cases
        if (response.data.message && response.data.message.includes('No data found')) {
          return {
            message: `📊 I tried to generate your report, but I couldn't find any data for the specified time period.\n\n💡 **Suggestions:**\n• Try a different date range\n• Check if there are any visitors or events in your database\n• Make sure your data is properly entered\n\nWould you like me to try generating a report with all available data instead?`,
            report: null
          };
        }
        
        throw new Error(response.data.message || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      
      // Handle different types of errors
      if (error.message.includes('No data found') || error.message.includes('No visitors found')) {
        return {
          message: `📊 I tried to generate your report, but I couldn't find any data for the specified time period.\n\n💡 **Suggestions:**\n• Try a different date range\n• Check if there are any visitors or events in your database\n• Make sure your data is properly entered\n\nWould you like me to try generating a report with all available data instead?`,
          report: null
        };
      } else if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        return {
          message: `🔌 I'm having trouble connecting to the server. Please check your internet connection and try again.\n\nIf the problem persists, please contact your system administrator.`,
          report: null
        };
      } else {
        return {
          message: `❌ I encountered an error while generating your report: ${error.message}\n\nPlease try again or contact support if the problem continues.`,
          report: null
        };
      }
    }
  };

  const handleAction = (action) => {
    if (action.type === 'generate_report') {
      onGenerateReport(action.params);
    } else if (action.type === 'show_data') {
      // Handle showing specific data
      console.log('Show data action:', action);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        type: 'ai',
        content: "Hello! I'm your AI assistant for museum reports and analytics. I can help you:\n\n• Generate comprehensive reports (visitor analytics, cultural objects, archives, financial)\n• Analyze visitor trends and patterns\n• Provide insights on cultural object popularity\n• Create predictive analytics for resource planning\n• Generate custom reports with AI recommendations\n\nWhat would you like to analyze or report on today?",
        timestamp: new Date()
      }
    ]);
    setConversationMode('general');
  };

  const quickActions = [
    {
      label: "Visitor Analytics",
      icon: "fa-users",
      action: () => {
        setInputMessage("Generate a comprehensive visitor analytics report with trends and patterns");
        setTimeout(() => sendMessage(), 100);
      },
      category: "report"
    },
    {
      label: "Cultural Objects Report",
      icon: "fa-landmark",
      action: () => {
        setInputMessage("Create a detailed report about our cultural objects collection and visitor engagement");
        setTimeout(() => sendMessage(), 100);
      },
      category: "report"
    },
    {
      label: "Archive Analysis",
      icon: "fa-box-archive",
      action: () => {
        setInputMessage("Analyze our digital archive usage and provide insights on popular content");
        setTimeout(() => sendMessage(), 100);
      },
      category: "analysis"
    },
    {
      label: "Financial Summary",
      icon: "fa-chart-line",
      action: () => {
        setInputMessage("Generate a comprehensive financial report with donation analysis and revenue trends");
        setTimeout(() => sendMessage(), 100);
      },
      category: "report"
    },
    {
      label: "Event Performance",
      icon: "fa-calendar-week",
      action: () => {
        setInputMessage("Analyze event performance, attendance metrics, and success factors");
        setTimeout(() => sendMessage(), 100);
      },
      category: "analysis"
    },
    {
      label: "Predictive Analytics",
      icon: "fa-crystal-ball",
      action: () => {
        setInputMessage("Provide AI-powered predictions for visitor trends, cultural object popularity, and resource planning");
        setTimeout(() => sendMessage(), 100);
      },
      category: "analysis"
    },
    {
      label: "Comprehensive Dashboard",
      icon: "fa-tachometer-alt",
      action: () => {
        setInputMessage("Generate a comprehensive museum dashboard report covering all aspects");
        setTimeout(() => sendMessage(), 100);
      },
      category: "report"
    },
    {
      label: "Staff Performance",
      icon: "fa-user-tie",
      action: () => {
        setInputMessage("Show staff performance analysis and productivity metrics");
        setTimeout(() => sendMessage(), 100);
      },
      category: "analysis"
    }
  ];

  const getFilteredQuickActions = () => {
    if (conversationMode === 'general') return quickActions;
    return quickActions.filter(action => action.category === conversationMode);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-full flex flex-col">
             {/* Header */}
       <div className="px-8 py-4 border-b border-gray-200 bg-gradient-to-r from-[#AB8841] to-[#8B6B21]">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-5">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
               <i className="fa-solid fa-robot text-[#AB8841] text-xl"></i>
             </div>
             <div>
               <h3 className="text-2xl font-bold text-white">AI Assistant</h3>
               <p className="text-base text-white/80">
                 {aiStatus.available ? aiStatus.provider : 'Fallback Analysis'}
               </p>
             </div>
           </div>
                     <div className="flex items-center gap-4">
             <div className="flex items-center gap-3">
               <span className="text-base text-white/80 font-medium">Mode:</span>
               <select
                 value={conversationMode}
                 onChange={(e) => setConversationMode(e.target.value)}
                 className="text-base bg-white/20 text-white border border-white/30 rounded-lg px-4 py-3 focus:outline-none font-medium"
               >
                 <option value="general">General</option>
                 <option value="report">Reports</option>
                 <option value="analysis">Analysis</option>
               </select>
             </div>
             <button
               onClick={clearChat}
               className="text-white/80 hover:text-white transition-colors p-3 rounded-lg hover:bg-white/10"
               title="Clear chat"
             >
               <i className="fa-solid fa-trash text-xl"></i>
             </button>
           </div>
        </div>
      </div>

             {/* Messages */}
       <div className="flex-1 overflow-y-auto p-8 space-y-8">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
                         <div
               className={`max-w-md lg:max-w-4xl px-8 py-6 rounded-lg ${
                 message.type === 'user'
                   ? 'bg-[#AB8841] text-white'
                   : message.isError
                   ? 'bg-red-50 text-red-700 border border-red-200'
                   : 'bg-gray-100 text-gray-800'
               }`}
             >
                             <p className="text-lg whitespace-pre-wrap leading-relaxed">{message.content}</p>
              
                             {/* Action buttons for AI messages */}
               {message.actions && message.actions.length > 0 && (
                 <div className="mt-6 space-y-4">
                   {message.actions.map((action, index) => (
                     <button
                       key={index}
                       onClick={() => handleAction(action)}
                       className="w-full text-left px-6 py-4 bg-white border border-gray-300 rounded-lg text-base hover:bg-gray-50 transition-colors font-medium"
                     >
                       <i className={`fa-solid ${action.icon} mr-4`}></i>
                       {action.label}
                     </button>
                   ))}
                 </div>
               )}
              
                             <p className="text-base opacity-70 mt-4">
                 {message.timestamp.toLocaleTimeString()}
               </p>
            </div>
          </div>
        ))}
        
                 {isLoading && (
           <div className="flex justify-start">
             <div className="bg-gray-100 text-gray-800 px-8 py-6 rounded-lg">
               <div className="flex items-center gap-4">
                 <i className="fa-solid fa-spinner fa-spin text-xl"></i>
                 <span className="text-lg font-medium">AI is thinking...</span>
               </div>
             </div>
           </div>
         )}
        
        <div ref={messagesEndRef} />
      </div>

             {/* Quick Actions */}
       <div className="px-8 py-4 border-t border-gray-200 bg-gray-50">
         <div className="flex flex-wrap gap-4 mb-4">
          {getFilteredQuickActions().map((action, index) => (
                         <button
               key={index}
               onClick={action.action}
               className="px-6 py-3 bg-white border border-gray-300 rounded-full text-base hover:bg-gray-50 transition-colors flex items-center gap-3 font-medium"
             >
               <i className={`fa-solid ${action.icon}`}></i>
               {action.label}
             </button>
          ))}
        </div>
      </div>

             {/* Input */}
       <div className="p-6 border-t border-gray-200">
         <div className="flex gap-4">
                     <textarea
             value={inputMessage}
             onChange={(e) => setInputMessage(e.target.value)}
             onKeyPress={handleKeyPress}
             placeholder="Ask me about your museum data, request custom reports, or get insights..."
             className="flex-1 p-6 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-[#AB8841] focus:border-[#AB8841] text-lg"
             rows="4"
             disabled={isLoading}
           />
                     <button
             onClick={sendMessage}
             disabled={!inputMessage.trim() || isLoading}
             className="px-8 py-6 bg-[#AB8841] text-white rounded-lg hover:bg-[#8B6B21] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xl"
           >
             <i className="fa-solid fa-paper-plane"></i>
           </button>
        </div>
        
                 {/* Quick suggestions */}
         <div className="mt-4 flex flex-wrap gap-4">
          {[
            "Generate visitor analytics report",
            "Analyze cultural objects collection",
            "Show archive usage statistics",
            "Create financial summary report",
            "Analyze event performance trends",
            "Predict visitor numbers for next month",
            "Compare this month vs last month",
            "Generate comprehensive dashboard"
          ].map((suggestion, index) => (
                         <button
               key={index}
               onClick={() => setInputMessage(suggestion)}
               className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full text-base hover:bg-gray-200 transition-colors font-medium"
             >
               {suggestion}
             </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIChat; 