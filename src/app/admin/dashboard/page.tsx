
"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { PricingManagement } from "@/components/admin/PricingManagement";
import { SubscriptionManagement } from "@/components/admin/SubscriptionManagement";
import { CompoundCodeGenerator } from "@/components/admin/CompoundCodeGenerator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Users, DollarSign, CreditCard, Code } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
            <h1 className="text-4xl font-bold font-headline">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
            Manage users, subscriptions, pricing, and platform features.
            </p>
        </div>
        <Button asChild>
            <Link href="/admin/add-question">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Question
            </Link>
        </Button>
      </header>
      
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            <CreditCard className="h-4 w-4 mr-2" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="pricing">
            <DollarSign className="h-4 w-4 mr-2" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="codegen">
            <Code className="h-4 w-4 mr-2" />
            Code Generator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View all users and perform administrative actions. To bulk upload questions:
                <br />• General questions: <code className="text-xs bg-muted px-1 py-0.5 rounded">npm run bulk-load</code>
                <br />• Technical/CSE questions (30 questions): <code className="text-xs bg-muted px-1 py-0.5 rounded">npm run bulk-load-cse</code>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserManagementTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <SubscriptionManagement />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <PricingManagement />
        </TabsContent>

        <TabsContent value="codegen" className="space-y-4">
          <CompoundCodeGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
