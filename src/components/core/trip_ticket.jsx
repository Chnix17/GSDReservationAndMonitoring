import { useEffect, useState, useCallback } from "react";
import { Button, Spin } from "antd";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Download } from "lucide-react";

// Lightweight local FormField to avoid external dependency
const FormField = ({ label, type = "text", value, onChange, className = "", renderStatic = false }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <label className="text-document-text text-xs font-medium w-1/2 pr-2">{label}</label>
      {renderStatic ? (
        <span className="flex-1 text-xs text-document-text border-b border-document-line p-1 min-h-[22px]">
          {value}
        </span>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-xs bg-transparent border-b border-document-line focus:outline-none p-1 text-document-text"
        />
      )}
    </div>
  );
};

export const DriversTicket = ({ initialData = {}, autoExport = false, onExported }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [formData, setFormData] = useState({
    date: initialData.date || "",
    driverName: initialData.driverName || "",
    plateNo: initialData.plateNo || "",
    authorizedPassenger: initialData.authorizedPassenger || "",
    destination: initialData.destination || "",
    purpose: initialData.purpose || "",
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
      driverName: initialData.driverName || "",
      plateNo: initialData.plateNo || "",
      authorizedPassenger: initialData.authorizedPassenger || "",
      destination: initialData.destination || "",
      purpose: initialData.purpose || "",
    }));
  }, [initialData]);

  const [tripDetails, setTripDetails] = useState(
    Array(12).fill(null).map(() => ({ date: "", stopOver: "", purpose: "", odometer: "" }))
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
    const element = document.getElementById("drivers-ticket");
    if (!element) {
      setIsGeneratingPdf(false);
      return;
    }

    try {
      const fullWidth = element.scrollWidth;
      const fullHeight = element.scrollHeight;
      const canvas = await html2canvas(element, {
        scale: Math.max(2, window.devicePixelRatio || 2),
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: fullWidth,
        height: fullHeight,
        windowWidth: fullWidth,
        windowHeight: fullHeight,
        scrollX: 0,
        scrollY: -window.scrollY,
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
  }, [onExported]);

  useEffect(() => {
    if (autoExport) {
      // Set current date when exporting in "Month Day, Year" format (e.g., "March 25, 2024")
      const formatDate = (date) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(date).toLocaleDateString('en-US', options);
      };
      const today = formatDate(new Date());
      setFormData(prev => ({ ...prev, date: today }));
      
      // Allow initial render/layout, then export
      const timer = setTimeout(() => {
        exportToPDF();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [autoExport, exportToPDF]);

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
              onClick={exportToPDF} 
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
        className="bg-white p-8 border border-document-line"
        style={{ width: "1122px", backgroundColor: "#ffffff" }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-document-header font-bold text-lg tracking-wide">
            PHINMA - CAGAYAN DE ORO COLLEGE
          </h1>
          <h2 className="text-document-header font-bold text-xl mt-2">
            DRIVER&apos;S TRIP TICKET
          </h2>
        </div>

        {/* Main content - two columns */}
        <div className="grid grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Date */}
            <FormField
              label="DATE"
              type="date"
              value={formData.date}
              onChange={(value) => updateFormData("date", value)}
              renderStatic={autoExport}
            />

            {/* General Services Section */}
            <div>
              <h3 className="text-document-header font-bold text-sm mb-3 text-center">
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
                
                <p className="text-document-text text-xs font-medium mb-2">
                  ENGR. JENNIFER B. TUBA-ON
                </p>
                <div className="border-b border-document-line w-1/2 mb-1 ml-auto"></div>
                <h1 className="text-document-text text-xs font-bold">
                  COLLEGE ADMINISTRATOR
                </h1>
              </div>
            </div>

            {/* Driver Section */}
            <div>
              <h3 className="text-document-header font-bold text-sm mb-3 text-center">
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
                  <span className="text-document-text text-sm">AM/PM</span>
                </div>
                <div className="flex items-center justify-between">
                  <FormField
                    label="2. Arrival time to the garage"
                    value={formData.arrivalTime}
                    onChange={(value) => updateFormData("arrivalTime", value)}
                    className="flex-1 mr-4"
                  />
                  <span className="text-document-text text-sm">AM/PM</span>
                </div>
              </div>

              <p className="text-document-text text-xs mt-4 mb-5">
                I hereby certify the correctness of the above statements of records of travel.
              </p>

              <div className="mt-4 text-right">
              <div className="border-b border-document-line w-1/2 mb-1 ml-auto"></div>
                <p className="text-document-text text-xs">DRIVER</p>
              </div>
            </div>

            {/* Guard Section */}
            <div>
              <h3 className="text-document-header font-bold text-sm mb-3 text-center">
                TO BE FILLED BY THE GUARD
              </h3>
              <h4 className="text-document-text font-bold text-sm mb-2 text-center">
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
          <div className="ml-4">
            <h3 className="text-document-header font-bold text-sm mb-4 text-center">
              TRIP DETAILS
            </h3>
            <div className="border border-document-line w-full">
              {/* Table Header */}
              <div className="grid grid-cols-12 border-b border-document-line bg-form-field">
                <div className="p-2 border-r border-document-line text-center col-span-2 whitespace-nowrap">
                  <span className="text-document-text text-xs font-bold">TIME</span>
                </div>
                <div className="p-2 border-r border-document-line text-center col-span-3">
                  <span className="text-document-text text-xs font-bold">STOP OVER</span>
                </div>
                <div className="p-2 border-r border-document-line text-center col-span-5">
                  <span className="text-document-text text-xs font-bold">PURPOSE</span>
                </div>
                <div className="p-2 text-center col-span-2">
                  <span className="text-document-text text-xs font-bold">ODOMETER READING</span>
                </div>
              </div>

              {/* Table Rows */}
              {tripDetails.map((detail, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 border-b border-document-line last:border-b-0"
                >
                  <div className="p-1 border-r border-document-line col-span-2">
                    <input
                      type="time"
                      value={detail.date}
                      onChange={(e) => updateTripDetail(index, "date", e.target.value)}
                      className="w-full text-xs bg-transparent text-document-text focus:outline-none p-1 text-center"
                    />
                  </div>
                  <div className="p-1 border-r border-document-line col-span-3">
                    <input
                      type="text"
                      value={detail.stopOver}
                      onChange={(e) => updateTripDetail(index, "stopOver", e.target.value)}
                      className="w-full text-xs bg-transparent text-document-text focus:outline-none p-1"
                    />
                  </div>
                  <div className="p-1 border-r border-document-line col-span-5">
                    <input
                      type="text"
                      value={detail.purpose}
                      onChange={(e) => updateTripDetail(index, "purpose", e.target.value)}
                      className="w-full text-xs bg-transparent text-document-text focus:outline-none p-1"
                    />
                  </div>
                  <div className="p-1 col-span-2">
                    <input
                      type="text"
                      value={detail.odometer}
                      onChange={(e) => updateTripDetail(index, "odometer", e.target.value)}
                      className="w-full text-xs bg-transparent text-document-text focus:outline-none p-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
