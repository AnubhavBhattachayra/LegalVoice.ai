import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/app/utils/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lawyerId, rating, review, bookingId } = await req.json();

    if (!lawyerId || !rating || !review) {
      return NextResponse.json(
        { error: 'Lawyer ID, rating, and review are required' },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Check if user has already reviewed this lawyer
    const existingReview = await db.collection('reviews').findOne({
      userId: session.user.id,
      lawyerId: new ObjectId(lawyerId)
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this lawyer' },
        { status: 400 }
      );
    }

    // Create review
    const reviewResult = await db.collection('reviews').insertOne({
      userId: session.user.id,
      lawyerId: new ObjectId(lawyerId),
      bookingId: bookingId ? new ObjectId(bookingId) : null,
      rating,
      review,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Update lawyer's average rating and review count
    const lawyerReviews = await db.collection('reviews')
      .find({ lawyerId: new ObjectId(lawyerId) })
      .toArray();

    const averageRating = lawyerReviews.reduce(
      (acc, review) => acc + review.rating,
      0
    ) / lawyerReviews.length;

    await db.collection('lawyers').updateOne(
      { _id: new ObjectId(lawyerId) },
      {
        $set: {
          rating: averageRating,
          reviewCount: lawyerReviews.length,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      success: true,
      reviewId: reviewResult.insertedId
    });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const lawyerId = searchParams.get('lawyerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!lawyerId) {
      return NextResponse.json(
        { error: 'Lawyer ID is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get reviews with user details
    const reviews = await db.collection('reviews')
      .aggregate([
        { $match: { lawyerId: new ObjectId(lawyerId) } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit }
      ])
      .toArray();

    // Get total review count
    const totalReviews = await db.collection('reviews').countDocuments({
      lawyerId: new ObjectId(lawyerId)
    });

    return NextResponse.json({
      reviews,
      pagination: {
        total: totalReviews,
        page,
        limit,
        totalPages: Math.ceil(totalReviews / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
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

    const { reviewId, rating, review } = await req.json();

    if (!reviewId || !rating || !review) {
      return NextResponse.json(
        { error: 'Review ID, rating, and review are required' },
        { status: 400 }
      );
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Check if review exists and belongs to user
    const existingReview = await db.collection('reviews').findOne({
      _id: new ObjectId(reviewId),
      userId: session.user.id
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update review
    await db.collection('reviews').updateOne(
      { _id: new ObjectId(reviewId) },
      {
        $set: {
          rating,
          review,
          updatedAt: new Date()
        }
      }
    );

    // Update lawyer's average rating
    const lawyerReviews = await db.collection('reviews')
      .find({ lawyerId: existingReview.lawyerId })
      .toArray();

    const averageRating = lawyerReviews.reduce(
      (acc, review) => acc + review.rating,
      0
    ) / lawyerReviews.length;

    await db.collection('lawyers').updateOne(
      { _id: existingReview.lawyerId },
      {
        $set: {
          rating: averageRating,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
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

    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get('reviewId');

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Check if review exists and belongs to user
    const existingReview = await db.collection('reviews').findOne({
      _id: new ObjectId(reviewId),
      userId: session.user.id
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found or unauthorized' },
        { status: 404 }
      );
    }

    // Delete review
    await db.collection('reviews').deleteOne({
      _id: new ObjectId(reviewId)
    });

    // Update lawyer's average rating and review count
    const lawyerReviews = await db.collection('reviews')
      .find({ lawyerId: existingReview.lawyerId })
      .toArray();

    const averageRating = lawyerReviews.length > 0
      ? lawyerReviews.reduce((acc, review) => acc + review.rating, 0) / lawyerReviews.length
      : 0;

    await db.collection('lawyers').updateOne(
      { _id: existingReview.lawyerId },
      {
        $set: {
          rating: averageRating,
          reviewCount: lawyerReviews.length,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
} 