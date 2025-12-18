import axios from 'axios';
import crypto from 'crypto';
import { IPaymentInitializeResponse, IPaystackInitializePayload, IPaystackInitializeResponse, IPaystackVerifyResponse } from '../interfaces/order.interface';
import { PaymentProvider } from '../models/types/transaction.types';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = process.env.PAYSTACK_BASE_URL;

if (!PAYSTACK_SECRET_KEY || !PAYSTACK_BASE_URL) {
    console.warn("WARNING: PAYSTACK_SECRET_KEY or PAYSTACK_BASE_URL is not defined in environment variables payment will fail.");
}

export class PaymentService {

    private static getHeaders() {
        return {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`, // Access env directly in case it's set later
            'Content-Type': 'application/json'
        };
    }

    static async initializeTransaction(email: string, amount: number, callbackUrl?: string, metadata?: any): Promise<IPaymentInitializeResponse> {
        try {
            // Paystack expects amount in kobo (multiply by 100)
            const amountInKobo = Math.round(amount * 100);

            const payload: IPaystackInitializePayload = {
                email,
                amount: amountInKobo.toString(),
                channels: ["card", "bank", "ussd", "bank_transfer"]
            };

            if (metadata) {
                payload.metadata = metadata;
            }

            const response = await axios.post<IPaystackInitializeResponse>(
                `${PAYSTACK_BASE_URL}/transaction/initialize`,
                payload,
                { headers: this.getHeaders() }
            );

            if (!response.data.status) {
                throw new Error(response.data.message || 'Payment initialization failed');
            }

            return {
                provider: PaymentProvider.PAYSTACK,
                authorization_url: response.data.data.authorization_url,
                access_code: response.data.data.access_code,
                reference: response.data.data.reference,
            };

        } catch (error: any) {
            console.error("Paystack Initialize Error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Payment initialization error');
        }
    }

    static async verifyTransaction(reference: string): Promise<IPaystackVerifyResponse['data']> {
        try {
            const response = await axios.get<IPaystackVerifyResponse>(
                `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
                { headers: this.getHeaders() }
            );

            if (!response.data.status) {
                throw new Error(response.data.message || 'Payment verification failed');
            }

            return response.data.data;

        } catch (error: any) {
            console.error("Paystack Verify Error:", error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Payment verification error');
        }
    }

    static verifySignature(signature: string, body: any): boolean {
        const secret = process.env.PAYSTACK_SECRET_KEY || '';

        // If body is a Buffer or String, use it directly. Otherwise stringify (legacy behavior for parsed JSON)
        const data = (Buffer.isBuffer(body) || typeof body === 'string')
            ? body
            : JSON.stringify(body);

        const hash = crypto.createHmac('sha512', secret)
            .update(data)
            .digest('hex');
        return hash === signature;
    }
}
