import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/app/utils/mongodb';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const specialization = searchParams.get('specialization');
    const minRating = parseFloat(searchParams.get('minRating') || '0');
    const maxRate = parseFloat(searchParams.get('maxRate') || '1000');
    const experience = searchParams.get('experience');
    const location = searchParams.get('location');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'rating';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Build query
    const query: any = {};

    if (specialization) {
      query.specialization = specialization;
    }

    if (minRating > 0) {
      query.rating = { $gte: minRating };
    }

    if (maxRate < 1000) {
      query.hourlyRate = { $lte: maxRate };
    }

    if (experience) {
      query.experience = { $gte: parseInt(experience) };
    }

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Build sort object
    const sort: any = {};
    switch (sortBy) {
      case 'rating':
        sort.rating = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'experience':
        sort.experience = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'rate':
        sort.hourlyRate = sortOrder === 'desc' ? -1 : 1;
        break;
      case 'reviews':
        sort.reviewCount = sortOrder === 'desc' ? -1 : 1;
        break;
      default:
        sort.rating = -1;
    }

    // Get total count for pagination
    const total = await db.collection('lawyers').countDocuments(query);

    // Get lawyers with pagination and sorting
    const lawyers = await db.collection('lawyers')
      .find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Get specializations for filter options
    const specializations = await db.collection('lawyers')
      .distinct('specialization');

    // Get experience ranges for filter options
    const experienceRanges = [
      { label: '0-2 years', value: '0' },
      { label: '3-5 years', value: '3' },
      { label: '6-10 years', value: '6' },
      { label: '10+ years', value: '10' }
    ];

    // Get rate ranges for filter options
    const rateRanges = [
      { label: 'Under $100', value: '100' },
      { label: '$100-$200', value: '200' },
      { label: '$200-$300', value: '300' },
      { label: '$300+', value: '300' }
    ];

    return NextResponse.json({
      lawyers,
      filters: {
        specializations,
        experienceRanges,
        rateRanges
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error searching lawyers:', error);
    return NextResponse.json(
      { error: 'Failed to search lawyers' },
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

    const {
      name,
      specialization,
      experience,
      education,
      firm,
      hourlyRate,
      location,
      imageUrl,
      bio,
      availability
    } = await req.json();

    // Validate required fields
    if (!name || !specialization || !experience || !hourlyRate) {
      return NextResponse.json(
        { error: 'Name, specialization, experience, and hourly rate are required' },
        { status: 400 }
      );
    }

    // Create lawyer profile
    const lawyer = await db.collection('lawyers').insertOne({
      name,
      specialization,
      experience,
      education,
      firm,
      hourlyRate,
      location,
      imageUrl,
      bio,
      availability,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      lawyerId: lawyer.insertedId
    });
  } catch (error) {
    console.error('Error creating lawyer profile:', error);
    return NextResponse.json(
      { error: 'Failed to create lawyer profile' },
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

    // Check if user is admin or the lawyer themselves
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({
      _id: session.user.id,
      role: { $in: ['admin', 'lawyer'] }
    });

    if (!user) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { lawyerId, ...updateData } = await req.json();

    if (!lawyerId) {
      return NextResponse.json(
        { error: 'Lawyer ID is required' },
        { status: 400 }
      );
    }

    // Update lawyer profile
    const result = await db.collection('lawyers').updateOne(
      { _id: lawyerId },
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
    console.error('Error updating lawyer profile:', error);
    return NextResponse.json(
      { error: 'Failed to update lawyer profile' },
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
    const lawyerId = searchParams.get('lawyerId');

    if (!lawyerId) {
      return NextResponse.json(
        { error: 'Lawyer ID is required' },
        { status: 400 }
      );
    }

    // Delete lawyer profile
    const result = await db.collection('lawyers').deleteOne({
      _id: lawyerId
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Lawyer not found' },
        { status: 404 }
      );
    }

    // Delete associated reviews
    await db.collection('reviews').deleteMany({
      lawyerId: lawyerId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lawyer profile:', error);
    return NextResponse.json(
      { error: 'Failed to delete lawyer profile' },
      { status: 500 }
    );
  }
} 