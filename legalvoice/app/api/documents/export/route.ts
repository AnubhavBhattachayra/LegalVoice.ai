import { NextRequest, NextResponse } from 'next/server';
import * as puppeteer from 'puppeteer';

export async function POST(req: NextRequest) {
  try {
    const { title, content, format = 'pdf' } = await req.json();

    if (!content) {
      return NextResponse.json({ 
        success: false, 
        error: 'Document content is required' 
      }, { status: 400 });
    }

    // Only PDF format is supported for now
    if (format !== 'pdf') {
      return NextResponse.json({ 
        success: false, 
        error: 'Only PDF format is supported' 
      }, { status: 400 });
    }

    // Generate the HTML content for the PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title || 'Legal Document'}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 2cm;
          }
          h1, h2, h3 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
          }
          h1 {
            text-align: center;
            margin-bottom: 2em;
          }
          p {
            margin-bottom: 1em;
          }
          .document-content {
            white-space: pre-line;
          }
        </style>
      </head>
      <body>
        <h1>${title || 'Legal Document'}</h1>
        <div class="document-content">${content}</div>
      </body>
      </html>
    `;

    try {
      // Launch a headless browser
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      // Create a new page
      const page = await browser.newPage();
      
      // Set the HTML content
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        }
      });
      
      // Close browser
      await browser.close();
      
      // Return the PDF
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${title || 'document'}.pdf"`
        }
      });
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      
      // Fallback: Return the raw text content
      return NextResponse.json({
        success: false,
        error: 'Failed to generate PDF',
        rawContent: content
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in document export API:', error);
    return NextResponse.json({
      success: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
} 