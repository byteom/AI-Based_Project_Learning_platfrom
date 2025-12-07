'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

export default function PaymentFailurePage() {
    return (
        <div className="container mx-auto max-w-2xl py-12 px-4 min-h-[60vh]">
            <Card className="border-red-500/50">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                        <XCircle className="h-10 w-10 text-red-500" />
                    </div>
                    <CardTitle className="text-3xl font-bold">Payment Failed</CardTitle>
                    <CardDescription className="text-lg mt-2">
                        We couldn't process your payment. Please try again.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-secondary/50 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                            If money was deducted from your account, it will be refunded within 5-7 business days.
                            If you continue to experience issues, please contact our support team.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button asChild className="flex-1">
                            <Link href="/pricing">
                                Try Again
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="flex-1">
                            <Link href="/contact">
                                Contact Support
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

