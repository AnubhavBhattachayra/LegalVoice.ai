document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadStatus = document.getElementById('uploadStatus');
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadStatusText = document.getElementById('uploadStatusText');
    const documentAnalysis = document.getElementById('documentAnalysis');
    const summaryContent = document.getElementById('summaryContent');
    const keyInfoGrid = document.getElementById('keyInfoGrid');
    const extractedText = document.getElementById('extractedText');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const documentChatContainer = document.getElementById('documentChatContainer');
    const documentChatInput = document.getElementById('documentChatInput');
    const documentChatSendBtn = document.getElementById('documentChatSendBtn');

    // Current document data
    let currentDocumentData = null;
    
    // Set up drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        uploadArea.classList.add('highlight');
    }

    function unhighlight() {
        uploadArea.classList.remove('highlight');
    }

    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            handleFiles(files);
        }
    }

    // Handle file selection via input
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleFiles(this.files);
        }
    });

    // Handle file uploads
    function handleFiles(files) {
        const file = files[0]; // Currently only handling one file at a time
        
        // Check if file type is supported
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            showError("Unsupported file type. Please upload PDF, JPG, or PNG files.");
            return;
        }
        
        // Show upload status
        uploadStatus.style.display = 'block';
        uploadProgress.style.width = '0%';
        uploadStatusText.textContent = 'Processing: 0%';
        
        // Create form data for upload
        const formData = new FormData();
        formData.append('document', file);
        
        // In a real application, you would upload to a server
        // For this prototype, we'll simulate the upload and processing
        simulateUploadAndProcess(file);
    }

    // Simulate file upload and OCR processing
    function simulateUploadAndProcess(file) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            uploadProgress.style.width = `${progress}%`;
            uploadStatusText.textContent = `Processing: ${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                uploadStatusText.textContent = 'Processing complete!';
                setTimeout(() => {
                    // Generate mock OCR results based on file type
                    generateMockResults(file);
                }, 500);
            }
        }, 100);
    }

    // Generate mock OCR results
    function generateMockResults(file) {
        // Get file extension to customize mock data
        const fileName = file.name.toLowerCase();
        let documentType = 'unknown';
        
        if (fileName.includes('challan') || fileName.includes('traffic') || fileName.includes('fine')) {
            documentType = 'traffic_challan';
        } else if (fileName.includes('affidavit')) {
            documentType = 'affidavit';
        } else if (fileName.includes('attorney') || fileName.includes('poa')) {
            documentType = 'power_of_attorney';
        } else if (fileName.includes('rent') || fileName.includes('lease')) {
            documentType = 'rent_agreement';
        } else if (fileName.includes('income') || fileName.includes('salary')) {
            documentType = 'income_declaration';
        } else if (fileName.includes('will')) {
            documentType = 'will';
        }
        
        // Generate mock data based on document type
        currentDocumentData = getMockDocumentData(documentType, fileName);
        
        // Display the results
        displayDocumentAnalysis();
    }

    // Get mock document data based on type
    function getMockDocumentData(documentType, fileName) {
        const mockData = {
            traffic_challan: {
                summary: "This document is a Traffic Challan issued by the Mumbai Traffic Police for violation of traffic rules. It contains details of the violation, the fine amount, and payment instructions.",
                keyInfo: [
                    { label: "Challan Number", value: "MH-2023-45678" },
                    { label: "Vehicle Number", value: "MH 02 AB 1234" },
                    { label: "Violation Type", value: "Signal Jumping" },
                    { label: "Fine Amount", value: "₹1,000" },
                    { label: "Issue Date", value: "15 Feb 2023" },
                    { label: "Payment Due", value: "15 Mar 2023" }
                ],
                extractedText: "MUMBAI TRAFFIC POLICE\nE-CHALLAN\n\nChallan No: MH-2023-45678\nDate of Violation: 15/02/2023\nTime: 14:30\nVehicle Registration No: MH 02 AB 1234\n\nViolation Details:\nJumping Signal at Bandra Junction\nFine Amount: ₹1,000\n\nPayment to be made within 30 days of issue date.\nPayment can be made online at www.mumbaitrafficpolice.gov.in\nor at any authorized traffic branch office.\n\nFailing to pay the fine may result in additional penalties.\n\nThank you for your cooperation.\nMumbai Traffic Police"
            },
            affidavit: {
                summary: "This is a General Affidavit sworn by an individual, affirming certain facts under oath. The document includes personal details of the affiant, the statements being affirmed, and has been notarized.",
                keyInfo: [
                    { label: "Affiant Name", value: "Rajesh Kumar" },
                    { label: "Address", value: "123 Main Street, Delhi" },
                    { label: "Purpose", value: "Name Change" },
                    { label: "Sworn Date", value: "10 Mar 2023" },
                    { label: "Notary", value: "P. Singh, Delhi" }
                ],
                extractedText: "AFFIDAVIT\n\nI, Rajesh Kumar, son of Mahesh Kumar, resident of 123 Main Street, Delhi, do hereby solemnly affirm and declare as follows:\n\n1. That I was born on 15th April 1985 at Delhi.\n2. That my name in official records was incorrectly recorded as 'Rajesh Sharma'.\n3. That my correct name is 'Rajesh Kumar'.\n4. That both names refer to one and the same person, which is me.\n5. That I am making this affidavit to correct the name in all official documents.\n\nI solemnly affirm that the contents of this affidavit are true to the best of my knowledge and belief.\n\nVerified at Delhi on this 10th day of March 2023.\n\nDeponent\n\nVerified before me\nP. Singh\nNotary Public\nDelhi"
            },
            // Add more mock data for other document types as needed
            power_of_attorney: {
                summary: "This document is a Power of Attorney (POA) granting authority to an individual to act on behalf of the principal for specified matters. It outlines the scope of powers granted and the duration of the arrangement.",
                keyInfo: [
                    { label: "Principal", value: "Anita Sharma" },
                    { label: "Attorney", value: "Vikram Sharma" },
                    { label: "Relationship", value: "Son" },
                    { label: "Powers", value: "Property Management" },
                    { label: "Effective Date", value: "5 Jan 2023" },
                    { label: "Termination", value: "Until Revoked" }
                ],
                extractedText: "POWER OF ATTORNEY\n\nKNOW ALL MEN BY THESE PRESENTS THAT I, Anita Sharma, residing at 45 Green Park, New Delhi, hereby appoint and constitute my son, Vikram Sharma, residing at 67 Model Town, Delhi as my true and lawful attorney to act in my name and on my behalf to do the following acts, deeds and things:\n\n1. To manage my residential property located at 45 Green Park, New Delhi.\n2. To collect rent, issue receipts, and maintain the said property.\n3. To represent me before government authorities regarding property tax matters.\n4. To pay all bills, taxes and other outgoings in respect of the said property.\n\nThis Power of Attorney shall come into effect from 5th January 2023 and shall remain valid until revoked by me in writing.\n\nIN WITNESS WHEREOF, I have signed this Power of Attorney on this 5th day of January 2023.\n\nAnita Sharma\nPrincipal\n\nWitnesses:\n1. Rahul Verma\n2. Priya Gupta"
            },
            rent_agreement: {
                summary: "This document is a Rental Agreement between a landlord and tenant for a residential property. It outlines the terms of tenancy including rent amount, security deposit, duration, and other conditions.",
                keyInfo: [
                    { label: "Landlord", value: "Suresh Patel" },
                    { label: "Tenant", value: "Amit Kapoor" },
                    { label: "Property Address", value: "Flat 302, Sunshine Apartments, Bengaluru" },
                    { label: "Monthly Rent", value: "₹22,000" },
                    { label: "Security Deposit", value: "₹66,000" },
                    { label: "Lease Period", value: "11 months" }
                ],
                extractedText: "RENTAL AGREEMENT\n\nThis Rental Agreement is made and executed on the 1st day of April 2023 between:\n\nSuresh Patel, son of Ramesh Patel, resident of Villa 15, Palm Grove, Bengaluru (hereinafter called the 'LANDLORD')\n\nAND\n\nAmit Kapoor, son of Vijay Kapoor, resident of 78 Richmond Road, Bengaluru (hereinafter called the 'TENANT')\n\nThe LANDLORD hereby lets and the TENANT takes on rent the residential premises being Flat No. 302, Sunshine Apartments, MG Road, Bengaluru on the following terms and conditions:\n\n1. The tenancy shall be for a period of 11 months commencing from 1st April 2023.\n2. The monthly rent payable shall be ₹22,000/- (Rupees Twenty Two Thousand only).\n3. The TENANT has paid a security deposit of ₹66,000/- (Rupees Sixty Six Thousand only).\n4. The rent shall be paid by the 5th day of every month.\n5. The premises shall be used for residential purposes only.\n\nIN WITNESS WHEREOF, the parties have signed this Agreement on the date first mentioned above.\n\n[Signature]\nLandlord\n\n[Signature]\nTenant\n\nWitnesses:\n1. [Signature] - Prakash Nair\n2. [Signature] - Shobha Rao"
            },
            unknown: {
                summary: "This appears to be a legal document. Our analysis has extracted text and identified key information, but we recommend reviewing the extracted text for specific details.",
                keyInfo: [
                    { label: "Document Type", value: "Legal Document" },
                    { label: "File Name", value: fileName || "Unknown" },
                    { label: "Pages", value: "Multiple" },
                    { label: "Contains Signatures", value: "Likely" }
                ],
                extractedText: "Our system has processed your document and extracted the text. Please review the extracted content in this section for the details of your document.\n\nIf you need more specific analysis, you can ask questions in the 'Ask Questions' tab."
            }
        };
        
        return mockData[documentType] || mockData.unknown;
    }

    // Display document analysis results
    function displayDocumentAnalysis() {
        // Set summary content
        summaryContent.textContent = currentDocumentData.summary;
        
        // Set key information
        keyInfoGrid.innerHTML = '';
        currentDocumentData.keyInfo.forEach(item => {
            const infoItem = document.createElement('div');
            infoItem.className = 'key-info-item';
            infoItem.innerHTML = `
                <div class="key-info-label">${item.label}</div>
                <div class="key-info-value">${item.value}</div>
            `;
            keyInfoGrid.appendChild(infoItem);
        });
        
        // Set extracted text
        extractedText.textContent = currentDocumentData.extractedText;
        
        // Show analysis section
        documentAnalysis.style.display = 'block';
        
        // Reset chat
        resetChat();
    }

    // Tab switching functionality
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Show corresponding pane
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Document chat functionality
    documentChatSendBtn.addEventListener('click', sendDocumentChatMessage);
    documentChatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendDocumentChatMessage();
        }
    });

    function sendDocumentChatMessage() {
        const message = documentChatInput.value.trim();
        if (message) {
            // Add user message to chat
            addChatMessage(message, 'user');
            
            // Clear input
            documentChatInput.value = '';
            
            // Process user question and generate response
            setTimeout(() => {
                const response = generateDocumentChatResponse(message);
                addChatMessage(response, 'ai');
            }, 500);
        }
    }

    function addChatMessage(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerHTML = `<div class="message-bubble">${message}</div>`;
        documentChatContainer.appendChild(messageDiv);
        documentChatContainer.scrollTop = documentChatContainer.scrollHeight;
    }

    function resetChat() {
        // Clear existing chat except first message
        while (documentChatContainer.children.length > 1) {
            documentChatContainer.removeChild(documentChatContainer.lastChild);
        }
    }

    function generateDocumentChatResponse(question) {
        // Simple keyword-based responses
        const lowerQuestion = question.toLowerCase();
        
        // Common responses based on document type
        if (!currentDocumentData) {
            return "Please upload a document first before asking questions.";
        }

        // Check for document type specific questions
        if (currentDocumentData.keyInfo) {
            // Check if question matches any key info
            for (const info of currentDocumentData.keyInfo) {
                const label = info.label.toLowerCase();
                const value = info.value.toLowerCase();
                
                if (lowerQuestion.includes(label.toLowerCase())) {
                    return `The ${info.label} in this document is ${info.value}.`;
                }
            }
        }
        
        // Generic questions about the document
        if (lowerQuestion.includes("what type") || lowerQuestion.includes("kind of document")) {
            return `Based on my analysis, this appears to be ${currentDocumentData.summary.split(' is ')[1].split('.')[0]}.`;
        }
        
        if (lowerQuestion.includes("summary") || lowerQuestion.includes("summarize")) {
            return currentDocumentData.summary;
        }
        
        if (lowerQuestion.includes("date") || lowerQuestion.includes("when")) {
            for (const info of currentDocumentData.keyInfo) {
                if (info.label.toLowerCase().includes("date")) {
                    return `The ${info.label} mentioned in the document is ${info.value}.`;
                }
            }
            return "I couldn't find a specific date mentioned in this document.";
        }
        
        if (lowerQuestion.includes("who") || lowerQuestion.includes("person") || lowerQuestion.includes("name")) {
            const people = currentDocumentData.keyInfo.filter(info => 
                info.label.toLowerCase().includes("name") || 
                info.label.toLowerCase().includes("landlord") || 
                info.label.toLowerCase().includes("tenant") ||
                info.label.toLowerCase().includes("principal") ||
                info.label.toLowerCase().includes("attorney")
            );
            
            if (people.length > 0) {
                return `The key individuals mentioned in this document are: ${people.map(p => p.value).join(', ')}.`;
            }
            return "I couldn't identify specific individuals in this document.";
        }
        
        if (lowerQuestion.includes("amount") || lowerQuestion.includes("money") || lowerQuestion.includes("payment") || lowerQuestion.includes("fine") || lowerQuestion.includes("rent")) {
            const amounts = currentDocumentData.keyInfo.filter(info => 
                info.label.toLowerCase().includes("amount") || 
                info.label.toLowerCase().includes("fine") || 
                info.label.toLowerCase().includes("rent") ||
                info.label.toLowerCase().includes("deposit") ||
                info.value.includes("₹")
            );
            
            if (amounts.length > 0) {
                return `The financial details in this document are: ${amounts.map(a => `${a.label}: ${a.value}`).join(', ')}.`;
            }
            return "I couldn't find specific financial amounts mentioned in this document.";
        }
        
        // Default response
        return "I've analyzed this document but don't have a specific answer to that question. You can check the Summary or Extracted Text tabs for more details, or ask a more specific question about the document content.";
    }

    // Show error message
    function showError(message) {
        alert(message); // For simplicity, using alert instead of a custom modal
    }

    // Add highlight class for upload area
    uploadArea.addEventListener('click', function() {
        fileInput.click();
    });
});