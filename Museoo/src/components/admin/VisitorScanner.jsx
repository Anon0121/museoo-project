import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import api, { API_BASE_URL } from "../../config/api";

const VisitorScanner = () => {
  const [scanned, setScanned] = useState("");
  const [visitor, setVisitor] = useState(null);
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [backupCode, setBackupCode] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [inputMode, setInputMode] = useState("qr");
  const [showManualInput, setShowManualInput] = useState(false); // "qr" or "backup"


  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Check if we're on HTTPS (required for camera access on mobile)
  const isSecure = window.location.protocol === 'https:' || 
                   window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname.includes('192.168.');

  const checkCameraPermission = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported");
      }
      
      // Request camera permission with more specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Stop the stream immediately after permission check
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission(true);
      setCameraError("");
      return true;
    } catch (err) {
      console.error("Camera permission error:", err);
      setCameraPermission(false);
      if (err.name === 'NotAllowedError') {
        setCameraError("Camera access denied. Please allow camera permissions and refresh the page.");
      } else if (err.name === 'NotFoundError') {
        setCameraError("No camera found on this device.");
      } else if (err.name === 'NotSupportedError') {
        setCameraError("Camera not supported on this device.");
      } else if (err.name === 'NotReadableError') {
        setCameraError("Camera is already in use by another application.");
      } else {
        setCameraError("Camera access error: " + err.message);
      }
      return false;
    }
  };

    const startScanner = async () => {
    if (!scannerRef.current) {
      console.error("Scanner ref not available");
      setError("Scanner initialization failed");
      return;
    }
    
    try {
      setError("");
      setCameraError("");
      setIsScanning(true);
      
      console.log("Starting scanner...");
      console.log("Scanner ref ID:", scannerRef.current.id);
      
      // Check camera permission first
      const hasPermission = await checkCameraPermission();
      if (!hasPermission) {
        setIsScanning(false);
        return;
      }

      // Check if we're on a secure connection
      if (!isSecure) {
        setCameraError("Camera access requires HTTPS connection.");
        setIsScanning(false);
        return;
      }
      
      console.log("Creating Html5Qrcode instance...");
      html5QrCodeRef.current = new Html5Qrcode(scannerRef.current.id);
      
      // Get available cameras
      console.log("Getting available cameras...");
      const devices = await Html5Qrcode.getCameras();
      console.log("Available cameras:", devices);
      
      if (devices && devices.length === 0) {
        throw new Error("No cameras found on this device");
      }

      // Try to use back camera first, then any available camera
      let cameraId = null;
      const backCamera = devices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      );
      
      if (backCamera) {
        cameraId = backCamera.id;
        console.log("Using back camera:", backCamera.label);
      } else if (devices.length > 0) {
        cameraId = devices[0].id;
        console.log("Using first available camera:", devices[0].label);
      }

      if (!cameraId) {
        throw new Error("No camera available");
      }
      
      await html5QrCodeRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          console.log("QR Code detected:", decodedText);
          setScanned("QR Code scanned successfully! Processing...");
          
          // Stop scanning after successful scan
          if (html5QrCodeRef.current) {
            try {
              await html5QrCodeRef.current.stop();
              setIsScanning(false);
            } catch (stopError) {
              console.error("Error stopping scanner:", stopError);
              setIsScanning(false);
            }
          }
          
          // Process the QR code
          await processQRCode(decodedText);
        },
        (err) => {
          // Only log non-transient errors to reduce noise
          if (!err.message.includes("NotFoundException") && !err.message.includes("No MultiFormat Readers")) {
            console.log("Scan error (continuing):", err);
          }
        }
      );
      
      setCameraPermission(true);
    } catch (err) {
      console.error("Scanner initialization error:", err);
      setError("Failed to initialize scanner: " + err.message);
      setIsScanning(false);
      setCameraPermission(false);
      
      // Show helpful message for common issues
      if (err.message.includes("No cameras found")) {
        setCameraError("No camera detected. Please use manual input as backup.");
      } else if (err.message.includes("Permission")) {
        setCameraError("Camera permission denied. Please use manual input as backup.");
      } else {
        setCameraError("Camera initialization failed. Please use manual input as backup.");
      }
      
      // Clean up any partial initialization
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (cleanupError) {
          console.log("Cleanup error (ignored):", cleanupError);
        }
      }
    }
  };

  const processQRCode = async (decodedText) => {
    try {
      console.log("🔍 === QR SCANNER DEBUG START ===");
      console.log("📱 Processing QR code:", decodedText);
      console.log("🌐 API Base URL:", API_BASE_URL);
      console.log("📍 Current Location:", window.location.href);
      console.log("📅 Timestamp:", new Date().toISOString());
      
      // Check if it's a URL (primary visitor) or JSON (group member/event participant)
      if (decodedText.includes("/api/visit/checkin/")) {
        console.log("🎯 Detected: Primary Visitor QR Code (URL format)");
        console.log("📋 URL:", decodedText);
        
        const res = await fetch(decodedText);
        console.log("📡 API Response Status:", res.status);
        console.log("📡 API Response OK:", res.ok);
        
        if (!res.ok) {
          console.error("❌ HTTP Error:", res.status, res.statusText);
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const json = await res.json();
        console.log("📋 API Response Data:", json);
        
        if (json.success) {
          console.log("✅ Primary Visitor Visit Success!");
          setVisitor(json.visitor);
          setError("");
        } else {
          console.error("❌ Primary Visitor Check-in Failed:", json.error);
          // Handle specific error cases
          if (json.status === 'cancelled') {
            setError("This booking has been cancelled and cannot be checked in.");
          } else if (json.status === 'checked-in') {
            setError("This visitor has already visited.");
          } else {
            setError(json.error || "Visit failed");
          }
        }
      } else {
        // Try to parse as JSON for other visitor types
        try {
          const qrData = JSON.parse(decodedText);
          console.log("📋 Parsed QR data:", qrData);
          
          // Check for event participant QR code first
          if (qrData.type === 'event_participant') {
            console.log("🎯 Detected: Event Participant QR Code");
            console.log("🔍 Event Participant QR Data:", qrData);
            
            // Call the event participant check-in API
            const apiUrl = `${API_BASE_URL}/api/event-registrations/checkin`;
            console.log("🌐 Sending request to:", apiUrl);
            
            // Prepare request body - handle both old and new QR code formats
            const requestBody = {
              registration_id: qrData.registration_id,
              event_id: qrData.event_id
            };
            
            // Add email if available (new QR code format)
            if (qrData.email) {
              requestBody.email = qrData.email;
            }
            
            const res = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody)
            });
            
            console.log("📡 API Response Status:", res.status);
            const json = await res.json();
            console.log("📋 API Response Data:", json);
            
            if (json.success) {
              console.log("✅ Event Participant Check-in Success!");
              setVisitor({
                ...json.participant,
                visitorType: 'event_participant',
                displayType: 'Event Participant',
                event_title: json.participant.event_title,
                checkin_time: json.participant.checkin_time
              });
              setError("");
            } else {
              console.error("❌ Event Participant Check-in Failed:", json.error);
              
              // Handle specific event participant error cases
              if (json.error && json.error.includes('already been checked in')) {
                setError("This participant has already been checked in.");
              } else if (json.error && json.error.includes('cancelled')) {
                setError("This registration has been cancelled and cannot be checked in.");
              } else if (json.error && json.error.includes('not approved')) {
                setError("This registration is not approved yet.");
              } else {
                setError(json.error || "Failed to check in event participant");
              }
            }
          } else if (qrData.type === 'additional_visitor') {
            console.log("🎯 Detected: Additional Visitor QR Code (JSON format)");
            console.log("🔍 Additional Visitor QR Data:", qrData);
            
            // Call the additional visitor check-in API
            const apiUrl = `${API_BASE_URL}/api/additional-visitors/${qrData.tokenId}/checkin`;
            console.log("🌐 Sending request to:", apiUrl);
            
            const res = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            
            console.log("📡 API Response Status:", res.status);
            const json = await res.json();
            console.log("📋 API Response Data:", json);
            
            if (json.success) {
              console.log("✅ Additional Visitor Visit Success!");
              console.log("👤 Visitor Data:", json.visitor);
              
              // Check if this is actually a walk-in visitor based on booking type or other identifiers
              const isWalkInVisitor = json.visitor.bookingType === 'ind-walkin' || 
                                    json.visitor.bookingType === 'group-walkin' ||
                                    json.visitor.visitorType === 'walkin_visitor' ||
                                    (qrData.tokenId && (qrData.tokenId.startsWith('WALKIN-') || 
                                                       qrData.tokenId.startsWith('INDWALKIN-') || 
                                                       qrData.tokenId.startsWith('GROUPWALKIN-')));
              
              if (isWalkInVisitor) {
                console.log("🎯 Detected as Walk-in Visitor!");
                // Modify the visitor data to show it's a walk-in visitor
                const walkInVisitorData = {
                  ...json.visitor,
                  visitorType: 'walkin_visitor',
                  displayType: 'Walk-in Visitor'
                };
                setVisitor(walkInVisitorData);
              } else {
                setVisitor(json.visitor);
              }
              setError("");
            } else {
              console.error("❌ Additional Visitor Check-in Failed:", json.error);
              console.error("❌ Error Status:", json.status);
              console.error("❌ Full Error Response:", json);
              setError(json.error || "Failed to process visitor QR code");
            }
          } else if (qrData.type === 'walkin_visitor') {
            console.log("🎯 Processing as Walk-in Visitor");
            console.log("🔍 Walk-in Visitor QR Data:", qrData);
            
            // Check if this is a group walk-in leader or member
            if (qrData.isGroupLeader) {
              console.log("🎯 Processing as Group Walk-in Leader");
              const apiUrl = `${API_BASE_URL}/api/group-walkin-leaders/${qrData.visitorId}/checkin`;
              console.log("🌐 Sending request to:", apiUrl);
              
              const res = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                }
              });
              
              console.log("📡 API Response Status:", res.status);
              const json = await res.json();
              console.log("📋 API Response Data:", json);
              
              if (json.success) {
                console.log("✅ Group Walk-in Leader Visit Success!");
                setVisitor({
                  ...json.visitor,
                  visitorType: 'group_walkin_leader',
                  displayType: 'Group Walk-in Leader'
                });
                setError("");
              } else {
                console.error("❌ Group Walk-in Leader Check-in Failed:", json.error);
                setError(json.error || "Failed to process group walk-in leader QR code");
              }
            } else if (qrData.visitorId && typeof qrData.visitorId === 'string' && qrData.visitorId.startsWith('GROUP-')) {
              console.log("🎯 Processing as Group Walk-in Member");
              // Extract the token part from GROUP-{bookingId}-{tokenId} format
              const parts = qrData.visitorId.split('-');
              const memberVisitorId = parts.slice(2).join('-'); // Get everything after GROUP-{bookingId}-
              console.log("🔍 Extracted member visitor ID:", memberVisitorId);
              console.log("🔍 Full QR visitorId:", qrData.visitorId);
              const apiUrl = `${API_BASE_URL}/api/group-walkin-members/${memberVisitorId}/checkin`;
              console.log("🌐 Sending request to:", apiUrl);
              
              const res = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                }
              });
              
              console.log("📡 API Response Status:", res.status);
              const json = await res.json();
              console.log("📋 API Response Data:", json);
              
              if (json.success) {
                console.log("✅ Group Walk-in Member Visit Success!");
                setVisitor({
                  ...json.visitor,
                  visitorType: 'group_walkin_member',
                  displayType: 'Group Walk-in Member'
                });
                setError("");
              } else {
                console.error("❌ Group Walk-in Member Check-in Failed:", json.error);
                setError(json.error || "Failed to process group walk-in member QR code");
              }
            } else {
              // Handle regular individual walk-in visitor
              console.log("🎯 Processing as Individual Walk-in Visitor");
              console.log("🔍 Individual Walk-in Visitor QR Data:", qrData);
              
              const apiUrl = `${API_BASE_URL}/api/walkin-visitors/${qrData.visitorId}/checkin`;
              console.log("🌐 Sending request to:", apiUrl);
              
              const res = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                }
              });
              
              console.log("📡 API Response Status:", res.status);
              const json = await res.json();
              console.log("📋 API Response Data:", json);
              
              if (json.success) {
                console.log("✅ Individual Walk-in Visitor Visit Success!");
                setVisitor({
                  ...json.visitor,
                  visitorType: 'walkin_visitor',
                  displayType: 'Walk-in Visitor'
                });
                setError("");
              } else {
                console.error("❌ Individual Walk-in Visitor Check-in Failed:", json.error);
                setError(json.error || "Failed to process individual walk-in visitor QR code");
              }
            }
          } else if (qrData.type === 'primary_visitor') {
            console.log("🎯 Processing as Legacy Primary Visitor");
            
            const apiUrl = `${API_BASE_URL}/api/slots/visit/qr-scan`;
            console.log("🌐 Sending request to:", apiUrl);
            
            const res = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ qrData: decodedText })
            });
            
            console.log("📡 API Response Status:", res.status);
            const json = await res.json();
            console.log("📋 API Response Data:", json);
            
            if (json.success) {
              console.log("✅ Legacy Primary Visitor Visit Success!");
              setVisitor(json.visitor);
              setError("");
            } else {
              console.error("❌ Legacy Primary Visitor Check-in Failed:", json.error);
              setError(json.error || "Failed to process primary visitor QR code");
            }
          } else {
            console.error("❌ Invalid QR code type:", qrData.type);
            setError("Invalid QR code type. Expected 'event_participant', 'additional_visitor', 'primary_visitor', 'walkin_visitor', 'group_member', or 'group_walkin_leader'.");
          }
        } catch (parseError) {
          console.error("❌ JSON Parse Error:", parseError);
          console.error("❌ Raw data that failed to parse:", JSON.stringify(decodedText));
          console.error("❌ Parse error details:", parseError.message);
          setError(`Invalid QR code format. Expected check-in URL or valid JSON data. Parse error: ${parseError.message}`);
        }
      }
      
      console.log("🔍 === QR SCANNER DEBUG END ===");
    } catch (err) {
      console.error("❌ === QR SCANNER ERROR ===");
      console.error("❌ Error details:", err);
      console.error("❌ Error message:", err.message);
      console.error("❌ Error stack:", err.stack);
      setError(err.message || "Failed to process QR code");
    }
  };

  const handleManualInput = async () => {
    if (!manualInput.trim()) {
      setError("Please enter a QR code or check-in URL");
      return;
    }

    try {
      setError("");
      setScanned("");
      setVisitor(null);
      
      console.log("Manual input - processing:", manualInput);
      setScanned(manualInput);
      await processQRCode(manualInput);
    } catch (err) {
      console.error("Error processing manual input:", err);
      setError("Failed to process manual input. Please check the format and try again.");
    }
  };

  const handleBackupCode = async () => {
    if (!backupCode.trim()) {
      setError("Please enter the visitor ID, token, registration ID, or participant ID");
      return;
    }

    try {
      setError("");
      setScanned("");
      setVisitor(null);
      
      console.log("Backup code - processing:", backupCode);
      
      // Check if it's an event participant backup code (Registration ID or Participant ID)
      if (backupCode.startsWith('PID') || /^\d+$/.test(backupCode)) {
        console.log("🎯 Detected: Event Participant Backup Code");
        
        const response = await fetch(`${API_BASE_URL}/api/event-registrations/checkin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registration_id: backupCode.trim(),
            manual_checkin: true
          })
        });
        
        const json = await response.json();
        
        if (json.success) {
          console.log("✅ Event Participant Manual Check-in Success!");
          setVisitor({
            ...json.participant,
            visitorType: 'event_participant',
            displayType: 'Event Participant',
            event_title: json.participant.event_title,
            checkin_time: json.participant.checkin_time
          });
          setError("");
          setScanned(`Event Participant: ${backupCode}`);
        } else {
          console.error("❌ Event Participant Manual Check-in Failed:", json.error);
          setError(json.error || "Failed to check in event participant");
        }
      } else {
        // Handle regular visitor backup codes
        const response = await fetch(`${API_BASE_URL}/api/backup-codes/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: backupCode
          })
        });
        
        const json = await response.json();
        
        if (json.success) {
          console.log("✅ Visitor ID validated successfully");
          setVisitor(json.visitor);
          setError("");
          setScanned(`Visitor ID: ${backupCode}`);
        } else {
          console.error("❌ Visitor ID validation failed:", json.error);
          setError(json.error || "Failed to validate visitor ID");
        }
      }
    } catch (err) {
      console.error("Error processing backup code:", err);
      setError("Failed to process backup code. Please check the code and try again.");
    }
  };



  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setIsScanning(false);
  };

  const resetScanner = () => {
    setScanned("");
    setVisitor(null);
    setError("");
    setCameraError("");
    setManualInput("");
    setBackupCode("");
    setInputMode("qr");
    setShowManualInput(false);
    if (isScanning) {
      stopScanner();
    }
  };





  useEffect(() => {
    // Check camera permission on mount
    checkCameraPermission();
    

    
    return () => {
      // Cleanup on unmount
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#AB8841] rounded-full mb-4">
            <i className="fa-solid fa-key text-2xl text-white"></i>
          </div>
          <h1 className="text-3xl font-bold text-[#2e2b41] font-['Lora'] mb-2">
            Visitor Check-In
          </h1>
          <p className="text-gray-600 font-['Telegraph']">
            Scan QR codes or enter visitor ID to check in visitors
          </p>
        </div>

        {/* Security Warning */}
        {!isSecure && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2 font-['Lora']">
              <i className="fa-solid fa-exclamation-triangle mr-2"></i>
              Camera Access Notice:
            </h3>
            <div className="text-sm text-yellow-700 font-['Telegraph']">
              Camera access requires HTTPS connection. Please use manual input as backup.
            </div>
          </div>
        )}
        
        {/* Camera Error */}
        {cameraError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2 font-['Lora']">
              <i className="fa-solid fa-camera-slash mr-2"></i>
              Camera Error:
            </h3>
            <div className="text-sm text-red-700 font-['Telegraph']">{cameraError}</div>
          </div>
        )}
        
        {/* Scanner Container */}
        <div className="mb-6">
          <div 
            id="qr-reader" 
            ref={scannerRef} 
            className="w-full max-w-sm mx-auto border-4 border-[#AB8841] rounded-2xl overflow-hidden shadow-lg"
            style={{ height: 320 }}
          />
          
          {/* Scanner Status */}
          <div className="mt-4 text-center">
            {isScanning ? (
              <div className="text-green-600 font-['Telegraph']">
                <i className="fa-solid fa-camera mr-2"></i>
                Point camera at QR code
              </div>
            ) : (
              <div className="text-gray-500 font-['Telegraph']">
                <i className="fa-solid fa-pause mr-2"></i>
                Scanner ready
              </div>
            )}
          </div>

        </div>

        {/* Manual Check-In Toggle Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg transition-colors font-['Telegraph'] border border-gray-300"
          >
            <i className="fa-solid fa-key mr-2"></i>
            {showManualInput ? 'Hide Manual Check-In' : 'Show Manual Check-In'}
          </button>
        </div>

        {/* Manual Input Section */}
        {showManualInput && (
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-700 mb-3 font-['Lora']">
                <i className="fa-solid fa-key mr-2 text-[#AB8841]"></i>
                Manual Check-In
              </h3>
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter visitor ID, token, registration ID, or participant ID..."
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent font-['Telegraph']"
                  onKeyPress={(e) => e.key === 'Enter' && handleBackupCode()}
                />
                <button
                  onClick={handleBackupCode}
                  className="w-full bg-[#AB8841] text-white py-2 px-4 rounded-lg hover:bg-[#8B6B21] transition-colors font-['Telegraph']"
                >
                  <i className="fa-solid fa-check mr-2"></i>
                  Check In Visitor
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 mb-6">
          {!isScanning ? (
            <button
              onClick={startScanner}
              disabled={!cameraPermission}
              className="flex-1 bg-[#AB8841] text-white py-3 px-4 rounded-lg hover:bg-[#8B6B21] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-['Telegraph'] font-semibold"
            >
              <i className="fa-solid fa-play mr-2"></i>
              Start Scanner
            </button>
          ) : (
            <button
              onClick={stopScanner}
              className="flex-1 bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors font-['Telegraph'] font-semibold"
            >
              <i className="fa-solid fa-stop mr-2"></i>
              Stop Scanner
            </button>
          )}
          <button
            onClick={resetScanner}
            className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors font-['Telegraph'] font-semibold"
          >
            <i className="fa-solid fa-refresh mr-2"></i>
            Reset
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {scanned && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2 font-['Lora']">
                <i className="fa-solid fa-qrcode mr-2"></i>
                Scanned QR Code:
              </h3>
              <div className="text-sm text-blue-700 break-all font-['Telegraph']">{scanned}</div>
            </div>
          )}
          
          {visitor && (
            <div className={`border rounded-lg p-4 ${
              visitor.visitorType === 'event_participant' && visitor.status === 'cancelled' 
                ? 'bg-red-50 border-red-200' 
                : 'bg-green-50 border-green-200'
            }`}>
              <h3 className={`font-semibold mb-3 font-['Lora'] ${
                visitor.visitorType === 'event_participant' && visitor.status === 'cancelled'
                  ? 'text-red-800'
                  : 'text-green-800'
              }`}>
                <i className={`mr-2 ${
                  visitor.visitorType === 'event_participant' && visitor.status === 'cancelled'
                    ? 'fa-solid fa-times-circle text-red-600'
                    : 'fa-solid fa-user-check text-green-600'
                }`}></i>
                {visitor.visitorType === 'event_participant' 
                  ? (visitor.status === 'cancelled' ? 'Event Registration Cancelled' : 'Event Participant Checked In!')
                  : (visitor.displayType || (visitor.visitorType === 'walkin_visitor' ? 'Walk-in Visitor' : 
                     visitor.firstName ? 'Group Member' : 'Primary Visitor')) + ' Visited Successfully!'
                }
              </h3>
              
              {/* Event Participant Specific Information */}
              {visitor.visitorType === 'event_participant' && (
                <div className="mb-4 p-3 bg-white rounded border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">Event:</span>
                    <span className="text-gray-600 font-semibold">{visitor.event_title}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      visitor.status === 'cancelled' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {visitor.status === 'cancelled' ? 'Cancelled' : 'Attended'}
                    </span>
                  </div>
                  {visitor.event_status && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Event Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        visitor.event_status === 'ended' 
                          ? 'bg-red-100 text-red-800'
                          : visitor.event_status === 'in_progress'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {visitor.event_status === 'ended' ? 'Event Ended' :
                         visitor.event_status === 'in_progress' ? 'Event In Progress' : 'Event Not Started'}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-2 text-sm font-['Telegraph']">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Name:</span>
                  <span className="text-gray-600">
                    {visitor.firstName || visitor.first_name} {visitor.lastName || visitor.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="text-gray-600">{visitor.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Gender:</span>
                  <span className="text-gray-600">{visitor.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Visitor Type:</span>
                  <span className="text-gray-600">
                    {visitor.visitorType === 'event_participant' ? 'Event Participant' : (visitor.visitorType || 'Not specified')}
                  </span>
                </div>
                {visitor.address && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Address:</span>
                    <span className="text-gray-600">{visitor.address}</span>
                  </div>
                )}
                {visitor.totalVisitors && visitor.totalVisitors > 1 && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Total Visitors:</span>
                    <span className="text-gray-600">{visitor.totalVisitors}</span>
                  </div>
                )}
                {(visitor.visitDate || visitor.visit_date) && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Visit Date:</span>
                    <span className="text-gray-600">{visitor.visitDate || visitor.visit_date}</span>
                  </div>
                )}
                {(visitor.visitTime || visitor.visit_time) && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Time Slot:</span>
                    <span className="text-gray-600">{visitor.visitTime || visitor.visit_time}</span>
                  </div>
                )}
                {visitor.institution && visitor.institution !== 'N/A' && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Institution:</span>
                    <span className="text-gray-600">{visitor.institution}</span>
                  </div>
                )}
                {visitor.groupLeader && visitor.groupLeader !== 'N/A' && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Group Leader:</span>
                    <span className="text-gray-600">{visitor.groupLeader}</span>
                  </div>
                )}
                {visitor.detailsCompleted !== undefined && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Details Completed:</span>
                    <span className="text-gray-600">{visitor.detailsCompleted ? 'Yes' : 'No'}</span>
                  </div>
                )}
                {visitor.bookingType && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Type:</span>
                    <span className="text-gray-600">{visitor.bookingType}</span>
                  </div>
                )}
                {visitor.allVisitors && visitor.allVisitors.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-2 font-['Lora']">
                      <i className="fa-solid fa-users mr-2"></i>
                      All Visitors in This Booking:
                    </h4>
                    <div className="space-y-2">
                      {visitor.allVisitors.map((v, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded text-sm font-['Telegraph']">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700">
                              {v.firstName} {v.lastName}
                              {v.isPrimary && (
                                <span className="ml-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">Primary</span>
                              )}
                            </span>
                            <span className="text-gray-600">{v.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Check-in Time:</span>
                  <span className="text-gray-600">
                    {(() => {
                      const checkinTime = visitor.checkin_time || visitor.scanTime;
                      console.log('🔍 Debug checkin_time:', {
                        checkin_time: visitor.checkin_time,
                        scanTime: visitor.scanTime,
                        combined: checkinTime,
                        type: typeof checkinTime
                      });
                      
                      if (!checkinTime) {
                        return 'Not set';
                      }
                      
                      try {
                        const date = new Date(checkinTime);
                        if (isNaN(date.getTime())) {
                          console.error('❌ Invalid date:', checkinTime);
                          return 'Invalid Date';
                        }
                        return date.toLocaleString();
                      } catch (error) {
                        console.error('❌ Date parsing error:', error, 'for value:', checkinTime);
                        return 'Invalid Date';
                      }
                    })()}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Success Message */}
          {scanned && !error && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-green-800 mb-2 font-['Lora']">
                <i className="fa-solid fa-check-circle mr-2"></i>
                QR Code Scanned Successfully!
              </h3>
              <div className="text-sm text-green-700 font-['Telegraph']">
                Processing visitor information...
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-red-800 mb-2 font-['Lora']">
                <i className="fa-solid fa-exclamation-triangle mr-2"></i>
                Check-in Error:
              </h3>
              <div className="text-sm text-red-700 font-['Telegraph']">{error}</div>
            </div>
          )}

          {/* Success Check-in Message */}
          {visitor && !error && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-green-800 mb-2 font-['Lora']">
                <i className="fa-solid fa-check-circle mr-2"></i>
                Check-in Successful!
              </h3>
              <div className="text-sm text-green-700 font-['Telegraph']">
                Visitor has been checked in successfully.
              </div>
            </div>
          )}
        </div>

        {/* Quick Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2 font-['Lora']">
            <i className="fa-solid fa-info-circle mr-2"></i>
            Quick Instructions:
          </h3>
          <ul className="text-sm text-blue-700 space-y-1 font-['Telegraph']">
            <li>• <strong>Point camera at QR code</strong> - Scanner will automatically detect and process</li>
            <li>• <strong>Manual input</strong> - Use the backup input field if camera fails</li>
            <li>• <strong>Reset</strong> - Click reset to scan another visitor</li>
            <li>• <strong>HTTPS required</strong> - Camera access needs secure connection</li>
          </ul>
        </div>


      </div>
    </div>
  );
};

export default VisitorScanner; 