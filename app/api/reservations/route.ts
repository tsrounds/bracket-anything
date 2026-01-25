import { NextResponse } from 'next/server';
import { adminDb } from '../../lib/firebase/firebase-admin';

export async function POST(request: Request) {
  try {
    const { name, email, quantity } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Missing name or email' }, { status: 400 });
    }

    const parsedQuantity = typeof quantity === 'number' ? quantity : parseInt(String(quantity || 1), 10);
    const validatedQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 && parsedQuantity <= 99 ? parsedQuantity : 1;

    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    await adminDb.collection('reservations').add({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      quantity: validatedQuantity,
      createdAt: new Date(),
      source: 'red-rising',
      ip,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Reservation POST error', error);
    return NextResponse.json({ error: error?.message || 'Unknown error' }, { status: 500 });
  }
}



