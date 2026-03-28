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

    const { lawyerId, date, time, duration, topic } = await req.json();

    if (!lawyerId || !date || !time || !duration) {
      return NextResponse.json(
        { error: 'Lawyer ID, date, time, and duration are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get lawyer details
    const lawyer = await db.collection('lawyers').findOne({
      _id: new ObjectId(lawyerId)
    });

    if (!lawyer) {
      return NextResponse.json(
        { error: 'Lawyer not found' },
        { status: 404 }
      );
    }

    // Calculate cost based on duration and lawyer's hourly rate
    const hours = Math.ceil(duration / 60);
    const cost = hours * lawyer.hourlyRate;

    // Check if user has enough credits
    const user = await db.collection('users').findOne({
      _id: session.user.id
    });

    if (!user || user.credits < cost) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 400 }
      );
    }

    // Check if slot is available
    const existingBooking = await db.collection('bookings').findOne({
      lawyerId: new ObjectId(lawyerId),
      date,
      time,
      status: { $ne: 'cancelled' }
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 400 }
      );
    }

    // Create booking
    const booking = await db.collection('bookings').insertOne({
      userId: session.user.id,
      lawyerId: new ObjectId(lawyerId),
      date,
      time,
      duration,
      topic,
      cost,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Deduct credits from user
    await db.collection('users').updateOne(
      { _id: session.user.id },
      { $inc: { credits: -cost } }
    );

    // Create credit transaction
    await db.collection('creditTransactions').insertOne({
      userId: session.user.id,
      amount: -cost,
      type: 'booking',
      description: `Consultation booking with ${lawyer.name}`,
      bookingId: booking.insertedId,
      createdAt: new Date()
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.insertedId
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Build query
    const query: any = { userId: session.user.id };
    if (status) query.status = status;
    if (startDate && endDate) {
      query.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Get bookings with lawyer details
    const bookings = await db.collection('bookings')
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'lawyers',
            localField: 'lawyerId',
            foreignField: '_id',
            as: 'lawyer'
          }
        },
        { $unwind: '$lawyer' },
        { $sort: { date: 1, time: 1 } }
      ])
      .toArray();

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
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

    const { bookingId, status } = await req.json();

    if (!bookingId || !status) {
      return NextResponse.json(
        { error: 'Booking ID and status are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get booking details
    const booking = await db.collection('bookings').findOne({
      _id: new ObjectId(bookingId),
      userId: session.user.id
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Update booking status
    const result = await db.collection('bookings').updateOne(
      { _id: new ObjectId(bookingId) },
      {
        $set: {
          status,
          updatedAt: new Date()
        }
      }
    );

    // If booking is cancelled, refund credits
    if (status === 'cancelled') {
      await db.collection('users').updateOne(
        { _id: session.user.id },
        { $inc: { credits: booking.cost } }
      );

      // Create refund transaction
      await db.collection('creditTransactions').insertOne({
        userId: session.user.id,
        amount: booking.cost,
        type: 'refund',
        description: `Refund for cancelled consultation with ${booking.lawyer.name}`,
        bookingId: new ObjectId(bookingId),
        createdAt: new Date()
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
} 