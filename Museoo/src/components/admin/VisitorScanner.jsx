import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

const VisitorScanner = () => {
  const [scanned, setScanned] = useState("");
  const [visitor, setVisitor] = useState(null);
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [useFileInput, setUseFileInput] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [debugInfo, setDebugInfo] = useState({});
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);

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
        setUseFileInput(true);
        return;
      }

      // Check if we're on a secure connection
      if (!isSecure) {
        setCameraError("Camera access requires HTTPS. Using file upload instead.");
        setIsScanning(false);
        setUseFileInput(true);
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
          setScanned(decodedText);
          
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
      setUseFileInput(true);
      
      // Show helpful message for common issues
      if (err.message.includes("No cameras found")) {
        setCameraError("No camera detected. You can still upload QR code images.");
      } else if (err.message.includes("Permission")) {
        setCameraError("Camera permission denied. You can still upload QR code images.");
      } else {
        setCameraError("Camera initialization failed. You can still upload QR code images.");
      }
    }
  };

  const processQRCode = async (decodedText) => {
    try {
      console.log("Processing QR code:", decodedText);
      
      // Check if it's a URL (primary visitor) or JSON (group member)
      if (decodedText.includes("/api/visit/checkin/")) {
        // Handle primary visitor QR code (URL format)
        console.log("Processing primary visitor QR code (URL)");
        const res = await fetch(decodedText);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        const json = await res.json();
        
        if (json.success) {
          setVisitor(json.visitor);
          setError("");
        } else {
          // Handle specific error cases
          if (json.status === 'cancelled') {
            setError("This booking has been cancelled and cannot be checked in.");
          } else if (json.status === 'checked-in') {
            setError("This visitor has already been checked in.");
          } else {
            setError(json.error || "Check-in failed");
          }
        }
      } else {
        // Try to parse as JSON (group member QR code)
        try {
          console.log("Processing group member QR code (JSON)");
          console.log("Raw decoded text:", JSON.stringify(decodedText));
          console.log("Decoded text length:", decodedText.length);
          const qrData = JSON.parse(decodedText);
          console.log("Parsed QR data:", qrData);
          console.log("QR data type:", qrData.type);
          
          if (qrData.type === 'group_member' || qrData.type === 'additional_visitor') {
            // Send the QR data to the unified scanning endpoint
            const res = await fetch('http://localhost:3000/api/slots/visit/qr-scan', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ qrData: decodedText })
            });
            
            const json = await res.json();
            
            if (json.success) {
              setVisitor(json.visitor);
              setError("");
            } else {
              setError(json.error || "Failed to process visitor QR code");
            }
          } else if (qrData.type === 'primary_visitor') {
            // Handle legacy primary visitor JSON format
            console.log("Processing legacy primary visitor QR code (JSON)");
            const res = await fetch('http://localhost:3000/api/slots/visit/qr-scan', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ qrData: decodedText })
            });
            
            const json = await res.json();
            
            if (json.success) {
              setVisitor(json.visitor);
              setError("");
            } else {
              setError(json.error || "Failed to process primary visitor QR code");
            }
          } else {
            setError("Invalid QR code type. Expected 'additional_visitor', 'group_member', or 'primary_visitor'.");
          }
        } catch (parseError) {
          console.error("Error parsing QR code as JSON:", parseError);
          console.error("Raw data that failed to parse:", JSON.stringify(decodedText));
          console.error("Data length:", decodedText.length);
          console.error("Parse error details:", parseError.message);
          setError(`Invalid QR code format. Expected check-in URL or valid JSON data. Parse error: ${parseError.message}`);
        }
      }
    } catch (err) {
      console.error("Error processing QR code:", err);
      setError("Failed to process QR code: " + err.message);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setError("");
      setScanned("");
      setVisitor(null);
      
      // Create a new Html5Qrcode instance for file reading
      const html5QrCode = new Html5Qrcode("file-reader");
      
      // Read QR code from file using the correct method
      const decodedText = await html5QrCode.readFile(file);
      console.log("File upload - decoded text:", decodedText);
      setScanned(decodedText);
      await processQRCode(decodedText);
    } catch (err) {
      console.error("Error reading QR code from file:", err);
      setError("Failed to read QR code from file. Please ensure the image contains a valid QR code.");
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
    setUseFileInput(false);
    setManualInput("");
    if (isScanning) {
      stopScanner();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleManualSubmit = async () => {
    if (!manualInput.trim()) return;
    
    try {
      setError("");
      setScanned(manualInput);
      await processQRCode(manualInput);
    } catch (err) {
      console.error("Error processing manual input:", err);
      setError("Failed to process manual input: " + err.message);
    }
  };

  const testWithSampleData = async () => {
    const sampleData = "http://localhost:3000/api/slots/visit/checkin/21";
    setManualInput(sampleData);
    try {
      setError("");
      setScanned(sampleData);
      await processQRCode(sampleData);
    } catch (err) {
      console.error("Error processing sample data:", err);
      setError("Failed to process sample data: " + err.message);
    }
  };

  const testWithGroupMemberData = async () => {
    const sampleGroupData = JSON.stringify({
      type: 'group_member',
      memberId: 123,
      bookingId: 456,
      email: 'jane.doe@example.com',
      visitDate: '2025-01-15',
      visitTime: '14:00 - 15:00',
      institution: 'University of Technology',
      groupLeader: 'John Smith',
      purpose: 'educational',
      detailsCompleted: true,
      firstName: 'Jane',
      lastName: 'Doe',
      gender: 'female',
      nationality: 'Filipino',
      address: '123 Main Street, Manila'
    });
    setManualInput(sampleGroupData);
    try {
      setError("");
      setScanned(sampleGroupData);
      await processQRCode(sampleGroupData);
    } catch (err) {
      console.error("Error processing group member data:", err);
      setError("Failed to process group member data: " + err.message);
    }
  };

  const testWithAdditionalVisitorData = async () => {
    const sampleTokenData = JSON.stringify({
      type: 'additional_visitor',
      tokenId: 'ADD-BOOK123-1',
      bookingId: 123,
      email: 'juan.delacruz@example.com',
      visitDate: '2025-01-15',
      visitTime: '14:00 - 15:00',
      groupLeader: 'John Smith'
    });
    setManualInput(sampleTokenData);
    try {
      setError("");
      setScanned(sampleTokenData);
      await processQRCode(sampleTokenData);
    } catch (err) {
      console.error("Error processing additional visitor data:", err);
      setError("Failed to process additional visitor data: " + err.message);
    }
  };

  const testWithRealQrData = async () => {
    const realQrData = JSON.stringify({
      type: 'additional_visitor',
      tokenId: 'ADD-BOOK45-2',
      bookingId: '45',
      email: 'julianafe.amboy56@gmail.com',
      visitDate: '2025-10-22T16:00:00.000Z',
      visitTime: '10:00 - 11:00',
      groupLeader: 'last tect'
    });
    setManualInput(realQrData);
    try {
      setError("");
      setScanned(realQrData);
      await processQRCode(realQrData);
    } catch (err) {
      console.error("Error processing real QR data:", err);
      setError("Failed to process real QR data: " + err.message);
    }
  };

  useEffect(() => {
    // Check camera permission on mount
    checkCameraPermission();
    
    // Set debug info
    setDebugInfo({
      userAgent: navigator.userAgent,
      isSecure: isSecure,
      hasMediaDevices: !!navigator.mediaDevices,
      hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      protocol: window.location.protocol,
      hostname: window.location.hostname
    });
    
    return () => {
      // Cleanup on unmount
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
        html5QrCodeRef.current.clear();
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center text-[#2e2b41]">
          <i className="fa-solid fa-qrcode mr-3 text-[#AB8841]"></i>
          Visitor QR Scanner
        </h1>

        {/* Security Warning */}
        {!isSecure && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">
              <i className="fa-solid fa-exclamation-triangle mr-2"></i>
              Camera Access Notice:
            </h3>
            <div className="text-sm text-yellow-700">
              Camera access requires HTTPS. You can use the file upload option below to scan QR codes from images.
            </div>
          </div>
        )}
        
        {/* Camera Error */}
        {cameraError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">
              <i className="fa-solid fa-camera-slash mr-2"></i>
              Camera Error:
            </h3>
            <div className="text-sm text-red-700">{cameraError}</div>
          </div>
        )}
        
        {/* Scanner Container */}
        <div className="mb-6">
          {!useFileInput ? (
            <div 
              id="qr-reader" 
              ref={scannerRef} 
              className="w-full max-w-sm mx-auto border-2 border-gray-300 rounded-lg overflow-hidden"
              style={{ height: 300 }}
            />
          ) : (
            <div id="file-reader" className="w-full max-w-sm mx-auto border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <i className="fa-solid fa-upload text-4xl text-gray-400 mb-4"></i>
              <p className="text-gray-600 mb-4">Upload QR Code Image</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="qr-file-input"
              />
              <label
                htmlFor="qr-file-input"
                className="bg-[#AB8841] text-white py-2 px-4 rounded-lg hover:bg-[#8B6B21] cursor-pointer transition-colors"
              >
                <i className="fa-solid fa-upload mr-2"></i>
                Choose Image
              </label>
            </div>
          )}
          
          {/* Scanner Status */}
          <div className="mt-4 text-center">
            {isScanning ? (
              <div className="text-green-600">
                <i className="fa-solid fa-camera mr-2"></i>
                Scanning for QR codes...
              </div>
            ) : useFileInput ? (
              <div className="text-blue-600">
                <i className="fa-solid fa-upload mr-2"></i>
                Ready to upload QR code image
              </div>
            ) : (
              <div className="text-gray-500">
                <i className="fa-solid fa-pause mr-2"></i>
                Scanner paused
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-6">
          {!useFileInput && (
            <button
              onClick={startScanner}
              disabled={isScanning || !cameraPermission}
              className="flex-1 bg-[#AB8841] text-white py-2 px-4 rounded-lg hover:bg-[#8B6B21] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <i className="fa-solid fa-play mr-2"></i>
              Start Scan
            </button>
          )}
          {isScanning && (
            <button
              onClick={stopScanner}
              className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <i className="fa-solid fa-stop mr-2"></i>
              Stop Scan
            </button>
          )}
          {!useFileInput && !isScanning && (
            <button
              onClick={() => setUseFileInput(true)}
              className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
            >
              <i className="fa-solid fa-upload mr-2"></i>
              Upload Image
            </button>
          )}
          <button
            onClick={resetScanner}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <i className="fa-solid fa-refresh mr-2"></i>
            Reset
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {scanned && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">
                <i className="fa-solid fa-qrcode mr-2"></i>
                Scanned QR Code:
              </h3>
              <div className="text-sm text-blue-700 break-all">{scanned}</div>
            </div>
          )}
          
          {visitor && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-3">
                <i className="fa-solid fa-user-check mr-2"></i>
                {visitor.firstName ? 'Group Member' : 'Primary Visitor'} Checked In Successfully!
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">Name:</span>
                  <span className="text-green-600">
                    {visitor.firstName || visitor.first_name} {visitor.lastName || visitor.last_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">Email:</span>
                  <span className="text-green-600">{visitor.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">Gender:</span>
                  <span className="text-green-600">{visitor.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">Nationality:</span>
                  <span className="text-green-600">{visitor.nationality || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">Address:</span>
                  <span className="text-green-600">{visitor.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">Visit Date:</span>
                  <span className="text-green-600">{visitor.visitDate || visitor.visit_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">Time Slot:</span>
                  <span className="text-green-600">{visitor.visitTime || visitor.visit_time}</span>
                </div>
                {visitor.institution && visitor.institution !== 'N/A' && (
                  <div className="flex justify-between">
                    <span className="font-medium text-green-700">Institution:</span>
                    <span className="text-green-600">{visitor.institution}</span>
                  </div>
                )}
                {visitor.groupLeader && visitor.groupLeader !== 'N/A' && (
                  <div className="flex justify-between">
                    <span className="font-medium text-green-700">Group Leader:</span>
                    <span className="text-green-600">{visitor.groupLeader}</span>
                  </div>
                )}
                {visitor.detailsCompleted !== undefined && (
                  <div className="flex justify-between">
                    <span className="font-medium text-green-700">Details Completed:</span>
                    <span className="text-green-600">{visitor.detailsCompleted ? 'Yes' : 'No'}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium text-green-700">Check-in Time:</span>
                  <span className="text-green-600">
                    {new Date(visitor.checkin_time || visitor.scanTime).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">
                <i className="fa-solid fa-exclamation-triangle mr-2"></i>
                Error:
              </h3>
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
        </div>

        {/* Debug Panel */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">
            <i className="fa-solid fa-bug mr-2"></i>
            Debug Information:
          </h3>
          <div className="text-xs text-yellow-700 space-y-1">
            <div><strong>Secure Connection:</strong> {debugInfo.isSecure ? 'Yes' : 'No'}</div>
            <div><strong>Protocol:</strong> {debugInfo.protocol}</div>
            <div><strong>Hostname:</strong> {debugInfo.hostname}</div>
            <div><strong>Media Devices:</strong> {debugInfo.hasMediaDevices ? 'Available' : 'Not Available'}</div>
            <div><strong>GetUserMedia:</strong> {debugInfo.hasGetUserMedia ? 'Available' : 'Not Available'}</div>
            <div><strong>Camera Permission:</strong> {cameraPermission ? 'Granted' : 'Not Granted'}</div>
            <div><strong>Scanner Status:</strong> {isScanning ? 'Scanning' : 'Stopped'}</div>
            <div><strong>Mode:</strong> {useFileInput ? 'File Upload' : 'Camera'}</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">
            <i className="fa-solid fa-info-circle mr-2"></i>
            Instructions:
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            {useFileInput ? (
              <>
                <li>• Take a photo of the QR code with your phone</li>
                <li>• Upload the image using the "Choose Image" button</li>
                <li>• The scanner will detect and process the QR code</li>
                <li>• Visitor information will be displayed upon successful check-in</li>
              </>
            ) : (
              <>
                <li>• Allow camera permissions when prompted</li>
                <li>• Point the camera at a visitor's QR code</li>
                <li>• The scanner will automatically detect and process the QR code</li>
                <li>• Visitor information will be displayed upon successful check-in</li>
              </>
            )}
            <li>• Use the Reset button to scan another visitor</li>
          </ul>
          
          {/* Test QR Code Section */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-2">
              <i className="fa-solid fa-bug mr-2"></i>
              Test QR Code:
            </h4>
            <div className="text-xs text-gray-600 break-all bg-white p-2 rounded border">
              <strong>Test URL:</strong> http://localhost:3000/api/slots/visit/checkin/21
            </div>
            <p className="text-xs text-gray-500 mt-1">
              You can generate a QR code with this URL to test the scanner
            </p>
            
            {/* Manual Input for Testing */}
            <div className="mt-3">
              <h5 className="font-medium text-gray-700 mb-2">Manual Input (for testing):</h5>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  placeholder="Paste QR code data here..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <button
                  onClick={handleManualSubmit}
                  disabled={!manualInput.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Test
                </button>
              </div>
              <div className="space-y-2">
                <button
                  onClick={testWithSampleData}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                >
                  <i className="fa-solid fa-play mr-2"></i>
                  Test Primary Visitor QR
                </button>
                <button
                  onClick={testWithGroupMemberData}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  <i className="fa-solid fa-users mr-2"></i>
                  Test Group Member QR
                </button>
                <button
                  onClick={testWithAdditionalVisitorData}
                  className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
                >
                  <i className="fa-solid fa-ticket mr-2"></i>
                  Test Additional Visitor QR
                </button>
                <button
                  onClick={testWithRealQrData}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
                >
                  <i className="fa-solid fa-bug mr-2"></i>
                  Test Real QR Data (ADD-BOOK45-2)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorScanner; 