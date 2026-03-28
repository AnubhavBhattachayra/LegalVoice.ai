import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserFromRequest } from '@/app/lib/utils/authHelpers';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { ObjectId } from 'mongodb';

// Initialize Gemini API with the key set in environment variables
const apiKey = process.env.GEMINI_API_KEY;

// Check if API key is available
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey || '');

// Document templates for different types
const DOCUMENT_TEMPLATES = {
  rent_agreement: `RENT AGREEMENT

THIS RENT AGREEMENT made on {date} BETWEEN

{landlordName}, residing at {landlordAddress} (hereinafter referred to as the "LANDLORD")

AND

{tenantName}, residing at {tenantAddress} (hereinafter referred to as the "TENANT")

WHEREAS the Landlord is the owner of the property situated at {propertyAddress} (hereinafter referred to as the "PREMISES").

NOW THIS AGREEMENT WITNESSETH AS FOLLOWS:

1. TERM: The Landlord hereby agrees to rent the Premises to the Tenant for a term of {duration} commencing from {startDate} and ending on {endDate}.

2. RENT: The Tenant agrees to pay the Landlord a monthly rent of Rs. {rentAmount} payable in advance on or before the {paymentDueDay} day of each month.

3. SECURITY DEPOSIT: The Tenant has paid a security deposit of Rs. {securityDeposit} which shall be refunded by the Landlord upon termination of this Agreement, subject to deductions for damages, if any, beyond normal wear and tear.

4. UTILITIES: The following utilities are included in the rent: {utilities}. All other utilities shall be arranged and paid for by the Tenant.

5. MAINTENANCE: The Tenant shall maintain the Premises in good condition and shall be responsible for any damage caused by the Tenant, the Tenant's family members, or visitors.

6. NO SUBLETTING: The Tenant shall not sublet the Premises or any part thereof without the prior written consent of the Landlord.

7. TERMINATION: Either party may terminate this Agreement by giving the other party one month's notice in writing.

{additionalTerms}

IN WITNESS WHEREOF, the parties hereto have executed this Agreement on the date first above written.

____________________                       ____________________
(Landlord)                                 (Tenant)

WITNESSES:

1. ____________________                    2. ____________________`,

  power_of_attorney: `POWER OF ATTORNEY

KNOW ALL MEN BY THESE PRESENTS:

THAT I, {principalName}, adult, resident of {principalAddress}, do hereby appoint, nominate and constitute {agentName}, adult, resident of {agentAddress}, as my true and lawful Attorney to do and execute the following acts, deeds and things in my name and on my behalf:

1. POWERS GRANTED: This Power of Attorney grants the following powers to my Attorney: {powersGranted}.

2. EFFECTIVE DATE: This Power of Attorney shall come into effect on {effectiveDate}.

3. EXPIRATION: This Power of Attorney shall {expirationDate ? 'expire on ' + expirationDate : 'remain in effect until revoked by me in writing'}.

4. SPECIAL INSTRUCTIONS: {specialInstructions}

5. REVOCATION: I reserve the right to revoke this Power of Attorney at any time by executing a written instrument of revocation.

IN WITNESS WHEREOF, I have signed this Power of Attorney on this {day} day of {month}, {year}.

____________________
({principalName})
Principal

WITNESSES:

1. ____________________                    2. ____________________`,

  // Other document templates can be added here
};

export async function GET(req: NextRequest) {
  try {
    // Get user from auth
    let user = null;
    try {
      user = await getUserFromRequest(req);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized access' 
      }, { status: 401 });
    }

    // Get the documents from the database
    try {
      const { db } = await connectToDatabase();
      
      // Check if user exists before accessing its properties
      if (!user || !user.id) {
        console.error('User not authenticated or user.id is missing');
        return NextResponse.json({ 
          success: false, 
          error: 'Authentication required' 
        }, { status: 401 });
      }
      
      const documents = await db.collection('documents')
        .find({ userId: user.id })
        .sort({ createdAt: -1 })
        .toArray();
      
      return NextResponse.json({
        success: true,
        documents
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch documents' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in GET /api/documents:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An error occurred' 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get user from auth
    let user = null;
    try {
      user = await getUserFromRequest(req);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized access' 
      }, { status: 401 });
    }

    const { title, content, documentType, metadata } = await req.json();

    if (!title || !content) {
      return NextResponse.json({ 
        success: false, 
        error: 'Title and content are required' 
      }, { status: 400 });
    }

    // Save the document to the database
    try {
      const { db } = await connectToDatabase();
      
      // Check if user exists before accessing its properties
      if (!user || !user.id) {
        console.error('User not authenticated or user.id is missing');
        return NextResponse.json({ 
          success: false, 
          error: 'Authentication required' 
        }, { status: 401 });
      }
      
      const now = new Date();
      const result = await db.collection('documents').insertOne({
        userId: user.id,
        title,
        content,
        documentType: documentType || 'other',
        metadata: metadata || {},
        createdAt: now,
        updatedAt: now
      });
      
      return NextResponse.json({
        success: true,
        documentId: result.insertedId.toString()
      });
    } catch (error) {
      console.error('Error saving document:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save document' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in POST /api/documents:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An error occurred' 
    }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Get user from auth
    let user = null;
    try {
      user = await getUserFromRequest(req);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized access' 
      }, { status: 401 });
    }

    const { id, title, content, metadata } = await req.json();

    if (!id || !title || !content) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID, title, and content are required' 
      }, { status: 400 });
    }

    // Update the document in the database
    try {
      const { db } = await connectToDatabase();
      
      // Check if user exists before accessing its properties
      if (!user || !user.id) {
        console.error('User not authenticated or user.id is missing');
        return NextResponse.json({ 
          success: false, 
          error: 'Authentication required' 
        }, { status: 401 });
      }
      
      const result = await db.collection('documents').updateOne(
        { _id: new ObjectId(id), userId: user.id },
        { 
          $set: { 
            title,
            content,
            metadata: metadata || {},
            updatedAt: new Date()
          } 
        }
      );
      
      if (result.matchedCount === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Document not found or you do not have permission to update it' 
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: true
      });
    } catch (error) {
      console.error('Error updating document:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update document' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in PUT /api/documents:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An error occurred' 
    }, { status: 500 });
  }
} 