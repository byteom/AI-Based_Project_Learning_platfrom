'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Script from "next/script";
import { getPricingConfig, getPricingConfigById } from "@/lib/firestore-pricing";
import type { PricingConfig } from "@/lib/types";
import { auth } from "@/lib/firebase";

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function PricingPage() {
    const { user, loading: authLoading } = useAuth();
    const { subscription, isLoading: subscriptionLoading, hasProAccess } = useSubscription();
    const [isProcessing, setIsProcessing] = useState(false);
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);
    const [pricingPlans, setPricingPlans] = useState<PricingConfig[]>([]);
    const [isLoadingPricing, setIsLoadingPricing] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    // Fetch pricing from Firestore
    useEffect(() => {
        const loadPricing = async () => {
            try {
                const configs = await getPricingConfig();
                setPricingPlans(configs);
            } catch (error) {
                console.error("Failed to load pricing:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load pricing information.",
                });
            } finally {
                setIsLoadingPricing(false);
            }
        };
        loadPricing();
    }, [toast]);

    // Get Free and Pro plans
    const freePlan = pricingPlans.find(p => p.id === 'free');
    const proPlan = pricingPlans.find(p => p.id === 'pro');

    const handlePayment = async () => {
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "Please login to upgrade to Pro plan.",
                variant: "destructive",
            });
            router.push('/auth');
            return;
        }

        if (hasProAccess) {
            toast({
                title: "Already Pro",
                description: "You already have Pro access!",
            });
            return;
        }

        if (!proPlan || !proPlan.isActive) {
            toast({
                title: "Plan Unavailable",
                description: "The Pro plan is currently unavailable.",
                variant: "destructive",
            });
            return;
        }

        setIsProcessing(true);

        try {
            // Get Firebase ID token from current user
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('User not authenticated');
            }
            const token = await currentUser.getIdToken();

            // Create order - use plan price from Firestore
            const response = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    planId: 'pro',
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to create order');
            }

            const orderData = await response.json();

            // Initialize Razorpay checkout
            const options = {
                key: orderData.key,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'Project Code',
                description: 'Pro Plan Subscription',
                order_id: orderData.orderId,
                handler: async function (response: any) {
                    try {
                        // Get fresh token for verification
                        const currentUserForVerify = auth.currentUser;
                        if (!currentUserForVerify) {
                            throw new Error('User not authenticated');
                        }
                        const verifyToken = await currentUserForVerify.getIdToken();
                        
                        // Verify payment
                        const verifyResponse = await fetch('/api/payment/verify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${verifyToken}`,
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                planId: 'pro',
                            }),
                        });

                        if (!verifyResponse.ok) {
                            const error = await verifyResponse.json();
                            throw new Error(error.error || 'Payment verification failed');
                        }

                        // Redirect to success page
                        router.push(`/payment/success?payment_id=${response.razorpay_payment_id}`);
                    } catch (error: any) {
                        console.error('Payment verification error:', error);
                        toast({
                            title: "Payment Verification Failed",
                            description: error.message || "Please contact support if payment was deducted.",
                            variant: "destructive",
                        });
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: currentUser.displayName || currentUser.email?.split('@')[0] || '',
                    email: currentUser.email || '',
                },
                theme: {
                    color: '#9333EA',
                },
                modal: {
                    ondismiss: function() {
                        setIsProcessing(false);
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response: any) {
                console.error('Payment failed:', response);
                toast({
                    title: "Payment Failed",
                    description: response.error.description || "Payment could not be processed. Please try again.",
                    variant: "destructive",
                });
                setIsProcessing(false);
            });

            razorpay.open();
        } catch (error: any) {
            console.error('Payment error:', error);
            toast({
                title: "Payment Error",
                description: error.message || "Failed to initiate payment. Please try again.",
                variant: "destructive",
            });
            setIsProcessing(false);
        }
    };

    if (authLoading || subscriptionLoading || isLoadingPricing) {
        return (
            <div className="container mx-auto max-w-4xl py-12 px-4 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <>
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                onLoad={() => setRazorpayLoaded(true)}
                strategy="lazyOnload"
            />
            <div className="container mx-auto max-w-4xl py-12 px-4">
                <header className="text-center mb-12">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline tracking-tighter">Find the perfect plan</h1>
                    <p className="text-muted-foreground mt-4 text-base sm:text-lg">
                        Start for free, and unlock more power when you need it.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Free Plan */}
                    {freePlan && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl sm:text-3xl">{freePlan.planName}</CardTitle>
                                <CardDescription>
                                    For individuals just getting started with project-based learning.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-3xl sm:text-4xl font-bold">
                                    {freePlan.currency === 'USD' && '$'}
                                    {freePlan.currency === 'INR' && '₹'}
                                    {freePlan.currency === 'EUR' && '€'}
                                    {freePlan.currency === 'GBP' && '£'}
                                    {freePlan.price}
                                    <span className="text-base sm:text-lg font-normal text-muted-foreground">/{freePlan.interval}</span> 
                                </p>
                                <ul className="space-y-2">
                                    {freePlan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                                            <span className="text-sm sm:text-base text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button 
                                    variant="outline" 
                                    className="w-full" 
                                    disabled={!hasProAccess || subscription?.status === 'free'}
                                >
                                    {subscription?.status === 'free' ? 'Your Current Plan' : 'Downgrade to Free'}
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {/* Pro Plan */}
                    {proPlan && proPlan.isActive && (
                        <Card className="border-primary shadow-lg shadow-primary/10">
                            <CardHeader>
                                <CardTitle className="font-headline text-2xl sm:text-3xl">{proPlan.planName}</CardTitle>
                                <CardDescription>
                                    For serious learners who want to build unlimited projects.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-3xl sm:text-4xl font-bold">
                                    {proPlan.currency === 'USD' && '$'}
                                    {proPlan.currency === 'INR' && '₹'}
                                    {proPlan.currency === 'EUR' && '€'}
                                    {proPlan.currency === 'GBP' && '£'}
                                    {proPlan.price}
                                    <span className="text-base sm:text-lg font-normal text-muted-foreground">/{proPlan.interval}</span> 
                                </p>
                                <ul className="space-y-2">
                                    {proPlan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2">
                                            <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                                            <span className="text-sm sm:text-base">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button 
                                    className="w-full" 
                                    onClick={handlePayment}
                                    disabled={isProcessing || !razorpayLoaded || hasProAccess}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : hasProAccess ? (
                                        'Current Plan'
                                    ) : (
                                        'Upgrade to Pro'
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}
