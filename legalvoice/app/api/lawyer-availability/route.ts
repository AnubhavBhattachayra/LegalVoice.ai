import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { connectToDatabase } from '@/app/utils/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const lawyerId = searchParams.get('lawyerId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!lawyerId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Lawyer ID, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Get lawyer's availability
    const lawyer = await db.collection('lawyers').findOne({
      _id: new ObjectId(lawyerId)
    });

    if (!lawyer) {
      return NextResponse.json(
        { error: 'Lawyer not found' },
        { status: 404 }
      );
    }

    // Get existing bookings for the date range
    const existingBookings = await db.collection('bookings')
      .find({
        lawyerId: new ObjectId(lawyerId),
        date: {
          $gte: startDate,
          $lte: endDate
        },
        status: { $ne: 'cancelled' }
      })
      .toArray();

    // Generate availability calendar
    const availability = generateAvailabilityCalendar(
      startDate,
      endDate,
      lawyer.availability || {},
      existingBookings
    );

    return NextResponse.json(availability);
  } catch (error) {
    console.error('Error fetching lawyer availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lawyer availability' },
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

    const { lawyerId, date, availability } = await req.json();

    if (!lawyerId || !date || !availability) {
      return NextResponse.json(
        { error: 'Lawyer ID, date, and availability are required' },
        { status: 400 }
      );
    }

    // Validate availability format
    if (!isValidAvailability(availability)) {
      return NextResponse.json(
        { error: 'Invalid availability format' },
        { status: 400 }
      );
    }

    // Update lawyer's availability
    const result = await db.collection('lawyers').updateOne(
      { _id: new ObjectId(lawyerId) },
      {
        $set: {
          [`availability.${date}`]: availability,
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
    console.error('Error updating availability:', error);
    return NextResponse.json(
      { error: 'Failed to update availability' },
      { status: 500 }
    );
  }
}

function generateAvailabilityCalendar(
  startDate: string,
  endDate: string,
  lawyerAvailability: Record<string, any>,
  existingBookings: any[]
): Record<string, any> {
  const calendar: Record<string, any> = {};
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.getDay();

    // Skip weekends unless specifically configured
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Get lawyer's availability for this date
    const dateAvailability = lawyerAvailability[dateStr] || {
      start: 9, // Default 9 AM
      end: 17 // Default 5 PM
    };

    // Get existing bookings for this date
    const dateBookings = existingBookings.filter(
      booking => booking.date === dateStr
    );

    // Generate available time slots
    const slots = generateTimeSlots(
      dateStr,
      dateAvailability,
      dateBookings
    );

    calendar[dateStr] = slots;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return calendar;
}

function generateTimeSlots(
  date: string,
  availability: { start: number; end: number },
  existingBookings: any[]
): { time: string; available: boolean }[] {
  const slots: { time: string; available: boolean }[] = [];
  const startHour = availability.start;
  const endHour = availability.end;

  // Convert existing bookings to time slots for comparison
  const bookedSlots = existingBookings.map(booking => {
    const [hours, minutes] = booking.time.split(':').map(Number);
    return hours * 60 + minutes;
  });

  // Generate slots for each hour
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minutes = 0; minutes < 60; minutes += 30) {
      const timeInMinutes = hour * 60 + minutes;
      const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      // Check if slot is already booked
      const isAvailable = !bookedSlots.includes(timeInMinutes);

      slots.push({
        time: timeString,
        available: isAvailable
      });
    }
  }

  return slots;
}

function isValidAvailability(availability: any): boolean {
  if (!availability || typeof availability !== 'object') {
    return false;
  }

  const { start, end } = availability;
  if (
    typeof start !== 'number' ||
    typeof end !== 'number' ||
    start < 0 ||
    end > 24 ||
    start >= end
  ) {
    return false;
  }

  return true;
} 