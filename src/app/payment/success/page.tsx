'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSubscription } from '@/hooks/use-subscription';

function PaymentSuccessContent() {
    const searchParams = useSearchParams();
    const paymentId = searchParams.get('payment_id');
    const { subscription, isLoading } = useSubscription();
    const [isVerifying, setIsVerifying] = useState(true);

    useEffect(() => {
        // Refresh subscription status after a short delay to allow backend to process
        const timer = setTimeout(() => {
            setIsVerifying(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    if (isLoading || isVerifying) {
        return (
            <div className="container mx-auto max-w-2xl py-12 px-4 flex items-center justify-center min-h-[60vh]">
                <Card className="w-full">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="text-muted-foreground">Verifying your payment...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-2xl py-12 px-4 min-h-[60vh]">
            <Card className="border-green-500/50">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <CardTitle className="text-3xl font-bold">Payment Successful!</CardTitle>
                    <CardDescription className="text-lg mt-2">
                        Your Pro subscription has been activated.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {paymentId && (
                        <div className="bg-secondary/50 p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground">Payment ID</p>
                            <p className="font-mono text-sm break-all">{paymentId}</p>
                        </div>
                    )}

                    {subscription?.status === 'pro' ? (
                        <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                            <p className="text-sm font-semibold text-primary mb-1">Subscription Status</p>
                            <p className="text-lg font-bold">Pro Plan Active</p>
                            {subscription.current_period_end && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Valid until {new Date(subscription.current_period_end).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
                            <p className="text-sm text-yellow-600">
                                Your subscription is being processed. Please refresh the page in a few moments.
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button asChild className="flex-1">
                            <Link href="/project-practice">
                                Start Building Projects
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="flex-1">
                            <Link href="/profile">
                                View Profile
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function LoadingFallback() {
    return (
        <div className="container mx-auto max-w-2xl py-12 px-4 flex items-center justify-center min-h-[60vh]">
            <Card className="w-full">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <PaymentSuccessContent />
        </Suspense>
    );
}

