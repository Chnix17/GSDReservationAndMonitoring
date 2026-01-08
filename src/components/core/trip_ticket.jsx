import { useEffect, useState, useCallback } from "react";
import { Button, Spin } from "antd";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";

// Lightweight local FormField to avoid external dependency
const FormField = ({ label, type = "text", value, onChange, className = "", renderStatic = false }) => {
  // Ensure we never show null, undefined, or empty string as text - use space instead
  const displayValue = (value !== null && value !== undefined && value !== '') ? String(value) : '\u00A0';
  
  return (
    <div className={`flex items-center ${className}`}>
      <label className="text-document-text text-xs font-medium w-1/2 pr-2" style={{ color: '#000000' }}>{label}</label>
      {renderStatic ? (
        <div className="flex-1 border-b border-black p-1 min-h-[22px] relative" style={{ borderBottomWidth: '1px', borderBottomColor: '#000000' }}>
          <span style={{ 
            color: '#000000', 
            fontSize: '12px', 
            lineHeight: '20px', 
            fontWeight: '500',
            fontFamily: 'Arial, sans-serif',
            display: 'block'
          }}>
            {displayValue}
          </span>
        </div>
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-xs bg-transparent border-b border-document-line focus:outline-none p-1 text-document-text"
        />
      )}
    </div>
  );
};

const DriversTicket = ({ initialData = {}, autoExport = false, onExported, onDownloadRequest }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [formData, setFormData] = useState({
    date: initialData.date || "",
    driverName: initialData.driverName || "N/A",
    plateNo: initialData.plateNo || "N/A",
    authorizedPassenger: initialData.authorizedPassenger || "N/A",
    destination: initialData.destination || "N/A",
    purpose: initialData.purpose || "N/A",
    departureTime: "",
    arrivalTime: "",
    speedometerStart: "",
    speedometerEnd: "",
    distanceTraveled: "",
  });

  // Keep form data in sync with incoming initialData, important for autoExport
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date: initialData.date || "",
      driverName: initialData.driverName || "N/A",
      plateNo: initialData.plateNo || "N/A",
      authorizedPassenger: initialData.authorizedPassenger || "N/A",
      destination: initialData.destination || "N/A",
      purpose: initialData.purpose || "N/A",
    }));
  }, [initialData]);

  const [tripDetails, setTripDetails] = useState(
    Array(15).fill(null).map(() => ({ date: "", stopOver: "", purpose: "", odometer: "" }))
  );

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateTripDetail = (index, field, value) => {
    setTripDetails((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const exportToPDF = useCallback(async () => {
    setIsGeneratingPdf(true);
    
    console.log('Starting PDF export with formData:', formData);
    
    // Delay to ensure DOM is fully rendered with all data
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const element = document.getElementById("drivers-ticket");
    if (!element) {
      setIsGeneratingPdf(false);
      return;
    }

    try {
      const fullWidth = element.scrollWidth;
      const fullHeight = element.scrollHeight;
      
      console.log('Capturing element with dimensions:', fullWidth, 'x', fullHeight);
      
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: fullWidth,
        height: fullHeight,
        windowWidth: fullWidth,
        windowHeight: fullHeight,
        scrollX: 0,
        scrollY: -window.scrollY,
        logging: false,
        letterRendering: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Fit image to page while preserving aspect ratio
      let imgWidth = pageWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;
      if (imgHeight > pageHeight) {
        imgHeight = pageHeight;
        imgWidth = (canvas.width * imgHeight) / canvas.height;
      }
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
      pdf.save("drivers-trip-ticket.pdf");
      if (typeof onExported === "function") {
        // Small delay to ensure file save dialog starts before unmount
        setTimeout(() => onExported(), 50);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [onExported, formData]);

  useEffect(() => {
    if (autoExport) {
      // Set current date when exporting in "Month Day, Year" format (e.g., "March 25, 2024")
      const formatDate = (date) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(date).toLocaleDateString('en-US', options);
      };
      const today = formatDate(new Date());
      setFormData(prev => {
        const newData = { ...prev, date: today };
        console.log('Trip Ticket Auto-Export Data:', newData);
        return newData;
      });
      
      // Allow initial render/layout, then export
      const timer = setTimeout(() => {
        exportToPDF();
      }, 800);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoExport]);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-document-background">
      {!autoExport && (
        <div className="mb-4 flex justify-end">
          {isGeneratingPdf ? (
            <Button className="flex items-center gap-2" disabled>
              <Spin size="small" />
              Preparing Download...
            </Button>
          ) : (
            <Button 
              onClick={onDownloadRequest || exportToPDF} 
              className="flex items-center gap-2"
              icon={<Download size={16} />}
            >
              Download Trip Ticket
            </Button>
          )}
        </div>
      )}

      <div
        id="drivers-ticket"
        className="bg-white p-8"
        style={{ width: "1122px", backgroundColor: "#ffffff", color: "#000000" }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-document-header font-bold text-lg tracking-wide" style={{ color: '#000000' }}>
            PHINMA - CAGAYAN DE ORO COLLEGE
          </h1>
          <h2 className="text-document-header font-bold text-xl mt-2" style={{ color: '#000000' }}>
            DRIVER&apos;S TRIP TICKET
          </h2>
        </div>

        {/* Main content - two columns */}
        <div className="grid grid-cols-2 gap-8 items-stretch">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Date */}
            <FormField
              label="DATE"
              value={formData.date}
              onChange={(value) => updateFormData("date", value)}
              renderStatic={autoExport}
            />

            {/* General Services Section */}
            <div>
              <h3 className="text-document-header font-bold text-sm mb-3 text-center" style={{ color: '#000000' }}>
                TO BE FILLED BY THE GENERAL SERVICES
              </h3>
              <div className="space-y-2">
                <FormField
                  label="1. Name of the driver/trip vehicle"
                  value={formData.driverName}
                  onChange={(value) => updateFormData("driverName", value)}
                  renderStatic={autoExport}
                />
                <FormField
                  label="2. Car To be used Plate No"
                  value={formData.plateNo}
                  onChange={(value) => updateFormData("plateNo", value)}
                  renderStatic={autoExport}
                />
                <FormField
                  label="3. Authorized Passenger"
                  value={formData.authorizedPassenger}
                  onChange={(value) => updateFormData("authorizedPassenger", value)}
                  renderStatic={autoExport}
                />
                <FormField
                  label="4. Destination"
                  value={formData.destination}
                  onChange={(value) => updateFormData("destination", value)}
                  renderStatic={autoExport}
                />
                <div className="w-full">
                  <FormField
                    label="5. Purpose"
                    value={formData.purpose}
                    onChange={(value) => updateFormData("purpose", value)}
                    renderStatic={autoExport}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mt-6 text-right">
                
                <p className="text-document-text text-xs font-medium mb-2" style={{ color: '#000000' }}>
                  ENGR. JENNIFER B. TUBA-ON
                </p>
                <div className="border-b border-document-line w-1/2 mb-1 ml-auto"></div>
                <h1 className="text-document-text text-xs font-bold" style={{ color: '#000000' }}>
                  COLLEGE ADMINISTRATOR
                </h1>
              </div>
            </div>

            {/* Driver Section */}
            <div>
              <h3 className="text-document-header font-bold text-sm mb-3 text-center" style={{ color: '#000000' }}>
                TO BE FILLED BY THE DRIVER
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormField
                    label="1. Departure time from the garage"
                    value={formData.departureTime}
                    onChange={(value) => updateFormData("departureTime", value)}
                    className="flex-1 mr-4"
                  />
                  <span className="text-document-text text-sm" style={{ color: '#000000' }}>AM/PM</span>
                </div>
                <div className="flex items-center justify-between">
                  <FormField
                    label="2. Arrival time to the garage"
                    value={formData.arrivalTime}
                    onChange={(value) => updateFormData("arrivalTime", value)}
                    className="flex-1 mr-4"
                  />
                  <span className="text-document-text text-sm" style={{ color: '#000000' }}>AM/PM</span>
                </div>
              </div>

              <p className="text-document-text text-xs mt-4 mb-5" style={{ color: '#000000' }}>
                I hereby certify the correctness of the above statements of records of travel.
              </p>

              <div className="mt-4 text-right">
              <div className="border-b border-document-line w-1/2 mb-1 ml-auto"></div>
                <p className="text-document-text text-xs" style={{ color: '#000000' }}>DRIVER</p>
              </div>
            </div>

            {/* Guard Section */}
            <div>
              <h3 className="text-document-header font-bold text-sm mb-3 text-center" style={{ color: '#000000' }}>
                TO BE FILLED BY THE GUARD
              </h3>
              <h4 className="text-document-text font-bold text-sm mb-2 text-center" style={{ color: '#000000' }}>
                SPEEDOMETER READINGS:
              </h4>
              <div className="space-y-2">
                <FormField
                  label="1. At the beginning of the trip"
                  value={formData.speedometerStart}
                  onChange={(value) => updateFormData("speedometerStart", value)}
                />
                <FormField
                  label="2. At the end of the trip"
                  value={formData.speedometerEnd}
                  onChange={(value) => updateFormData("speedometerEnd", value)}
                />
                <FormField
                  label="3. Distance traveled"
                  value={formData.distanceTraveled}
                  onChange={(value) => updateFormData("distanceTraveled", value)}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Trip Details Table */}
          <div className="ml-4 flex flex-col h-full">
            <h3 className="text-document-header font-bold text-sm mb-4 text-center" style={{ color: '#000000' }}>
              TRIP DETAILS
            </h3>
            <div className="border border-document-line w-full flex-1 flex flex-col">
              {/* Table Header */}
              <div className="grid grid-cols-12 border-b border-document-line bg-form-field">
                <div className="p-2 border-r border-document-line text-center col-span-2 whitespace-nowrap">
                  <span className="text-document-text text-xs font-bold" style={{ color: '#000000' }}>TIME</span>
                </div>
                <div className="p-2 border-r border-document-line text-center col-span-3">
                  <span className="text-document-text text-xs font-bold" style={{ color: '#000000' }}>STOP OVER</span>
                </div>
                <div className="p-2 border-r border-document-line text-center col-span-5">
                  <span className="text-document-text text-xs font-bold" style={{ color: '#000000' }}>PURPOSE</span>
                </div>
                <div className="p-2 text-center col-span-2">
                  <span className="text-document-text text-xs font-bold" style={{ color: '#000000' }}>ODOMETER READING</span>
                </div>
              </div>

              {/* Table Rows */}
              <div className="flex flex-col flex-1">
                {tripDetails.map((detail, index) => {
                  // Safely handle null/undefined values
                  const safeDate = (detail.date !== null && detail.date !== undefined && detail.date !== '') ? String(detail.date) : '\u00A0';
                  const safeStopOver = (detail.stopOver !== null && detail.stopOver !== undefined && detail.stopOver !== '') ? String(detail.stopOver) : '\u00A0';
                  const safePurpose = (detail.purpose !== null && detail.purpose !== undefined && detail.purpose !== '') ? String(detail.purpose) : '\u00A0';
                  const safeOdometer = (detail.odometer !== null && detail.odometer !== undefined && detail.odometer !== '') ? String(detail.odometer) : '\u00A0';
                  
                  return (
                    <div
                      key={index}
                      className="grid grid-cols-12 border-b border-document-line last:border-b-0 flex-1 min-h-[24px]"
                    >
                      <div className="p-1 border-r border-document-line col-span-2">
                        {autoExport ? (
                          <span className="w-full text-xs text-center block" style={{ color: '#000000', fontFamily: 'Arial, sans-serif' }}>
                            {safeDate}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={detail.date || ''}
                            onChange={(e) => updateTripDetail(index, "date", e.target.value)}
                            className="w-full h-full text-xs bg-transparent text-document-text focus:outline-none p-1 text-center"
                            style={{ color: '#000000' }}
                          />
                        )}
                      </div>
                      <div className="p-1 border-r border-document-line col-span-3">
                        {autoExport ? (
                          <span className="w-full text-xs block" style={{ color: '#000000', fontFamily: 'Arial, sans-serif' }}>
                            {safeStopOver}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={detail.stopOver || ''}
                            onChange={(e) => updateTripDetail(index, "stopOver", e.target.value)}
                            className="w-full h-full text-xs bg-transparent text-document-text focus:outline-none p-1"
                            style={{ color: '#000000' }}
                          />
                        )}
                      </div>
                      <div className="p-1 border-r border-document-line col-span-5">
                        {autoExport ? (
                          <span className="w-full text-xs block" style={{ color: '#000000', fontFamily: 'Arial, sans-serif' }}>
                            {safePurpose}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={detail.purpose || ''}
                            onChange={(e) => updateTripDetail(index, "purpose", e.target.value)}
                            className="w-full h-full text-xs bg-transparent text-document-text focus:outline-none p-1"
                            style={{ color: '#000000' }}
                          />
                        )}
                      </div>
                      <div className="p-1 col-span-2">
                        {autoExport ? (
                          <span className="w-full text-xs block" style={{ color: '#000000', fontFamily: 'Arial, sans-serif' }}>
                            {safeOdometer}
                          </span>
                        ) : (
                          <input
                            type="text"
                            value={detail.odometer || ''}
                            onChange={(e) => updateTripDetail(index, "odometer", e.target.value)}
                            className="w-full h-full text-xs bg-transparent text-document-text focus:outline-none p-1"
                            style={{ color: '#000000' }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriversTicket;
