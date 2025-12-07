"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAllUsers } from "@/lib/firestore-users";
import { getUserSubscription, updateUserSubscription } from "@/lib/firestore-subscriptions";
import type { UserProfile, Subscription } from "@/lib/types";
import { Loader2, Search, UserCheck, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SubscriptionManagement() {
  const [users, setUsers] = useState<(UserProfile & { subscription?: Subscription })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<Partial<Subscription>>({
    status: 'free',
    plan: 'free_tier',
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const allUsers = await getAllUsers();
      const usersWithSubscriptions = await Promise.all(
        allUsers.map(async (user) => {
          try {
            const subscription = await getUserSubscription(user.uid);
            return { ...user, subscription };
          } catch (error) {
            return { ...user, subscription: undefined };
          }
        })
      );
      setUsers(usersWithSubscriptions);
    } catch (error) {
      console.error("Failed to load users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load users.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = async (userId: string) => {
    setSelectedUser(userId);
    try {
      const subscription = await getUserSubscription(userId);
      setSubscriptionData({
        status: subscription.status,
        plan: subscription.plan,
        subscriptionId: subscription.subscriptionId,
        trial_end: subscription.trial_end,
        current_period_end: subscription.current_period_end,
      });
    } catch (error) {
      setSubscriptionData({
        status: 'free',
        plan: 'free_tier',
      });
    }
  };

  const handleUpdateSubscription = async () => {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      await updateUserSubscription(selectedUser, subscriptionData);
      await loadUsers();
      toast({
        title: "Success",
        description: "Subscription updated successfully.",
      });
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to update subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update subscription.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.uid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-headline">Subscription Management</h2>
        <p className="text-muted-foreground mt-1">
          Manage user subscriptions and upgrade/downgrade plans.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>
            Search for users by email or user ID to manage their subscriptions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {selectedUser && (
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <Label>Selected User</Label>
                  <p className="text-sm text-muted-foreground">
                    {users.find(u => u.uid === selectedUser)?.email || selectedUser}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Subscription Status</Label>
                  <Select
                    value={subscriptionData.status || 'free'}
                    onValueChange={(value: 'free' | 'pro') => setSubscriptionData({ ...subscriptionData, status: value, plan: value === 'pro' ? 'pro_tier' : 'free_tier' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Input
                    value={subscriptionData.plan || ''}
                    onChange={(e) => setSubscriptionData({ ...subscriptionData, plan: e.target.value })}
                    placeholder="e.g., free_tier, pro_tier"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subscription ID (Optional)</Label>
                  <Input
                    value={subscriptionData.subscriptionId || ''}
                    onChange={(e) => setSubscriptionData({ ...subscriptionData, subscriptionId: e.target.value })}
                    placeholder="Payment provider subscription ID"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateSubscription} disabled={isUpdating}>
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserCheck className="h-4 w-4 mr-2" />
                    )}
                    Update Subscription
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedUser(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No users found.</p>
            ) : (
              filteredUsers.map((user) => (
                <Card
                  key={user.uid}
                  className={`p-4 cursor-pointer hover:bg-secondary transition-colors ${
                    selectedUser === user.uid ? 'border-primary' : ''
                  }`}
                  onClick={() => handleSelectUser(user.uid)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.email || 'No email'}</p>
                      <p className="text-sm text-muted-foreground">{user.uid}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          user.subscription?.status === 'pro' 
                            ? 'default' 
                            : user.subscription?.status === 'trial'
                            ? 'default'
                            : 'secondary'
                        }
                        className={
                          user.subscription?.status === 'trial'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                            : ''
                        }
                      >
                        {user.subscription?.status === 'trial' 
                          ? `Trial (${user.subscription.trial_end ? Math.ceil((user.subscription.trial_end - Date.now()) / (24 * 60 * 60 * 1000)) : '?'}d left)`
                          : user.subscription?.status || 'free'}
                      </Badge>
                      {user.roles?.includes('admin') && (
                        <Badge variant="outline">Admin</Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

