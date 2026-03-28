import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/app/utils/mongodb';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const specialization = searchParams.get('specialization');
    const minRating = searchParams.get('minRating');
    const maxRate = searchParams.get('maxRate');

    // Build query
    const query: any = {};
    if (specialization) {
      query.specialization = specialization;
    }
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }
    if (maxRate) {
      query.hourlyRate = { $lte: parseFloat(maxRate) };
    }

    // Get lawyers from database
    const lawyers = await db.collection('lawyers')
      .find(query)
      .sort({ rating: -1, reviews: -1 })
      .toArray();

    return NextResponse.json(lawyers);
  } catch (error) {
    console.error('Error fetching lawyers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lawyers' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({
      _id: session.user.id,
      role: 'admin'
    });

    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const lawyerData = await req.json();

    // Validate required fields
    const requiredFields = [
      'name',
      'specialization',
      'experience',
      'firm',
      'education',
      'hourlyRate',
      'imageUrl'
    ];

    for (const field of requiredFields) {
      if (!lawyerData[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Add default values
    const lawyer = {
      ...lawyerData,
      rating: 0,
      reviews: 0,
      availability: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert lawyer into database
    const result = await db.collection('lawyers').insertOne(lawyer);

    return NextResponse.json({
      id: result.insertedId,
      ...lawyer
    });
  } catch (error) {
    console.error('Error creating lawyer:', error);
    return NextResponse.json(
      { error: 'Failed to create lawyer' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({
      _id: session.user.id,
      role: 'admin'
    });

    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, ...updateData } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Lawyer ID is required' },
        { status: 400 }
      );
    }

    // Update lawyer in database
    const result = await db.collection('lawyers').updateOne(
      { _id: id },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Lawyer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating lawyer:', error);
    return NextResponse.json(
      { error: 'Failed to update lawyer' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({
      _id: session.user.id,
      role: 'admin'
    });

    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Lawyer ID is required' },
        { status: 400 }
      );
    }

    // Delete lawyer from database
    const result = await db.collection('lawyers').deleteOne({ _id: id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Lawyer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lawyer:', error);
    return NextResponse.json(
      { error: 'Failed to delete lawyer' },
      { status: 500 }
    );
  }
} 