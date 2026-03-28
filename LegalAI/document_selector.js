document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const microphoneBtn = document.getElementById('microphoneBtn');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatContainer = document.getElementById('chatContainer');
    const statusMessage = document.getElementById('statusMessage');
    const documentCards = document.querySelectorAll('.document-option-card');
    
    // SpeechRecognition setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    
    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-IN'; // Set to Indian English
        
        // Initialize SpeechRecognition
        recognition.onstart = function() {
            statusMessage.textContent = "Listening... Speak now.";
            statusMessage.style.display = "block";
            microphoneBtn.classList.add('recording');
        };
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            chatInput.value = transcript;
            statusMessage.style.display = "none";
            microphoneBtn.classList.remove('recording');
            
            // Process voice input after a small delay
            setTimeout(() => {
                processUserInput(transcript);
            }, 500);
        };
        
        recognition.onerror = function(event) {
            statusMessage.textContent = "Error occurred in recognition: " + event.error;
            statusMessage.style.display = "block";
            setTimeout(() => {
                statusMessage.style.display = "none";
            }, 3000);
            microphoneBtn.classList.remove('recording');
        };
        
        recognition.onend = function() {
            statusMessage.style.display = "none";
            microphoneBtn.classList.remove('recording');
        };
        
    } else {
        microphoneBtn.style.display = "none";
        alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
    }
    
    // Microphone button click handler
    microphoneBtn.addEventListener('click', function() {
        if (microphoneBtn.classList.contains('recording')) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });
    
    // Send button click handler
    sendBtn.addEventListener('click', function() {
        const userInput = chatInput.value.trim();
        if (userInput) {
            processUserInput(userInput);
        }
    });
    
    // Send on Enter key
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const userInput = chatInput.value.trim();
            if (userInput) {
                processUserInput(userInput);
            }
        }
    });
    
    // Document card click handler
    documentCards.forEach(card => {
        card.addEventListener('click', function() {
            const docType = this.getAttribute('data-doc-type');
            selectDocumentType(docType);
        });
    });
    
    // Process user input (from text or voice)
    function processUserInput(input) {
        // Add user message to chat
        addUserMessageToChat(input);
        
        // Clear input field
        chatInput.value = '';
        
        // Process the user input to determine document type
        determineDocumentType(input);
    }
    
    // Add user message to chat
    function addUserMessageToChat(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `<div class="message-bubble">${message}</div>`;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    // Add AI message to chat
    function addAIMessageToChat(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai-message';
        messageDiv.innerHTML = `<div class="message-bubble">${message}</div>`;
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    
    // Determine document type from user input
    function determineDocumentType(input) {
        const lowerInput = input.toLowerCase();
        
        // Check for traffic challan related keywords
        if (lowerInput.includes('challan') || lowerInput.includes('traffic') || 
            lowerInput.includes('fine') || lowerInput.includes('violation') ||
            lowerInput.includes('ticket') || lowerInput.includes('driving')) {
            selectDocumentType('challan');
            return;
        }
        
        // Check for affidavit related keywords
        if (lowerInput.includes('affidavit') || lowerInput.includes('sworn statement') || 
            lowerInput.includes('declaration') || lowerInput.includes('certify')) {
            selectDocumentType('affidavit');
            return;
        }
        
        // Check for power of attorney related keywords
        if (lowerInput.includes('power of attorney') || lowerInput.includes('poa') || 
            lowerInput.includes('legal authority') || lowerInput.includes('represent me') ||
            lowerInput.includes('delegate') || lowerInput.includes('authorization')) {
            selectDocumentType('poa');
            return;
        }
        
        // Check for rent agreement related keywords
        if (lowerInput.includes('rent') || lowerInput.includes('lease') || 
            lowerInput.includes('tenant') || lowerInput.includes('landlord') ||
            lowerInput.includes('property agreement')) {
            selectDocumentType('rent');
            return;
        }
        
        // Check for income declaration related keywords
        if (lowerInput.includes('income') || lowerInput.includes('salary') || 
            lowerInput.includes('earning') || lowerInput.includes('financial') ||
            lowerInput.includes('tax')) {
            selectDocumentType('income');
            return;
        }
        
        // Check for will related keywords
        if (lowerInput.includes('will') || lowerInput.includes('testament') || 
            lowerInput.includes('inheritance') || lowerInput.includes('estate') ||
            lowerInput.includes('assets')) {
            selectDocumentType('will');
            return;
        }
        
        // If we couldn't determine the document type, ask for clarification
        addAIMessageToChat('I\'m not sure what type of document you need help with. Could you provide more details or select one of the available document types from the right panel?');
    }
    
    // Handle document selection
    function selectDocumentType(docType) {
        // Save selected document type to localStorage
        localStorage.setItem('selectedDocumentType', docType);
        
        // Show confirmation message
        let docName = '';
        switch (docType) {
            case 'challan':
                docName = 'Traffic Challan';
                break;
            case 'affidavit':
                docName = 'Affidavit';
                break;
            case 'poa':
                docName = 'Power of Attorney';
                break;
            case 'rent':
                docName = 'Rent Agreement';
                break;
            case 'income':
                docName = 'Income Declaration';
                break;
            case 'will':
                docName = 'Will';
                break;
        }
        
        addAIMessageToChat(`Great! I'll help you with a ${docName} form. Let's get started with filling out the details.`);
        
        // After a short delay, redirect to the appropriate form page
        setTimeout(() => {
            window.location.href = `forms/${docType}_form.html`;
        }, 2000);
    }
    
    // Show welcome message if first visit
    if (!localStorage.getItem('documentSelectorVisited')) {
        setTimeout(() => {
            addAIMessageToChat('You can either tell me what kind of document you need help with, or select one of the options on the right. For example, you could say "I need help with a traffic challan" or "I want to create a power of attorney."');
            localStorage.setItem('documentSelectorVisited', 'true');
        }, 1000);
    }
});