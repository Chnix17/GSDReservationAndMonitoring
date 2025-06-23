// GatePass.jsx
import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Function to generate and download the PDF
export const generateGatePassPdf = async (input) => {
    // Adjust scale if PDF quality isn't good. 2 is usually a good starting point.
    const canvas = await html2canvas(input, { scale: 2, backgroundColor: null }); // Ensure background is transparent if needed
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
    }

    pdf.save('Gate_Pass.pdf');
};

const GatePass = React.forwardRef((props, ref) => {
    return (
        <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
            {/* The ref is attached to the div that contains the actual gate pass layout */}
            <div ref={ref} style={gatePassContainerStyle}>
                <div style={headerStyle}>
                    <p style={revisedStyle}>REVISED SEPT.09</p>
                    <p style={collegeNameStyle}>CAGAYAN DE ORO COLLEGE - PHINMA</p>
                    <p style={departmentStyle}>GENERAL SERVICES DEPARTMENT</p>
                    <h1 style={gatePassTitleStyle}>GATE PASS</h1>
                </div>

                <div style={sectionStyle}>
                    <div style={rowStyle}>
                        <p style={{ margin: 0, padding: 0 }}>GUARD ON DUTY: <span style={staticLineStyle}>&nbsp;</span></p>
                        <p style={{ margin: 0, padding: 0, marginLeft: 'auto' }}>DATE: <span style={staticLineStyle}>&nbsp;</span></p>
                    </div>
                    <p style={certificationStyle}>
                        This is to CERTIFY that the bearer <span style={longStaticLineStyle}>&nbsp;</span><br/>
                        is authorize to carry out the equipments and materials for official purposes.
                    </p>
                </div>

                {/* Table with 4 columns and a single tall row */}
                <table style={tableStyle}>
                    <thead>
                        <tr>
                            <th style={thStyle}>QTY</th>
                            <th style={thStyle}>UNIT</th>
                            <th style={thStyle}>PARTICULAR</th>
                            <th style={thStyle}>PURPOSE</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            {/* Single tall row for content, no internal lines */}
                            <td style={tallTdStyle}></td>
                            <td style={tallTdStyle}></td>
                            <td style={tallTdStyle}></td>
                            <td style={tallTdStyle}></td>
                        </tr>
                    </tbody>
                </table>

                {/* Signature Section - Adjusted to match image_3e76c4.png placement and structure */}
                <div style={signatureSectionContainerStyle}>
                    <div style={signatureRowStyle}>
                        <div style={signatureItemStyle}>
                            <div style={signatureLineSeparatorStyle}></div>
                            <div style={labelStyle}>Property & Asset Custodian</div>
                        </div>
                        <div style={signatureItemStyle}>
                            <div style={signatureLineSeparatorStyle}></div>
                            <div style={labelStyle}>Guard on Duty</div>
                        </div>
                        <div style={signatureItemStyle}>
                            <div style={signatureLineSeparatorStyle}></div>
                            <p style={labelStyle}>School Administrator</p>
                        </div>
                    </div>
                    <div style={bearerSignatureStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={signatureLineSeparatorStyle}></div>
                            <p style={labelStyle}>Bearer ( signature over printed name )</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

// --- Styles (adjusted) ---
const gatePassContainerStyle = {
    fontFamily: 'Arial, sans-serif',
    border: '1px solid black',
    padding: '20px 20px', // Adjusted horizontal padding to be less, vertical remains 20px
    width: '794px', // Approximately A4 width in pixels at 96 DPI
    margin: '0 auto',
    boxSizing: 'border-box',
    backgroundColor: 'white',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)'
};

const headerStyle = {
    textAlign: 'center',
    marginBottom: '20px'
};

const revisedStyle = {
    textAlign: 'left',
    fontSize: '10px',
    margin: '0',
    padding: '0'
};

const collegeNameStyle = {
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '5px 0'
};

const departmentStyle = {
    fontSize: '14px',
    margin: '5px 0'
};

const gatePassTitleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    textDecoration: 'underline',
    margin: '15px 0'
};

const sectionStyle = {
    marginBottom: '15px'
};

const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
};

const staticLineStyle = {
    display: 'inline-block',
    borderBottom: '1px solid black',
    width: '180px', // Slightly decreased width for these lines
    marginLeft: '10px',
    verticalAlign: 'bottom',
    height: '1em' // Ensures the line has some height
};

const longStaticLineStyle = {
    display: 'inline-block',
    borderBottom: '1px solid black',
    width: 'calc(100% - 140px)', // Adjusted width for bearer line
    marginLeft: '5px',
    verticalAlign: 'bottom',
    height: '1em'
};

const certificationStyle = {
    fontSize: '12px',
    lineHeight: '1.5'
};

const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '20px'
};

const thStyle = {
    border: '1px solid black',
    padding: '8px',
    textAlign: 'left',
    backgroundColor: '#f2f2f2'
};

// Style for the single tall table data cell
const tallTdStyle = {
    border: '1px solid black',
    padding: '0',
    height: '250px', // Increased height significantly
    verticalAlign: 'top', // Align content to the top
};

// Signature Section Styles (re-evaluated based on image_3e76c4.png)
const signatureSectionContainerStyle = {
    marginTop: '30px',
    // No top border here directly in the parent container
    paddingTop: '10px'
};

const signatureRowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px', // Space between this row and the bearer signature
};

const signatureItemStyle = {
    width: '32%', // Adjust width to ensure proper spacing
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
};

const signatureLineSeparatorStyle = {
    borderTop: '1px solid black',
    width: '180px', // Fixed width for signature lines
    marginBottom: '4px',
};

const bearerSignatureStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end', // Align to the right
    marginTop: '40px', // Space above bearer signature
};

const labelStyle = {
    fontSize: '12px',
    margin: '0',
    padding: '0',
    textAlign: 'center', // Ensure label text is centered under its line
};

export default GatePass;