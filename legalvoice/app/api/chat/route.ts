import { NextRequest, NextResponse } from "next/server";
import { ChatSessionModel, MessageModel } from "@/app/lib/models/ChatModels";
import { connectToDatabase } from "@/app/lib/db/mongodb";
import { getUserFromRequest } from "@/app/lib/utils/authHelpers";
import { Timestamp, ObjectId } from "mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Interface for chat message from database
interface ChatMessage {
  _id: string;
  sessionId: string;
  userId: string;
  sender: 'user' | 'assistant';
  message: string;
  attachments?: any[];
  createdAt: Date;
}

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, attachments, country = 'IN', language = 'en' } = await request.json();

    if (!message && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { success: false, message: "Message or attachments are required" },
        { status: 400 }
      );
    }

    // Get user if authenticated
    const user = await getUserFromRequest(request);
    
    // Connect to MongoDB
    const { db, error } = await connectToDatabase();
    
    if (error || !db) {
      console.error("Database connection error");
      return NextResponse.json(
        { success: false, message: "Database connection error" },
        { status: 500 }
      );
    }
    
    let session;
    let newSessionId;
    let userMemory = null;
    let sessionMessages: ChatMessage[] = [];
    
    // If user is authenticated, we need to track the session
    if (user && user.uid) {
      // Try to get user memory
      try {
        userMemory = await db.collection("userMemory").findOne({ userId: user.uid });
        
        if (!userMemory) {
          // Create initial user memory
          userMemory = {
            userId: user.uid,
            preferences: {
              country: country,
              language: language
            },
            topics: {},
            lastInteraction: new Date(),
            createdAt: new Date()
          };
          
          await db.collection("userMemory").insertOne(userMemory);
        } else {
          // Update last interaction and preferences
          await db.collection("userMemory").updateOne(
            { userId: user.uid },
            { 
              $set: { 
                "preferences.country": country,
                "preferences.language": language,
                lastInteraction: new Date() 
              }
            }
          );
        }
      } catch (memoryError) {
        console.error("Error accessing user memory:", memoryError);
        // Continue without memory if there's an error
      }
      
      // If sessionId is provided, verify it belongs to the user
      if (sessionId) {
        try {
          // Convert string ID to ObjectId if needed
          const sessionObjectId = typeof sessionId === 'string' && ObjectId.isValid(sessionId) 
            ? new ObjectId(sessionId) 
            : sessionId;
            
          session = await db.collection("chatSessions").findOne({
            _id: sessionObjectId,
            userId: user.uid
          });
          
          if (!session) {
            return NextResponse.json(
              { success: false, message: "Session not found" },
              { status: 404 }
            );
          }
          
          // Store the current message
          await db.collection("chatMessages").insertOne({
            sessionId: sessionId,
            userId: user.uid,
            sender: "user",
            message: message,
            attachments: attachments || [],
            createdAt: new Date()
          });
          
          // Get previous messages for context
          try {
            sessionMessages = await db.collection("chatMessages")
              .find({ sessionId: sessionId })
              .sort({ createdAt: 1 })
              .limit(10) // Get last 10 messages for context
              .toArray();
              
          } catch (msgError) {
            console.error("Error getting session messages:", msgError);
            // Continue without message history if there's an error
          }
          
          // Update session title based on first few messages
          if (session && (!session.title || session.title === 'New Chat' || session.title.includes('...'))) {
            try {
              // Generate a meaningful title using Gemini
              const sessionTitle = await generateSessionTitle(
                sessionMessages.map(msg => `${msg.sender}: ${msg.message}`).join('\n')
              );
              
              if (sessionTitle) {
                await db.collection("chatSessions").updateOne(
                  { _id: sessionObjectId },
                  { $set: { title: sessionTitle } }
                );
              }
            } catch (titleError) {
              console.error("Error generating session title:", titleError);
              // If title generation fails, use the first few characters of the message
              await db.collection("chatSessions").updateOne(
                { _id: sessionObjectId },
                { $set: { title: message.substring(0, 30) + (message.length > 30 ? '...' : '') } }
              );
            }
          }
        } catch (sessionError) {
          console.error("Error processing session:", sessionError);
          return NextResponse.json(
            { success: false, message: "Error processing chat session" },
            { status: 500 }
          );
        }
      } else {
        // Create a new session with a default title (will be updated later)
        try {
          const result = await db.collection("chatSessions").insertOne({
            userId: user.uid,
            title: 'New Chat',
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          newSessionId = result.insertedId.toString();
          
          // Store message
          await db.collection("chatMessages").insertOne({
            sessionId: newSessionId,
            userId: user.uid,
            sender: "user",
            message: message,
            attachments: attachments || [],
            createdAt: new Date()
          });
        } catch (createSessionError) {
          console.error("Error creating new session:", createSessionError);
          return NextResponse.json(
            { success: false, message: "Error creating chat session" },
            { status: 500 }
          );
        }
      }
    }
    
    // Build context for AI response
    const activeSessionId = sessionId || newSessionId;
    const conversationHistory = sessionMessages.map(msg => 
      `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.message}`
    ).join('\n');
    
    // Check for language/country change in the message
    const detectedChanges = await detectLanguageCountryChange(message, country, language);
    const useCountry = detectedChanges.country || country;
    const useLanguage = detectedChanges.language || language;
    
    // Process message and get AI response
    const aiResponse = await getAIResponse(
      message, 
      useCountry, 
      useLanguage, 
      conversationHistory,
      userMemory
    );
    
    // Extract topics from the conversation for memory
    if (user?.uid && userMemory) {
      try {
        const updatedTopics = await extractConversationTopics(
          message, 
          aiResponse, 
          userMemory.topics || {}
        );
        
        if (updatedTopics) {
          await db.collection("userMemory").updateOne(
            { userId: user.uid },
            { $set: { topics: updatedTopics } }
          );
        }
      } catch (topicError) {
        console.error("Error updating user topics:", topicError);
        // Continue without updating topics if there's an error
      }
    }
    
    // Check for document suggestion using Gemini
    const documentSuggestion = await getDocumentSuggestion(message, aiResponse);
    
    // If user is authenticated, store assistant's message
    if (user && user.uid) {
      const activeSessionId = sessionId || newSessionId;
      
      // Update session's last activity
      try {
        const sessionObjectId = typeof activeSessionId === 'string' && ObjectId.isValid(activeSessionId) 
            ? new ObjectId(activeSessionId) 
            : activeSessionId;
            
        await db.collection("chatSessions").updateOne(
          { _id: sessionObjectId },
          { $set: { 
            updatedAt: new Date(),
            lastMessage: aiResponse.substring(0, 100) + (aiResponse.length > 100 ? '...' : '')
          } }
        );
        
        // Store message
        await db.collection("chatMessages").insertOne({
          sessionId: activeSessionId,
          userId: user.uid,
          sender: "assistant",
          message: aiResponse,
          createdAt: new Date()
        });
        
        // If this is a new session, generate a title
        if (newSessionId) {
          try {
            // Get all messages in this new session
            const newSessionMessages = await db.collection("chatMessages")
              .find({ sessionId: newSessionId })
              .sort({ createdAt: 1 })
              .toArray();
              
            // Generate a title based on the conversation
            const sessionTitle = await generateSessionTitle(
              newSessionMessages.map(msg => `${msg.sender}: ${msg.message}`).join('\n')
            );
            
            if (sessionTitle) {
              await db.collection("chatSessions").updateOne(
                { _id: new ObjectId(newSessionId) },
                { $set: { title: sessionTitle } }
              );
            }
          } catch (titleError) {
            console.error("Error generating session title for new session:", titleError);
          }
        }
      } catch (storeError) {
        console.error("Error storing assistant message:", storeError);
      }
    }
    
    // Return response with session ID if a new session was created
    return NextResponse.json({
      success: true,
      reply: aiResponse,
      sessionId: newSessionId || sessionId,
      metadata: {
        country: useCountry,
        language: useLanguage,
        suggestedDocument: documentSuggestion
      }
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred processing your request" },
      { status: 500 }
    );
  }
}

// Function to detect language or country change requests in the message
async function detectLanguageCountryChange(message: string, defaultCountry: string, defaultLanguage: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
    Analyze the following user message and determine if the user is:
    1. Requesting information about a specific country's laws/regulations
    2. Asking for a response in a specific language

    Only extract this information if EXPLICITLY requested. Do not infer countries or languages from the general topic.
    Example of explicit requests: "Tell me about US copyright law", "Respond in Hindi", "What is the trademark process in Germany?", "Switch to Spanish"

    User message: "${message}"

    Respond with a JSON object:
    {
      "country": "COUNTRY_CODE or null if not explicitly mentioned",
      "language": "LANGUAGE_CODE or null if not explicitly mentioned"
    }

    Use ISO country codes (US, UK, IN, DE, FR, etc.) and language codes (en, hi, es, de, fr, etc.).
    Only set values if the user explicitly asks to change them; otherwise return null.
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    try {
      // Extract JSON
      const jsonMatch = response.match(/\{[\s\S]*"country"[\s\S]*\}/);
      if (!jsonMatch) return { country: null, language: null };
      
      const jsonStr = jsonMatch[0].replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);

  return {
        country: parsed.country,
        language: parsed.language
      };
    } catch (error) {
      console.error("Error parsing language/country detection:", error);
      return { country: null, language: null };
    }
  } catch (error) {
    console.error("Error detecting language/country change:", error);
    return { country: null, language: null };
  }
}

// Function to generate a meaningful title for a chat session
async function generateSessionTitle(conversation: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
    Create a concise, descriptive title (5-8 words) for this conversation between a user and a legal assistant.
    The title should summarize the main legal topic or question being discussed.
    Don't use phrases like "Legal consultation about..." or "Conversation regarding..." - just the key topic.

    Conversation:
    ${conversation.substring(0, 1500)} ${conversation.length > 1500 ? '...' : ''}

    Return ONLY the title, nothing else.
    `;
    
    const result = await model.generateContent(prompt);
    let title = result.response.text().trim();
    
    // Remove quotes if present
    title = title.replace(/^["']|["']$/g, '');
    
    // Limit length
    return title.substring(0, 50);
  } catch (error) {
    console.error("Error generating session title:", error);
    return null;
  }
}

// Function to get AI response
async function getAIResponse(
  message: string, 
  country: string, 
  language: string, 
  conversationHistory: string = '',
  userMemory: any = null
) {
  try {
    // Use Gemini to generate a response with country context built into prompt
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Build a context from user memory if available
    let userContext = '';
    if (userMemory) {
      const topTopics = Object.entries(userMemory.topics || {})
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 5)
        .map(([topic]) => topic)
        .join(', ');
      
      if (topTopics) {
        userContext = `Previous topics of interest: ${topTopics}. `;
      }
    }
    
    const prompt = `
    You are a helpful legal assistant that specializes in the laws and legal system of ${getCountryName(country)}.
    Respond in ${getLanguageName(language)}.
    
    ${userContext ? 'ABOUT THE USER:\n' + userContext + '\n\n' : ''}
    
    ${conversationHistory ? 'CONVERSATION HISTORY:\n' + conversationHistory + '\n\n' : ''}
    
    IMPORTANT INSTRUCTIONS:
    1. Your responses should be accurate according to ${getCountryName(country)} legal system without explicitly stating "According to ${getCountryName(country)} law".
    2. Assume all advice relates to ${getCountryName(country)} by default.
    3. Provide specific, actionable information including:
       - Exact names of relevant courts, agencies, or government offices
       - Specific forms that need to be filed
       - Precise steps in the legal process
       - Required documents and filing fees
       - Timelines and deadlines
       - Contact information for relevant authorities when appropriate
    4. Never use markdown formatting like asterisks (*) or underscores (_) in your response.
    5. Format your response as plain text only.
    6. Be concise, specific, and practical in your advice.
    7. If the question involves law from a different country, still answer but clarify which country's law applies.
    8. Use and refer to information from previous messages when relevant.
    
    USER QUERY: ${message}
    
    ASSISTANT RESPONSE:
    `;
    
    const result = await model.generateContent(prompt);
    // Remove any markdown formatting that might have been included
    let response = result.response.text();
    response = response.replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, '');
    return response;
  } catch (error) {
    console.error("Error getting AI response:", error);
    return "I'm sorry, I couldn't process your request at this time. Please try again later.";
  }
}

// Function to extract topics from the conversation
async function extractConversationTopics(userMessage: string, aiResponse: string, existingTopics: Record<string, number> = {}) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
    Extract 3-5 main legal topics from this conversation. Return topics as a JSON array of strings.
    Only include legal concepts, procedures, or document types - not general topics.
    
    User message: "${userMessage}"
    AI response: "${aiResponse}"
    
    Format your response as a valid JSON array like this: ["topic1", "topic2", "topic3"]
    Only return the JSON array, nothing else.
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    try {
      // Extract JSON array
      const match = response.match(/\[.*\]/);
      if (!match) return existingTopics;
      
      const jsonStr = match[0].replace(/```json/g, '').replace(/```/g, '').trim();
      const topics = JSON.parse(jsonStr) as string[];
      
      // Update topic counts
      const updatedTopics = { ...existingTopics };
      
      topics.forEach(topic => {
        const normalizedTopic = topic.toLowerCase().trim();
        updatedTopics[normalizedTopic] = (updatedTopics[normalizedTopic] || 0) + 1;
      });
      
      return updatedTopics;
    } catch (parseError) {
      console.error("Error parsing topics:", parseError);
      return existingTopics;
    }
  } catch (error) {
    console.error("Error extracting topics:", error);
    return existingTopics;
  }
}

// Function to get document suggestion using Gemini
async function getDocumentSuggestion(userMessage: string, aiResponse: string) {
  try {
    // Define a list of document types that our system can generate
    const availableDocumentTypes = [
      "rental_agreement", 
      "will_testament", 
      "power_of_attorney", 
      "non_disclosure_agreement", 
      "employment_contract",
      "trademark_application",
      "copyright_registration",
      "cease_and_desist",
      "demand_letter",
      "llc_formation"
    ];

    // Use Gemini to analyze the conversation and suggest a document type
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `
    Analyze this conversation between a user and a legal assistant.
    User message: "${userMessage}"
    Assistant reply: "${aiResponse}"
    
    Based on this conversation, determine if the user might need a legal document, and if so, which type.
    Only suggest a document if it's clearly relevant to the user's query.
    If no document seems appropriate, respond with "none".
    
    Available document types: ${availableDocumentTypes.join(", ")}
    
    IMPORTANT: Your response MUST be valid JSON only, in this exact format without any additional text:
    {
      "documentNeeded": true/false,
      "documentType": "document_type" or null,
      "confidence": 0.0-1.0 (decimal between 0 and 1),
      "reasoning": "brief explanation"
    }
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Parse JSON response from Gemini
    try {
      // Extract JSON object if it's wrapped in backticks or has extra text
      let jsonStr = response;
      
      // Check if the response contains a JSON object somewhere in the text
      const jsonMatch = response.match(/\{[\s\S]*"documentNeeded"[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      
      // Remove any markdown code formatting
      jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '');
      
      // Clean up the string to ensure it's valid JSON
      jsonStr = jsonStr.trim();
      
      console.log("Extracted JSON string:", jsonStr);
      
      const parsedResponse = JSON.parse(jsonStr);
      
      if (parsedResponse.documentNeeded && parsedResponse.documentType && 
          availableDocumentTypes.includes(parsedResponse.documentType) && 
          parsedResponse.confidence >= 0.7) {
        return {
          type: parsedResponse.documentType,
          confidence: parsedResponse.confidence
        };
      }
      
      return null;
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.error("Original response:", response);
      return null;
    }
  } catch (error) {
    console.error("Error getting document suggestion:", error);
    return null;
  }
}

// Helper function to get country name from code
function getCountryName(code: string) {
  const countries: Record<string, string> = {
    'IN': 'India',
    'US': 'United States',
    'UK': 'United Kingdom',
    'CA': 'Canada',
    'AU': 'Australia',
    'SG': 'Singapore'
  };
  
  return countries[code] || code;
}

// Helper function to get language name from code
function getLanguageName(code: string) {
  const languages: Record<string, string> = {
    'en': 'English',
    'hi': 'Hindi',
    'bn': 'Bengali',
    'ta': 'Tamil',
    'te': 'Telugu',
    'mr': 'Marathi',
    'gu': 'Gujarati',
    'kn': 'Kannada'
  };
  
  return languages[code] || code;
} 