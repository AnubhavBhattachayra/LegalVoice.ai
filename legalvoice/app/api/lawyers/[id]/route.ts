import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/app/utils/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get lawyer profile with reviews
    const lawyer = await db.collection('lawyers')
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'lawyerId',
            as: 'reviews'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'reviews.userId',
            foreignField: '_id',
            as: 'reviewUsers'
          }
        },
        {
          $addFields: {
            reviews: {
              $map: {
                input: '$reviews',
                as: 'review',
                in: {
                  $mergeObjects: [
                    '$$review',
                    {
                      user: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$reviewUsers',
                              as: 'user',
                              cond: { $eq: ['$$user._id', '$$review.userId'] }
                            }
                          },
                          0
                        ]
                      }
                    }
                  ]
                }
              }
            }
          }
        },
        {
          $project: {
            reviewUsers: 0
          }
        }
      ])
      .toArray();

    if (!lawyer || lawyer.length === 0) {
      return NextResponse.json(
        { error: 'Lawyer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(lawyer[0]);
  } catch (error) {
    console.error('Error fetching lawyer profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lawyer profile' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;
    const updateData = await req.json();

    // Update lawyer profile
    const result = await db.collection('lawyers').updateOne(
      { _id: new ObjectId(id) },
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

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Delete lawyer profile
    const result = await db.collection('lawyers').deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Lawyer not found' },
        { status: 404 }
      );
    }

    // Delete associated reviews
    await db.collection('reviews').deleteMany({
      lawyerId: new ObjectId(id)
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