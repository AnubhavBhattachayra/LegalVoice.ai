document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const microphoneBtn = document.getElementById('microphoneBtn');
    const statusMessage = document.getElementById('statusMessage');
    const recognizedText = document.getElementById('recognizedText');
    const transcriptText = document.getElementById('transcriptText');
    const clearFormBtn = document.getElementById('clearFormBtn');
    const saveFormBtn = document.getElementById('saveFormBtn');
    const downloadFormBtn = document.getElementById('downloadFormBtn');
    const legalForm = document.getElementById('legalForm');
    const tooltipIcons = document.querySelectorAll('.tooltip-icon');
    const modal = document.getElementById('explanationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const closeModal = document.querySelector('.close-modal');
    
    const fieldMappings = {
        'full name': 'fullName',
        'fathers name': 'fatherName',
        'father name': 'fatherName',
        'age': 'age',
        'address': 'address',
        'purpose': 'affidavitPurpose',
        'statement': 'statement',
        'place': 'place'
    };
    
    // SpeechRecognition setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        // Initialize SpeechRecognition
        recognition.onstart = function() {
            statusMessage.textContent = "Listening... Speak now.";
            statusMessage.className = "status-message listening";
            microphoneBtn.textContent = "Stop Listening";
            microphoneBtn.classList.add('recording');
            recognizedText.style.display = "block";
        };
        
        recognition.onresult = function(event) {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                    processVoiceCommand(transcript);
                } else {
                    interimTranscript += transcript;
                }
            }
            
            transcriptText.innerHTML = finalTranscript + '<i style="color:#999">' + interimTranscript + '</i>';
        };
        
        recognition.onerror = function(event) {
            statusMessage.textContent = "Error occurred in recognition: " + event.error;
            statusMessage.className = "status-message error";
        };
        
        recognition.onend = function() {
            microphoneBtn.textContent = "Start Voice Recognition";
            microphoneBtn.classList.remove('recording');
        };
        
    } else {
        statusMessage.textContent = "Speech recognition not supported in this browser.";
        statusMessage.className = "status-message error";
        microphoneBtn.disabled = true;
    }
    
    // Microphone button click handler
    microphoneBtn.addEventListener('click', function() {
        if (microphoneBtn.classList.contains('recording')) {
            recognition.stop();
            statusMessage.textContent = "Voice recognition stopped.";
            statusMessage.className = "status-message";
        } else {
            recognition.start();
        }
    });
    
    // Process voice commands
    function processVoiceCommand(transcript) {
        const lowerTranscript = transcript.toLowerCase();
        
        // Process full name
        if (lowerTranscript.includes("full name") || lowerTranscript.includes("my name is")) {
            const nameMatch = transcript.match(/(?:full name|my name is)[:\s]+([^.]+)/i);
            if (nameMatch && nameMatch[1]) {
                const fullName = nameMatch[1].trim();
                document.getElementById('fullName').value = fullName;
                highlightField('fullName');
            }
        }
        
        // Process father's name
        if (lowerTranscript.includes("father") || lowerTranscript.includes("father's name")) {
            const fatherMatch = transcript.match(/(?:father's name|father name|son of)[:\s]+([^.]+)/i);
            if (fatherMatch && fatherMatch[1]) {
                document.getElementById('fatherName').value = fatherMatch[1].trim();
                highlightField('fatherName');
            }
        }
        
        // Process age
        if (lowerTranscript.includes("age")) {
            const ageMatch = transcript.match(/age[:\s]+([0-9]+)/i);
            if (ageMatch && ageMatch[1]) {
                document.getElementById('age').value = ageMatch[1].trim();
                highlightField('age');
            }
        }
        
        // Process address
        if (lowerTranscript.includes("address") || lowerTranscript.includes("live at")) {
            const addressMatch = transcript.match(/(?:address|live at)[:\s]+([^.]+)/i);
            if (addressMatch && addressMatch[1]) {
                document.getElementById('address').value = addressMatch[1].trim();
                highlightField('address');
            }
        }
        
        // Process purpose
        if (lowerTranscript.includes("purpose")) {
            const purposeSelect = document.getElementById('affidavitPurpose');
            const options = Array.from(purposeSelect.options).map(opt => opt.text.toLowerCase());
            
            for (let i = 0; i < options.length; i++) {
                if (lowerTranscript.includes(options[i].toLowerCase())) {
                    purposeSelect.selectedIndex = i;
                    highlightField('affidavitPurpose');
                    break;
                }
            }
        }
        
        // Process statement
        if (lowerTranscript.includes("statement")) {
            const statementMatch = transcript.match(/statement[:\s]+([^.]+)/i);
            if (statementMatch && statementMatch[1]) {
                document.getElementById('statement').value = statementMatch[1].trim();
                highlightField('statement');
            }
        }
        
        // Process place
        if (lowerTranscript.includes("place")) {
            const placeMatch = transcript.match(/place[:\s]+([^.]+)/i);
            if (placeMatch && placeMatch[1]) {
                document.getElementById('place').value = placeMatch[1].trim();
                highlightField('place');
            }
        }
        
        // Handle form commands
        if (lowerTranscript.includes("clear form") || lowerTranscript.includes("reset form")) {
            clearForm();
            statusMessage.textContent = "Form cleared.";
            statusMessage.className = "status-message success";
        }
        
        if (lowerTranscript.includes("submit form") || lowerTranscript.includes("save form")) {
            saveForm();
        }
        
        if (lowerTranscript.includes("download form")) {
            downloadForm();
        }
    }
    
    // Highlight field when filled by voice
    function highlightField(fieldId) {
        const field = document.getElementById(fieldId);
        field.classList.add('highlight-field');
        setTimeout(() => {
            field.classList.remove('highlight-field');
        }, 2000);
    }
    
    // Form action handlers
    function clearForm() {
        legalForm.reset();
    }
    
    function saveForm() {
        // Form validation
        if (!legalForm.checkValidity()) {
            legalForm.reportValidity();
            return;
        }
        
        // Collect form data
        const formData = {};
        new FormData(legalForm).forEach((value, key) => {
            formData[key] = value;
        });
        
        // Add document type
        formData.documentType = 'affidavit';
        
        // Add timestamp
        formData.timestamp = new Date().toISOString();
        
        // Get existing saved forms or initialize empty array
        let savedForms = JSON.parse(localStorage.getItem('savedForms') || '[]');
        
        // Add this form to saved forms
        savedForms.push(formData);
        
        // Save to localStorage
        localStorage.setItem('savedForms', JSON.stringify(savedForms));
        
        // Show success message
        statusMessage.textContent = "Form saved successfully.";
        statusMessage.className = "status-message success";
    }
    
    function downloadForm() {
        // Check form validity
        if (!legalForm.checkValidity()) {
            legalForm.reportValidity();
            return;
        }
        
        // Collect form data
        const formData = {};
        new FormData(legalForm).forEach((value, key) => {
            formData[key] = value;
        });
        
        // Create a formatted text version of the affidavit
        let affidavitText = "AFFIDAVIT\n";
        affidavitText += "====================\n\n";
        affidavitText += `I, ${formData.fullName}, son/daughter of ${formData.fatherName}, aged ${formData.age} years, resident of ${formData.address}, do hereby solemnly affirm and state as follows:\n\n`;
        
        // Add purpose based on selection
        let purposeText = document.getElementById('affidavitPurpose').options[document.getElementById('affidavitPurpose').selectedIndex].text;
        affidavitText += `Purpose: ${purposeText}\n\n`;
        
        // Add statement
        affidavitText += `${formData.statement}\n\n`;
        
        // Add verification line
        affidavitText += `I solemnly affirm that the contents of this affidavit are true to the best of my knowledge and belief.\n\n`;
        
        // Add place and date
        affidavitText += `Place: ${formData.place}\n`;
        affidavitText += `Date: ${new Date().toLocaleDateString()}\n\n`;
        
        // Add signature line
        affidavitText += "DEPONENT\n\n";
        
        // Add verification line
        affidavitText += "Verified before me\n";
        affidavitText += "Notary Public\n\n";
        
        // Add disclaimer
        affidavitText += "DISCLAIMER: This is a prototype form for demonstration purposes only.\n";
        
        // Create download
        const blob = new Blob([affidavitText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Affidavit_${formData.fullName.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        statusMessage.textContent = "Form downloaded successfully.";
        statusMessage.className = "status-message success";
    }
    
    // Button event listeners
    clearFormBtn.addEventListener('click', clearForm);
    saveFormBtn.addEventListener('click', saveForm);
    downloadFormBtn.addEventListener('click', downloadForm);
    
    // Field explanation tooltips
    tooltipIcons.forEach(icon => {
        icon.addEventListener('click', function() {
            const tooltip = this.getAttribute('data-tooltip');
            const fieldName = this.previousElementSibling.textContent;
            
            modalTitle.textContent = fieldName + " Field Explanation";
            modalContent.innerHTML = getDetailedExplanation(fieldName, tooltip);
            modal.style.display = "block";
        });
    });
    
    // Close modal
    closeModal.addEventListener('click', function() {
        modal.style.display = "none";
    });
    
    window.addEventListener('click', function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });
    
    // Get detailed explanation for field
    function getDetailedExplanation(fieldName, basicTooltip) {
        const explanations = {
            "Full Legal Name": {
                content: `
                    <p>${basicTooltip}</p>
                    <h3>Why This Matters</h3>
                    <p>Your legal name establishes your identity in this affidavit. Using a name different from your official identification can invalidate the affidavit or cause legal complications.</p>
                    <h3>Examples</h3>
                    <p>Examples of full legal names include:</p>
                    <ul>
                        <li>Rahul Kumar Sharma</li>
                        <li>Priya Rajesh Patel</li>
                    </ul>
                `
            },
            "Father's Name": {
                content: `
                    <p>${basicTooltip}</p>
                    <h3>Why This Matters</h3>
                    <p>In Indian legal documents, providing your father's name is a common practice for establishing your identity more specifically.</p>
                    <h3>Examples</h3>
                    <p>Examples include:</p>
                    <ul>
                        <li>Rajesh Kumar</li>
                        <li>Mohammed Abdullah</li>
                    </ul>
                `
            },
            "Age": {
                content: `
                    <p>${basicTooltip}</p>
                    <h3>Why This Matters</h3>
                    <p>Your age confirms you are legally an adult and capable of making the declaration in this affidavit.</p>
                `
            },
            "Legal Address": {
                content: `
                    <p>${basicTooltip}</p>
                    <h3>Why This Matters</h3>
                    <p>Your legal address establishes your place of residence for this affidavit. It's important for jurisdiction and verification purposes.</p>
                    <h3>Examples</h3>
                    <p>Examples include:</p>
                    <ul>
                        <li>123 Sansar Chand Road, Jaipur, Rajasthan</li>
                        <li>Flat 45, Sunshine Apartments, MG Road, Bengaluru</li>
                    </ul>
                `
            },
            "Purpose of Affidavit": {
                content: `
                    <p>${basicTooltip}</p>
                    <h3>Why This Matters</h3>
                    <p>The purpose clarifies why you are creating this affidavit. Different purposes may have different legal requirements and implications.</p>
                `
            },
            "Affidavit Statement": {
                content: `
                    <p>${basicTooltip}</p>
                    <h3>Why This Matters</h3>
                    <p>This is the core of your affidavit where you make your sworn statement. It should be truthful, clear, and specific.</p>
                    <h3>Examples</h3>
                    <p>Example statements:</p>
                    <ul>
                        <li>"I hereby declare that my name was incorrectly recorded as 'Rahul Kumar' in my school records, while my correct name as per all other official documents is 'Rahul Kumar Sharma'. Both names refer to the same person which is me."</li>
                        <li>"I hereby declare that I am a resident of the above-mentioned address since January 2020 and this affidavit is being submitted as proof of residence."</li>
                    </ul>
                `
            },
            "Place of Execution": {
                content: `
                    <p>${basicTooltip}</p>
                    <h3>Why This Matters</h3>
                    <p>The place where an affidavit is executed and notarized is important for legal jurisdiction purposes.</p>
                    <h3>Examples</h3>
                    <p>Examples include:</p>
                    <ul>
                        <li>Mumbai</li>
                        <li>New Delhi</li>
                    </ul>
                `
            }
        };

        return explanations[fieldName]?.content || `<p>${basicTooltip}</p>`;
    }
    
    // Check if document type was set in localStorage
    const documentType = localStorage.getItem('selectedDocumentType');
    if (documentType && documentType !== 'affidavit') {
        statusMessage.textContent = "It seems you've been redirected to the wrong form. Please go back and select the correct document type.";
        statusMessage.className = "status-message error";
    }
});