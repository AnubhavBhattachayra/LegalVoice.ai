import { connectToDatabase } from './mongodb';
import { ObjectId } from 'mongodb';

export async function checkCreditsAvailable(userId: string, requiredCredits: number): Promise<boolean> {
  try {
    const { db } = await connectToDatabase();

    // Get user's credit information
    const userCredits = await db.collection('user_credits').findOne({
      userId: userId
    });

    if (!userCredits) {
      return false;
    }

    // Check if user has enough credits
    return userCredits.availableCredits >= requiredCredits;
  } catch (error) {
    console.error('Error checking credits:', error);
    return false;
  }
}

export async function deductCredits(userId: string, amount: number): Promise<boolean> {
  try {
    const { db } = await connectToDatabase();

    // Start a transaction
    const session = client.startSession();
    session.startTransaction();

    try {
      // Get user's credit information
      const userCredits = await db.collection('user_credits').findOne({
        userId: userId
      }, { session });

      if (!userCredits || userCredits.availableCredits < amount) {
        throw new Error('Insufficient credits');
      }

      // Update user's credits
      await db.collection('user_credits').updateOne(
        { userId: userId },
        {
          $inc: {
            availableCredits: -amount,
            usedCredits: amount
          }
        },
        { session }
      );

      // Log the credit transaction
      await db.collection('credit_transactions').insertOne({
        userId: userId,
        amount: -amount,
        type: 'usage',
        timestamp: new Date(),
        description: 'Document analysis credit usage'
      }, { session });

      // Commit the transaction
      await session.commitTransaction();
      return true;
    } catch (error) {
      // If an error occurred, abort the transaction
      await session.abortTransaction();
      throw error;
    } finally {
      // End the session
      await session.endSession();
    }
  } catch (error) {
    console.error('Error deducting credits:', error);
    return false;
  }
}

export async function addCredits(userId: string, amount: number, source: string): Promise<boolean> {
  try {
    const { db } = await connectToDatabase();

    // Start a transaction
    const session = client.startSession();
    session.startTransaction();

    try {
      // Update user's credits
      await db.collection('user_credits').updateOne(
        { userId: userId },
        {
          $inc: {
            availableCredits: amount,
            totalCredits: amount
          }
        },
        { session }
      );

      // Log the credit transaction
      await db.collection('credit_transactions').insertOne({
        userId: userId,
        amount: amount,
        type: 'purchase',
        timestamp: new Date(),
        description: `Credit purchase from ${source}`
      }, { session });

      // Commit the transaction
      await session.commitTransaction();
      return true;
    } catch (error) {
      // If an error occurred, abort the transaction
      await session.abortTransaction();
      throw error;
    } finally {
      // End the session
      await session.endSession();
    }
  } catch (error) {
    console.error('Error adding credits:', error);
    return false;
  }
}

export async function getCreditHistory(userId: string): Promise<any[]> {
  try {
    const { db } = await connectToDatabase();

    // Get user's credit transaction history
    const transactions = await db.collection('credit_transactions')
      .find({ userId: userId })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return transactions;
  } catch (error) {
    console.error('Error getting credit history:', error);
    return [];
  }
}

export async function getCreditBalance(userId: string): Promise<number> {
  try {
    const { db } = await connectToDatabase();

    // Get user's current credit balance
    const userCredits = await db.collection('user_credits').findOne({
      userId: userId
    });

    return userCredits?.availableCredits || 0;
  } catch (error) {
    console.error('Error getting credit balance:', error);
    return 0;
  }
} 